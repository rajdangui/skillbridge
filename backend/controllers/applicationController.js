const { createNotification } = require('./notificationController');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');

exports.applyToOpportunity = async (req, res) => {
  try {
    const { opportunityId, coverLetter } = req.body;
    if (!opportunityId) return res.status(400).json({ message: 'Opportunity ID required' });

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const existing = await Application.findOne({ studentId: req.user._id, opportunityId });
    if (existing) return res.status(409).json({ message: 'Already applied to this opportunity' });

    const application = await Application.create({
      studentId: req.user._id,
      opportunityId,
      resume: req.user.resume,
      coverLetter,
    });

    // Notify company — non-critical
    try {
      const opp = await Opportunity.findById(opportunityId).select('postedBy title company');
      if (opp?.postedBy) {
        await createNotification(
          opp.postedBy,
          'application_received',
          'New Application Received',
          `A student applied to "${opp.title}". Review their profile.`,
          `/applications?opportunity=${opportunityId}`,
          { jobTitle: opp.title }
        );
        if (global.io) global.io.to(`user_${opp.postedBy}`).emit('notification', { type: 'application_received' });
      }
    } catch (_) {}

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ message: 'Error submitting application' });
  }
};

exports.getStudentApplications = async (req, res) => {
  try {
    const studentId = req.params.id;
    if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const applications = await Application.find({ studentId })
      .populate('opportunityId', 'title company location type stipend')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

exports.getOpportunityApplications = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    if (opportunity.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const applications = await Application.find({ opportunityId: req.params.id })
      .populate('studentId', 'name email college branch skills resume avatar')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('opportunityId');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.opportunityId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const oldStatus = application.status;
    application.status = status;
    if (notes) application.notes = notes;
    await application.save();

    // Notify student on status change
    const STATUS_MESSAGES = {
      reviewed:    'Your application is being reviewed.',
      shortlisted: 'Great news - you have been shortlisted!',
      accepted:    'Congratulations - you have been accepted!',
      rejected:    'Your application was not successful this time.',
    };

    if (STATUS_MESSAGES[status] && status !== oldStatus) {
      const jobTitle = application.opportunityId?.title || 'a role';
      const company  = application.opportunityId?.company || '';
      const notifTitle = status === 'accepted'
        ? 'Application Accepted!'
        : status === 'shortlisted'
        ? 'You have been Shortlisted!'
        : 'Application Update';

      await createNotification(
        application.studentId?._id || application.studentId,
        'application_status',
        notifTitle,
        `${STATUS_MESSAGES[status]} Role: ${jobTitle}${company ? ' at ' + company : ''}.`,
        '/applications',
        { company, jobTitle, status }
      );

      if (global.io) {
        global.io.to(`user_${application.studentId?._id || application.studentId}`)
          .emit('notification', { type: 'application_status' });
      }
    }

    res.json({ message: 'Application status updated', application });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Error updating application' });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .populate('opportunityId', 'title company location type stipend isActive')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

// Get ALL applications across all of a company's postings
exports.getCompanyApplications = async (req, res) => {
  try {
    const myOpps = await Opportunity.find({ postedBy: req.user._id }).select('_id');
    const oppIds = myOpps.map(o => o._id);

    const applications = await Application.find({ opportunityId: { $in: oppIds } })
      .populate('studentId', 'name email college branch skills resume avatar')
      .populate('opportunityId', 'title company type')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    console.error('Company applications error:', err);
    res.status(500).json({ message: 'Error fetching company applications' });
  }
};

// Get aggregate stats for company dashboard
exports.getCompanyStats = async (req, res) => {
  try {
    const myOpps = await Opportunity.find({ postedBy: req.user._id }).select('_id');
    const oppIds = myOpps.map(o => o._id);

    const [totalApplicants, pendingReview, shortlisted, accepted, reviewed] = await Promise.all([
      Application.countDocuments({ opportunityId: { $in: oppIds } }),
      Application.countDocuments({ opportunityId: { $in: oppIds }, status: 'applied' }),
      Application.countDocuments({ opportunityId: { $in: oppIds }, status: 'shortlisted' }),
      Application.countDocuments({ opportunityId: { $in: oppIds }, status: 'accepted' }),
      Application.countDocuments({ opportunityId: { $in: oppIds }, status: 'reviewed' }),
    ]);

    res.json({ totalApplicants, pendingReview, shortlisted, accepted, reviewed });
  } catch (err) {
    console.error('Company stats error:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

