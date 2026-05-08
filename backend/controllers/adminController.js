const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');

// ── OVERVIEW STATS ────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers, totalStudents, totalCompanies,
      totalOpportunities, activeOpportunities,
      totalApplications,
      recentUsers, recentOpportunities,
      unverifiedUsers,
      applicationsByStatus
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'company' }),
      Opportunity.countDocuments(),
      Opportunity.countDocuments({ isActive: true }),
      Application.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt isEmailVerified'),
      Opportunity.find().sort({ createdAt: -1 }).limit(5).populate('postedBy', 'name').select('title company type createdAt isActive'),
      User.countDocuments({ isEmailVerified: false }),
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // User growth over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newOppsThisWeek = await Opportunity.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const appStatusMap = {};
    applicationsByStatus.forEach(s => { appStatusMap[s._id] = s.count; });

    res.json({
      stats: {
        users: { total: totalUsers, students: totalStudents, companies: totalCompanies, unverified: unverifiedUsers, newThisWeek: newUsersThisWeek },
        opportunities: { total: totalOpportunities, active: activeOpportunities, newThisWeek: newOppsThisWeek },
        applications: { total: totalApplications, byStatus: appStatusMap }
      },
      recentUsers,
      recentOpportunities
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// ── USERS ─────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, verified } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (verified === 'false') filter.isEmailVerified = false;
    if (verified === 'true') filter.isEmailVerified = true;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password -googleId -githubId -emailVerifyToken -passwordResetToken')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    res.json({ users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -googleId -githubId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const [applications, opportunities] = await Promise.all([
      Application.find({ studentId: req.params.id }).populate('opportunityId', 'title company').limit(10),
      Opportunity.find({ postedBy: req.params.id }).limit(10)
    ]);
    res.json({ user, applications, opportunities });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, isEmailVerified, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isEmailVerified !== undefined) updates.isEmailVerified = isEmailVerified;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Application.deleteMany({ studentId: req.params.id }),
      Opportunity.deleteMany({ postedBy: req.params.id })
    ]);

    res.json({ message: 'User and related data deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// ── OPPORTUNITIES ─────────────────────────────────────────
exports.getAllOpportunities = async (req, res) => {
  try {
    const { search, type, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter).populate('postedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Opportunity.countDocuments(filter)
    ]);
    res.json({ opportunities, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching opportunities' });
  }
};

exports.toggleOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    opportunity.isActive = !opportunity.isActive;
    await opportunity.save();
    res.json({ message: `Opportunity ${opportunity.isActive ? 'activated' : 'deactivated'}`, opportunity });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling opportunity' });
  }
};

exports.deleteOpportunity = async (req, res) => {
  try {
    await Promise.all([
      Opportunity.findByIdAndDelete(req.params.id),
      Application.deleteMany({ opportunityId: req.params.id })
    ]);
    res.json({ message: 'Opportunity and applications deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting opportunity' });
  }
};

// ── APPLICATIONS ──────────────────────────────────────────
exports.getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('studentId', 'name email college')
        .populate('opportunityId', 'title company type')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application.countDocuments(filter)
    ]);
    res.json({ applications, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications' });
  }
};
