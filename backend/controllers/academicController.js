const AcademicProfile = require('../models/AcademicProfile');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// ── HELPER: compute CGPA from all semesters ────────────────────────────────
function computeCGPA(semesters) {
  const valid = semesters.filter(s => s.sgpa && s.sgpa > 0);
  if (!valid.length) return null;
  const totalGPA = valid.reduce((sum, s) => sum + s.sgpa, 0);
  return Math.round((totalGPA / valid.length) * 100) / 100;
}

// ── HELPER: compute SGPA from subjects ────────────────────────────────────
function computeSGPA(subjects) {
  const valid = subjects.filter(s => s.gradePoints != null && s.credits > 0);
  if (!valid.length) return null;
  const totalCredits = valid.reduce((sum, s) => sum + s.credits, 0);
  const totalPoints  = valid.reduce((sum, s) => sum + (s.gradePoints * s.credits), 0);
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
}

// ── GET or CREATE profile ──────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    let profile = await AcademicProfile.findOne({ userId: req.user._id });
    if (!profile) {
      // Auto-create empty profile from User's college/branch
      const User = require('../models/User');
      const user = await User.findById(req.user._id).select('college branch');
      profile = await AcademicProfile.create({
        userId: req.user._id,
        institution: user.college || '',
        branch: user.branch || '',
      });
    }
    res.json({ profile });
  } catch (err) {
    console.error('Get academic profile error:', err);
    res.status(500).json({ message: 'Failed to fetch academic profile' });
  }
};

// ── UPDATE profile meta ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['institution','degree','branch','enrollmentNo','currentSem','totalSems','cgpa','totalCredits','earnedCredits'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// ── SEMESTERS ──────────────────────────────────────────────────────────────
exports.upsertSemester = async (req, res) => {
  try {
    const { number, label, sgpa, subjects } = req.body;
    if (!number) return res.status(400).json({ message: 'Semester number required' });

    let profile = await AcademicProfile.findOne({ userId: req.user._id });
    if (!profile) profile = await AcademicProfile.create({ userId: req.user._id });

    const idx = profile.semesters.findIndex(s => s.number === number);
    const semData = { number, label: label || `Semester ${number}`, subjects: subjects || [] };

    // Auto-compute SGPA if not provided but subjects have grades
    if (!sgpa && subjects?.length) {
      const computed = computeSGPA(subjects);
      if (computed) semData.sgpa = computed;
    } else if (sgpa) {
      semData.sgpa = sgpa;
    }

    if (idx >= 0) {
      profile.semesters[idx] = { ...profile.semesters[idx].toObject(), ...semData };
    } else {
      profile.semesters.push(semData);
    }

    profile.semesters.sort((a, b) => a.number - b.number);

    // Recompute CGPA
    const newCGPA = computeCGPA(profile.semesters);
    if (newCGPA) profile.cgpa = newCGPA;

    await profile.save();
    res.json({ profile });
  } catch (err) {
    console.error('Upsert semester error:', err);
    res.status(500).json({ message: 'Failed to save semester' });
  }
};

// ── ASSIGNMENTS CRUD ───────────────────────────────────────────────────────
exports.addAssignment = async (req, res) => {
  try {
    const { title, subject, dueDate, notes, priority, maxMarks } = req.body;
    if (!title || !subject || !dueDate) return res.status(400).json({ message: 'Title, subject, and due date required' });

    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { assignments: { title, subject, dueDate, notes, priority: priority||'medium', maxMarks: maxMarks||100, status: new Date(dueDate) < new Date() ? 'overdue' : 'pending' } } },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to add assignment' }); }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    ['title','subject','dueDate','status','marks','maxMarks','notes','priority'].forEach(k => {
      if (req.body[k] !== undefined) updates[`assignments.$.${k}`] = req.body[k];
    });
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id, 'assignments._id': id },
      { $set: updates },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to update assignment' }); }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { assignments: { _id: req.params.id } } },
      { new: true }
    );
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to delete assignment' }); }
};

// ── EXAMS CRUD ─────────────────────────────────────────────────────────────
exports.addExam = async (req, res) => {
  try {
    const { title, subject, date, time, venue, type, syllabus, maxMarks } = req.body;
    if (!title || !subject || !date) return res.status(400).json({ message: 'Title, subject, and date required' });
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { exams: { title, subject, date, time, venue, type: type||'other', syllabus, maxMarks: maxMarks||100, status: 'upcoming' } } },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to add exam' }); }
};

exports.updateExam = async (req, res) => {
  try {
    const updates = {};
    ['title','subject','date','time','venue','type','syllabus','status','marks','maxMarks'].forEach(k => {
      if (req.body[k] !== undefined) updates[`exams.$.${k}`] = req.body[k];
    });
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id, 'exams._id': req.params.id },
      { $set: updates },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Exam not found' });
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to update exam' }); }
};

exports.deleteExam = async (req, res) => {
  try {
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { exams: { _id: req.params.id } } },
      { new: true }
    );
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to delete exam' }); }
};

// ── TIMETABLE ──────────────────────────────────────────────────────────────
exports.saveTimetable = async (req, res) => {
  try {
    const { slots } = req.body; // full replacement
    if (!Array.isArray(slots)) return res.status(400).json({ message: 'Slots array required' });
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { timetable: slots } },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to save timetable' }); }
};

// ── ATTENDANCE ─────────────────────────────────────────────────────────────
exports.updateAttendance = async (req, res) => {
  try {
    const { attendance } = req.body; // array of {subject, present, total, minRequired}
    if (!Array.isArray(attendance)) return res.status(400).json({ message: 'Attendance array required' });
    const profile = await AcademicProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { attendance } },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) { res.status(500).json({ message: 'Failed to update attendance' }); }
};

// ── MARKSHEET UPLOAD (No AI) ──────────────────────────────────────────────────
exports.parseMarksheet = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    let marksheetUrl = null;
    try {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'raw',
        folder: 'skillbridge/marksheets',
        public_id: `marksheet_${req.user._id}_${Date.now()}`,
      });
      marksheetUrl = uploadResult.secure_url;
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
      
      const uploadDir = path.join(__dirname, '..', 'uploads', 'marksheets');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `marksheet_${req.user._id}_${Date.now()}${path.extname(req.file.originalname) || '.pdf'}`;
      const localPath = path.join(uploadDir, fileName);
      fs.copyFileSync(req.file.path, localPath);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      marksheetUrl = `${baseUrl}/uploads/marksheets/${fileName}`;
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({
      marksheetUrl,
      message: 'Marksheet uploaded successfully'
    });

  } catch (err) {
    console.error('Marksheet upload error:', err);
    res.status(500).json({ message: 'Failed to upload marksheet' });
  }
};

// ── APPLY MANUAL MARKSHEET ───────────────────────────────────────────────────
exports.applyParsedData = async (req, res) => {
  try {
    const { semesterLabel, marksheetUrl } = req.body;
    if (!semesterLabel || !marksheetUrl) return res.status(400).json({ message: 'Semester label and marksheet URL required' });

    let profile = await AcademicProfile.findOne({ userId: req.user._id });
    if (!profile) profile = await AcademicProfile.create({ userId: req.user._id });

    // Derive a number from label if possible
    const semNumMatch = semesterLabel.match(/\d+/);
    const semNum = semNumMatch ? parseInt(semNumMatch[0]) : (profile.semesters.length + 1);

    const idx = profile.semesters.findIndex(s => s.label === semesterLabel || s.number === semNum);
    const semData = {
      number: semNum,
      label: semesterLabel,
      marksheetUrl: marksheetUrl,
      subjects: [] // AI parsing removed
    };
    if (idx >= 0) profile.semesters[idx] = { ...profile.semesters[idx].toObject(), ...semData };
    else profile.semesters.push(semData);
    
    profile.semesters.sort((a, b) => a.number - b.number);

    await profile.save();
    res.json({ profile, message: 'Marksheet added successfully' });
  } catch (err) {
    console.error('Apply marksheet error:', err);
    res.status(500).json({ message: 'Failed to save marksheet' });
  }
};

// ── DELETE SEMESTER ──────────────────────────────────────────────────────────
exports.deleteSemester = async (req, res) => {
  try {
    const semNum = parseInt(req.params.number);
    if (isNaN(semNum)) return res.status(400).json({ message: 'Invalid semester number' });

    const profile = await AcademicProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.semesters = profile.semesters.filter(s => s.number !== semNum);
    await profile.save();
    res.json({ profile, message: 'Semester removed successfully' });
  } catch (err) {
    console.error('Delete semester error:', err);
    res.status(500).json({ message: 'Failed to delete semester' });
  }
};
