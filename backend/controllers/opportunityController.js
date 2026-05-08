const User = require('../models/User');
const { createNotification } = require('./notificationController');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');

exports.createOpportunity = async (req, res) => {
  try {
    const { title, company, description, requiredSkills, location, type, stipend, duration, applyDeadline } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company and description are required' });
    }

    const skills = Array.isArray(requiredSkills)
      ? requiredSkills
      : (requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean);

    const opportunity = await Opportunity.create({
      title,
      company,
      description,
      requiredSkills: skills,
      location: location || 'Remote',
      type: type || 'internship',
      stipend,
      duration,
      applyDeadline,
      postedBy: req.user._id
    });

    // Async: notify up to 50 students whose skills match (fire-and-forget)
    setImmediate(async () => {
      try {
        if (!skills.length) return;
        const matchingStudents = await User.find({
          role: 'student',
          skills: { $in: skills.map(s => new RegExp(s, 'i')) },
          _id: { $ne: req.user._id },
        }).select('_id').limit(50).lean();

        for (const student of matchingStudents) {
          await createNotification(
            student._id,
            'new_job_match',
            '💼 New Role Matches Your Skills',
            `"${title}" at ${company} matches your skill set. Check it out!`,
            `/opportunities/${opportunity._id}`,
            { jobTitle: title, company }
          );
          if (global.io) global.io.to(`user_${student._id}`).emit('notification', { type: 'new_job_match' });
        }
      } catch (e) { /* non-critical */ }
    });

    res.status(201).json({ message: 'Opportunity posted', opportunity });
  } catch (err) {
    console.error('Create opportunity error:', err);
    res.status(500).json({ message: 'Error creating opportunity' });
  }
};

exports.getAllOpportunities = async (req, res) => {
  try {
    const { type, location, skill, search, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (location) filter.location = new RegExp(location, 'i');
    if (skill) filter.requiredSkills = { $in: [new RegExp(skill, 'i')] };
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Opportunity.countDocuments(filter);
    const opportunities = await Opportunity.find(filter)
      .populate('postedBy', 'name email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      opportunities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching opportunities' });
  }
};

exports.getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('postedBy', 'name email companyName companyWebsite avatar');
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json({ opportunity });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching opportunity' });
  }
};

exports.updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    if (opportunity.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = req.body;
    if (updates.requiredSkills && typeof updates.requiredSkills === 'string') {
      updates.requiredSkills = updates.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updated = await Opportunity.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: 'Opportunity updated', opportunity: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating opportunity' });
  }
};

exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    if (opportunity.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await opportunity.deleteOne();
    res.json({ message: 'Opportunity deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting opportunity' });
  }
};

exports.getMyOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ opportunities });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching opportunities' });
  }
};

exports.getPublicStats = async (req, res) => {
  try {
    const [totalOpportunities, totalCompanies, totalStudents, totalApplications, acceptedApplications] = await Promise.all([
      Opportunity.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'student' }),
      Application.countDocuments({}),
      Application.countDocuments({ status: 'accepted' })
    ]);

    let placementRate = 94; // fallback
    if (totalApplications > 0) {
      const calculated = Math.round((acceptedApplications / totalApplications) * 100);
      placementRate = calculated > 0 ? Math.min(calculated, 100) : 94;
    }

    res.json({
      opportunitiesCount: totalOpportunities + 100,
      companiesCount: totalCompanies + 100,
      studentsCount: totalStudents + 100,
      placementRate: placementRate
    });
  } catch (err) {
    console.error('Public stats fetch error:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};
