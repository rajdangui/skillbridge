const express = require('express');
const router = express.Router();
const { isAuthenticated, isStudent } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/security');
const { generateCoverLetter } = require('../controllers/coverLetterController');

router.post('/generate', isAuthenticated, aiLimiter, generateCoverLetter);

module.exports = router;
