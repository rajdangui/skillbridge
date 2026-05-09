const express = require('express');
const multer = require('multer');
const os = require('os');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { aiLimiter, uploadLimiter } = require('../middleware/security');
const { analyzeResume } = require('../controllers/atsController');

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

// POST /api/ats/analyze
router.post('/analyze', isAuthenticated, uploadLimiter, upload.single('resume'), analyzeResume);

module.exports = router;
