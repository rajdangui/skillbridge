const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

exports.toggleSaved = async (req, res) => {
  try {
    const { opportunityId } = req.body;
    if (!opportunityId) return res.status(400).json({ message: 'Opportunity ID required' });
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    const user = await User.findById(req.user._id);
    const isSaved = user.savedOpportunities.map(id => id.toString()).includes(opportunityId);
    if (isSaved) {
      user.savedOpportunities = user.savedOpportunities.filter(id => id.toString() !== opportunityId);
    } else {
      user.savedOpportunities.push(opportunityId);
    }
    await user.save();
    res.json({ saved: !isSaved, message: !isSaved ? 'Opportunity saved' : 'Removed from saved', savedCount: user.savedOpportunities.length });
  } catch (err) {
    res.status(500).json({ message: 'Error updating saved' });
  }
};

exports.getSaved = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: 'savedOpportunities', populate: { path: 'postedBy', select: 'name companyName' } });
    res.json({ opportunities: user.savedOpportunities || [] });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved' });
  }
};

exports.checkSaved = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedOpportunities');
    const isSaved = user.savedOpportunities.map(id => id.toString()).includes(req.params.id);
    res.json({ saved: isSaved });
  } catch (err) {
    res.status(500).json({ message: 'Error checking saved status' });
  }
};
