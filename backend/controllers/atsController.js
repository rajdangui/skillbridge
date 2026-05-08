const axios = require('axios');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

// ── ATS SCORING (no API key needed) ─────────────────────────────────────────
function scoreResumeText(resumeText, opportunity) {
  const text = resumeText.toLowerCase();
  const requiredSkills = opportunity?.requiredSkills || [];
  const results = {
    sections: {},
    keywordMatches: [],
    keywordMissing: [],
    issues: [],
    tips: []
  };

  // 1. Section detection
  const SECTIONS = {
    contact:     ['email', 'phone', 'linkedin', 'github', '@'],
    summary:     ['summary', 'objective', 'profile', 'about'],
    experience:  ['experience', 'work history', 'employment', 'internship', 'intern'],
    education:   ['education', 'university', 'college', 'degree', 'b.tech', 'b.e.', 'mca', 'mba', 'bsc'],
    skills:      ['skills', 'technical skills', 'technologies', 'stack'],
    projects:    ['projects', 'project', 'portfolio'],
    achievements:['achievements', 'awards', 'certifications', 'honors'],
  };
  let sectionScore = 0;
  for (const [section, keywords] of Object.entries(SECTIONS)) {
    const found = keywords.some(k => text.includes(k));
    results.sections[section] = found;
    if (found) sectionScore += section === 'contact' || section === 'education' ? 15 : section === 'experience' || section === 'skills' ? 12 : 8;
    else if (['contact','education','skills','experience'].includes(section)) results.issues.push(`Missing section: ${section.charAt(0).toUpperCase() + section.slice(1)}`);
  }
  sectionScore = Math.min(sectionScore, 40); // max 40 pts

  // 2. Keyword matching against required skills
  let keywordScore = 0;
  requiredSkills.forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      results.keywordMatches.push(skill);
      keywordScore += 2;
    } else {
      results.keywordMissing.push(skill);
    }
  });
  const keywordMax = requiredSkills.length > 0 ? Math.min(requiredSkills.length * 2, 30) : 25;
  keywordScore = Math.min(keywordScore, 30); // max 30 pts

  // 3. Formatting checks
  let formatScore = 0;
  // Word count
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 250 && wordCount <= 800) { formatScore += 5; }
  else if (wordCount < 250) results.issues.push('Resume too short — aim for 300–600 words');
  else results.issues.push('Resume may be too long — ATS systems prefer 1 page');

  // Action verbs
  const ACTION_VERBS = ['developed', 'built', 'designed', 'implemented', 'created', 'improved', 'led', 'managed', 'optimized', 'delivered', 'architected', 'engineered', 'automated', 'integrated', 'deployed', 'reduced', 'increased', 'launched'];
  const verbsFound = ACTION_VERBS.filter(v => text.includes(v));
  if (verbsFound.length >= 5) formatScore += 5;
  else { formatScore += verbsFound.length; results.tips.push(`Use more action verbs (found ${verbsFound.length}/5+ recommended): built, developed, implemented, deployed...`); }

  // Quantified achievements (numbers)
  const hasNumbers = /\d+[%x]|\d+\s*(users|requests|ms|seconds|hours|days|repos|projects|lines)/i.test(resumeText);
  if (hasNumbers) { formatScore += 5; }
  else results.tips.push('Add quantified achievements: "Reduced load time by 40%", "Served 10K+ requests/day"');

  // Email format
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  if (!hasEmail) results.issues.push('No email address detected');
  else formatScore += 5;

  // No special characters that break ATS
  const hasProblematicChars = /[│├└─┼●◆▪▸►]/g.test(resumeText);
  if (hasProblematicChars) { results.issues.push('Special characters (│●◆) detected — some ATS systems cannot parse them'); }
  else formatScore += 5;

  formatScore = Math.min(formatScore, 30); // max 30 pts

  const totalScore = sectionScore + keywordScore + formatScore;

  // Verdict
  let verdict, verdictColor;
  if (totalScore >= 80) { verdict = 'Excellent'; verdictColor = 'green'; }
  else if (totalScore >= 65) { verdict = 'Good'; verdictColor = 'teal'; }
  else if (totalScore >= 50) { verdict = 'Fair'; verdictColor = 'amber'; }
  else { verdict = 'Needs Work'; verdictColor = 'red'; }

  // Top tips
  if (results.keywordMissing.length > 0)
    results.tips.push(`Add missing keywords to your resume: ${results.keywordMissing.slice(0,4).join(', ')}`);
  if (!results.sections.summary)
    results.tips.push('Add a 2–3 line professional summary at the top');
  if (!results.sections.projects)
    results.tips.push('Add a Projects section with 2–3 relevant builds');

  return {
    totalScore,
    sectionScore,
    keywordScore,
    formatScore,
    verdict,
    verdictColor,
    sections: results.sections,
    keywordMatches: results.keywordMatches,
    keywordMissing: results.keywordMissing,
    issues: results.issues.slice(0, 5),
    tips: results.tips.slice(0, 5),
    wordCount,
    actionVerbsFound: verbsFound.length,
    hasQuantifiedAchievements: hasNumbers
  };
}

// ── AI IMPROVEMENT SUGGESTIONS ──────────────────────────────────────────────
async function getAISuggestions(resumeText, opportunity, scoreData) {
  const prompt = `You are an ATS (Applicant Tracking System) expert and senior recruiter reviewing a student resume.

RESUME TEXT:
${resumeText.slice(0, 2000)}

TARGET ROLE: ${opportunity?.title || 'General'} at ${opportunity?.company || 'a tech company'}
REQUIRED SKILLS: ${(opportunity?.requiredSkills || []).join(', ') || 'Not specified'}

ATS SCORE: ${scoreData.totalScore}/100 (${scoreData.verdict})
MISSING KEYWORDS: ${scoreData.keywordMissing.join(', ') || 'None'}
DETECTED ISSUES: ${scoreData.issues.join('; ') || 'None'}

Provide exactly 5 specific, actionable improvement suggestions. Be concrete — give example rewrites where helpful.

Format: Return a JSON array of 5 strings. Each string is one suggestion. No markdown, no preamble.
Example: ["Rewrite your summary to mention React and Node.js", "Add bullet: 'Reduced API latency by 35% using Redis caching'"]`;

  if (process.env.GEMINI_API_KEY) {
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, responseMimeType: 'application/json' }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    try {
      const text = response.data.candidates[0]?.content?.parts[0]?.text.trim() || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch { return null; }
  }
  return null;
}

// ── MAIN CONTROLLER ──────────────────────────────────────────────────────────
exports.analyzeResume = async (req, res) => {
  try {
    const { resumeText, opportunityId } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: 'Resume text is required (min 50 characters)' });
    }

    const student = await User.findById(req.user._id).select('name skills resume');

    let opportunity = null;
    if (opportunityId) {
      opportunity = await Opportunity.findById(opportunityId).select('title company requiredSkills description type');
    }

    // Run algorithmic scoring (always available, no API key needed)
    const scoreData = scoreResumeText(resumeText, opportunity);

    // Try to get AI suggestions (requires API key, gracefully falls back)
    let aiSuggestions = null;
    try {
      aiSuggestions = await getAISuggestions(resumeText, opportunity, scoreData);
    } catch (aiErr) {
      console.warn('AI suggestions unavailable:', aiErr.message);
    }

    res.json({
      ...scoreData,
      aiSuggestions,
      hasAI: !!aiSuggestions,
      studentName: student.name,
      targetRole: opportunity ? `${opportunity.title} at ${opportunity.company}` : 'General ATS Check',
      hasResume: !!student.resume,
    });

  } catch (err) {
    console.error('ATS analysis error:', err);
    res.status(500).json({ message: 'ATS analysis failed' });
  }
};
