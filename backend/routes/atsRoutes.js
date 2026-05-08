const express = require('express');
const router = express.Router();
const { isAuthenticated, isStudent } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/security');
const { analyzeResume } = require('../controllers/atsController');

// POST /api/ats/analyze
router.post('/analyze', isAuthenticated, aiLimiter, analyzeResume);

module.exports = router;
