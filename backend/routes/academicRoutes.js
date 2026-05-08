const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { uploadLimiter, marksheetLimiter } = require('../middleware/security');
const ac = require('../controllers/academicController');

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `marksheet_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files accepted'));
  }
});

// Profile
router.get('/',           isAuthenticated, ac.getProfile);
router.put('/',           isAuthenticated, ac.updateProfile);

// Semesters
router.post('/semester',  isAuthenticated, ac.upsertSemester);

// Assignments
router.post('/assignments',            isAuthenticated, ac.addAssignment);
router.put('/assignments/:id',         isAuthenticated, ac.updateAssignment);
router.delete('/assignments/:id',      isAuthenticated, ac.deleteAssignment);

// Exams
router.post('/exams',                  isAuthenticated, ac.addExam);
router.put('/exams/:id',               isAuthenticated, ac.updateExam);
router.delete('/exams/:id',            isAuthenticated, ac.deleteExam);

// Timetable (full replace)
router.put('/timetable',               isAuthenticated, ac.saveTimetable);

// Attendance
router.put('/attendance',              isAuthenticated, ac.updateAttendance);

// Marksheet upload
router.post('/marksheet/parse',        isAuthenticated, uploadLimiter, marksheetLimiter, upload.single('marksheet'), ac.parseMarksheet);
router.post('/marksheet/apply',        isAuthenticated, ac.applyParsedData);
router.delete('/semester/:number',     isAuthenticated, ac.deleteSemester);

module.exports = router;
