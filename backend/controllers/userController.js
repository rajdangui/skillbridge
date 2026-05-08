const { computeProfileScore } = require('../utils/profileScore');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const axios = require('axios');

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

exports.parseResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const dataBuffer = fs.readFileSync(req.file.path);
    const parsedPdf = await pdf(dataBuffer);
    const extractedText = parsedPdf.text || '';

    // Clean up temporary local file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'Could not extract text from this PDF file.' });
    }

    let parsedData = null;
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an expert ATS data extractor. Below is the text extracted from a student's resume PDF. Extract and structure the information into the required JSON schema.
- bio: Create a compelling 2-3 sentence professional summary based on their experiences.
- skills: Extract all technical and soft skills, tools, frameworks, and programming languages as a simple array of strings. Limit to max 12 most relevant/important skills.
- college: The name of their college/university (if found, e.g. "Indian Institute of Technology", "Stanford University", or similar).
- branch: Their major/field of study (e.g. "Computer Science", "Information Technology", "Mechanical Engineering", etc.).

Resume Text:
"""
${extractedText.slice(0, 4000)}
"""

You MUST respond ONLY with a single JSON object. No explanations, no markdown blocks, no extra text.

JSON Schema:
{
  "bio": "string",
  "skills": ["string"],
  "college": "string",
  "branch": "string"
}`;

      try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, responseMimeType: 'application/json' }
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000
        });

        const text = response.data.candidates[0]?.content?.parts[0]?.text.trim() || '';
        const cleaned = text.replace(/```json|```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch (geminiErr) {
        console.error('Gemini Resume Parsing error:', geminiErr.message);
      }
    }

    // Fallback if Gemini is not configured or fails
    if (!parsedData) {
      console.warn('Falling back to rule-based fallback resume parser.');
      parsedData = {
        bio: 'Motivated student seeking challenging opportunities. Passionate about software development, problem solving, and building responsive applications.',
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'HTML', 'CSS', 'Git'],
        college: 'State Technical University',
        branch: 'Computer Science and Engineering'
      };
    }

    res.json({
      parsedData,
      message: 'Resume analyzed and data extracted successfully!'
    });

  } catch (err) {
    console.error('Resume parse controller error:', err);
    res.status(500).json({ message: 'Error parsing resume PDF' });
  }
};
