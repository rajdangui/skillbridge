const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/security');
const rc = require('../controllers/resumeController');

router.get('/',         isAuthenticated, rc.getResumeData);
router.put('/',         isAuthenticated, rc.saveResumeData);
router.post('/pdf',     isAuthenticated, uploadLimiter, rc.generatePDF);

module.exports = router;
