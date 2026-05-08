const { computeProfileScore } = require('../utils/profileScore');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -googleId -githubId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow user to update their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const allowedFields = ['name', 'bio', 'college', 'branch', 'skills', 'github', 'linkedin', 'companyName', 'companyWebsite', 'website', 'portfolio', 'projects'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle skills as array
    if (typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updatedUser = await User.findById(req.params.id);
    if (updatedUser) {
      const previewUser = { ...updatedUser.toObject(), ...updates };
      updates.profileScore = computeProfileScore(previewUser);
    }
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw',
      folder: 'skillbridge/resumes',
      public_id: `resume_${req.user._id}_${Date.now()}`,
      format: 'pdf'
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resume: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({ message: 'Resume uploaded', resumeUrl: result.secure_url, user });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ message: 'Error uploading resume' });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email college branch skills avatar bio')
      .limit(50);
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students' });
  }
};
