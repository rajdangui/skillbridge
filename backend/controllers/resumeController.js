const User = require('../models/User');

// ── GET resume data for builder (profile fields) ──────────────────────────
exports.getResumeData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('name email college branch skills bio github linkedin website portfolio projects resume avatar');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resume data' });
  }
};

// ── SAVE resume data (upserts profile fields) ────────────────────────────
exports.saveResumeData = async (req, res) => {
  try {
    const allowed = ['name','bio','college','branch','skills','github','linkedin','website','portfolio','projects'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { computeProfileScore } = require('../utils/profileScore');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    user.profileScore = computeProfileScore(user);
    await user.save();

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save resume data' });
  }
};

// ── GENERATE PDF via Puppeteer ────────────────────────────────────────────
exports.generatePDF = async (req, res) => {
  try {
    const { html, filename = 'resume.pdf' } = req.body;
    if (!html) return res.status(400).json({ message: 'HTML content required' });

    // Try Puppeteer — optional dep, graceful fallback
    let puppeteer;
    try { puppeteer = require('puppeteer-core'); } catch (_) {
      return res.status(503).json({ message: 'PDF generation not available. Install puppeteer-core and set PUPPETEER_EXECUTABLE_PATH.' });
    }

    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH
      || process.env.CHROME_PATH
      || '/usr/bin/chromium-browser'
      || '/usr/bin/google-chrome';

    const browser = await puppeteer.launch({
      executablePath: execPath,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
      headless: 'new',
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top:'12mm', right:'12mm', bottom:'12mm', left:'12mm' },
    });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({ message: 'PDF generation failed: ' + err.message });
  }
};
