const express = require('express');
const router = express.Router();
const { isAuthenticated, isStudent } = require('../middleware/authMiddleware');
const { analyzeSkillGap, batchAnalyze } = require('../controllers/skillGapController');

// IMPORTANT: /batch/all MUST be before /:opportunityId or Express matches "batch" as an ID
router.get('/batch/all', isAuthenticated, batchAnalyze);
router.get('/:opportunityId', isAuthenticated, analyzeSkillGap);

module.exports = router;
