const express = require('express');
const multer = require('multer');
const os = require('os');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateProfileUpdate, handleValidation, uploadLimiter } = require('../middleware/security');
const { getProfile, updateProfile, uploadResume, getAllStudents, parseResume } = require('../controllers/userController');

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

router.get('/students',      isAuthenticated, getAllStudents);
router.get('/profile/:id',   getProfile);
router.put('/profile/:id',   isAuthenticated, validateProfileUpdate, handleValidation, updateProfile);
router.post('/resume',       isAuthenticated, uploadLimiter, upload.single('resume'), uploadResume);
router.post('/parse-resume', isAuthenticated, uploadLimiter, upload.single('resume'), parseResume);

module.exports = router;
