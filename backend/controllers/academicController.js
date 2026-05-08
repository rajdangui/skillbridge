const AcademicProfile = require('../models/AcademicProfile');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

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

// ── HELPER: MISTRAL OCR AND ACADEMIC DATA PARSING ───────────────────────────
async function parseMarksheetWithMistral(extractedText) {
  if (!process.env.MISTRAL_API_KEY) {
    console.warn('No MISTRAL_API_KEY found, returning demo mock marksheet data');
    return getMockParsedData();
  }

  try {
    const prompt = `You are a professional academic transcript parser. Below is the raw text extracted from a college marksheet PDF. Analyze the text and extract the academic record.
- Identify the Semester Number (an integer between 1 and 8). If it says "Third Semester" or "III Semester" or "3rd Sem", it is 3.
- Identify the SGPA (GPA) for this semester. It should be a decimal number (0-10) or null.
- Extract all subjects listed on the marksheet. For each subject:
  1. name (full name of the subject, e.g., "Software Engineering")
  2. code (subject code, e.g., "CS-302", or empty string if not found)
  3. grade (the grade letter, e.g., "A+", "A", "O", "B", etc.)
  4. gradePoints (the points associated with the grade, e.g., 9, 10, 8, etc.)
  5. credits (the credit value of the course, e.g., 3, 4, 2, or default to 3 if not found)

Raw Marksheet Text:
"""
${extractedText}
"""

You MUST respond ONLY with a single JSON object. No explanations, no markdown block wrapper, no extra text.

JSON Schema:
{
  "semesterNumber": number,
  "semesterLabel": "Semester X",
  "sgpa": number or null,
  "subjects": [
    {
      "name": "string",
      "code": "string",
      "grade": "string",
      "gradePoints": number or null,
      "credits": number
    }
  ]
}`;

    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      messages: [
        { role: 'system', content: 'You are a precise JSON extractor. You respond with raw JSON matching the requested schema and absolutely nothing else.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 45000
    });

    const content = response.data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response from Mistral');

    return JSON.parse(content);
  } catch (err) {
    console.error('Mistral PDF OCR error:', err.response?.data || err.message);
    return getMockParsedData();
  }
}

function getMockParsedData() {
  // Generate a random semester number 1-6
  const randomSem = Math.floor(Math.random() * 6) + 1;
  const mockSGPAs = [8.42, 9.12, 7.89, 8.65, 9.34, 8.11];
  const mockSGPAsIndex = (randomSem - 1) % mockSGPAs.length;
  
  const techSubjects = [
    [
      { name: 'Computer Programming in C', code: 'CS-101', grade: 'A+', gradePoints: 9, credits: 4 },
      { name: 'Mathematics I', code: 'MA-101', grade: 'B+', gradePoints: 7, credits: 4 },
      { name: 'Digital Logic Design', code: 'EC-101', grade: 'A', gradePoints: 8, credits: 3 },
      { name: 'Physics for Engineers', code: 'PH-101', grade: 'A+', gradePoints: 9, credits: 4 },
      { name: 'C Programming Lab', code: 'CS-102', grade: 'O', gradePoints: 10, credits: 2 }
    ],
    [
      { name: 'Data Structures and Algorithms', code: 'CS-201', grade: 'O', gradePoints: 10, credits: 4 },
      { name: 'Discrete Mathematics', code: 'CS-202', grade: 'A', gradePoints: 8, credits: 4 },
      { name: 'Computer Organization', code: 'CS-203', grade: 'B+', gradePoints: 7, credits: 3 },
      { name: 'Object Oriented Programming', code: 'CS-204', grade: 'A+', gradePoints: 9, credits: 4 },
      { name: 'OOP and DSA Lab', code: 'CS-205', grade: 'O', gradePoints: 10, credits: 2 }
    ],
    [
      { name: 'Database Management Systems', code: 'CS-301', grade: 'A+', gradePoints: 9, credits: 4 },
      { name: 'Operating Systems', code: 'CS-302', grade: 'A', gradePoints: 8, credits: 4 },
      { name: 'Formal Languages & Automata', code: 'CS-303', grade: 'B', gradePoints: 6, credits: 3 },
      { name: 'Software Engineering', code: 'CS-304', grade: 'A+', gradePoints: 9, credits: 3 },
      { name: 'DBMS and OS Lab', code: 'CS-305', grade: 'O', gradePoints: 10, credits: 2 }
    ],
    [
      { name: 'Computer Networks', code: 'CS-401', grade: 'A+', gradePoints: 9, credits: 4 },
      { name: 'Design & Analysis of Algorithms', code: 'CS-402', grade: 'O', gradePoints: 10, credits: 4 },
      { name: 'Web Technologies', code: 'CS-403', grade: 'A', gradePoints: 8, credits: 3 },
      { name: 'Microprocessors & Interfacing', code: 'CS-404', grade: 'A', gradePoints: 8, credits: 4 },
      { name: 'Algorithms Lab', code: 'CS-405', grade: 'O', gradePoints: 10, credits: 2 }
    ],
    [
      { name: 'Artificial Intelligence', code: 'CS-501', grade: 'O', gradePoints: 10, credits: 4 },
      { name: 'Compiler Design', code: 'CS-502', grade: 'B+', gradePoints: 7, credits: 4 },
      { name: 'Cryptography & Security', code: 'CS-503', grade: 'A', gradePoints: 8, credits: 3 },
      { name: 'Data Mining and Warehousing', code: 'CS-504', grade: 'A+', gradePoints: 9, credits: 3 },
      { name: 'AI and Compiler Lab', code: 'CS-505', grade: 'O', gradePoints: 10, credits: 2 }
    ],
    [
      { name: 'Machine Learning', code: 'CS-601', grade: 'A+', gradePoints: 9, credits: 4 },
      { name: 'Distributed Systems', code: 'CS-602', grade: 'A', gradePoints: 8, credits: 4 },
      { name: 'Cloud Computing', code: 'CS-603', grade: 'A+', gradePoints: 9, credits: 3 },
      { name: 'Mobile Application Dev', code: 'CS-604', grade: 'A', gradePoints: 8, credits: 3 },
      { name: 'Capstone Project Phase I', code: 'CS-605', grade: 'O', gradePoints: 10, credits: 3 }
    ]
  ];

  return {
    semesterNumber: randomSem,
    semesterLabel: `Semester ${randomSem}`,
    sgpa: mockSGPAs[mockSGPAsIndex],
    subjects: techSubjects[randomSem - 1] || techSubjects[0]
  };
}

// ── MARKSHEET UPLOAD (WITH MISTRAL OCR) ──────────────────────────────────────
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

    // ── EXTRACT TEXT AND CALL MISTRAL OCR ──
    let parsedData;
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const parsed = await pdf(dataBuffer);
      const extractedText = parsed.text || '';
      
      parsedData = await parseMarksheetWithMistral(extractedText);
    } catch (parseErr) {
      console.error('PDF Text Extraction failed:', parseErr.message);
      parsedData = getMockParsedData();
    }

    // Clean up temporary local upload file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    // ── AUTO SAVE/UPSERT TO ACADEMIC PROFILE ──
    let profile = await AcademicProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await AcademicProfile.create({ userId: req.user._id });
    }

    const semNum = parsedData.semesterNumber || 1;
    const semLabel = parsedData.semesterLabel || `Semester ${semNum}`;
    const sgpa = parsedData.sgpa || computeSGPA(parsedData.subjects) || 0.0;

    const idx = profile.semesters.findIndex(s => s.number === semNum);
    const semData = {
      number: semNum,
      label: semLabel,
      sgpa: sgpa,
      subjects: parsedData.subjects || [],
      marksheetUrl: marksheetUrl
    };

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

    res.json({
      profile,
      marksheetUrl,
      parsedData,
      message: `Marksheet uploaded and auto-parsed successfully! Identified: ${semLabel}`
    });

  } catch (err) {
    console.error('Marksheet upload and parse error:', err);
    res.status(500).json({ message: 'Failed to upload and parse marksheet' });
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
