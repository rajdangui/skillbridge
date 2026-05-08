const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const {
  applyToOpportunity,
  getStudentApplications,
  getOpportunityApplications,
  updateApplicationStatus,
  getMyApplications,
  getCompanyApplications,
  getCompanyStats
} = require('../controllers/applicationController');

router.post('/apply', isAuthenticated, applyToOpportunity);
router.get('/my', isAuthenticated, getMyApplications);
router.get('/company', isAuthenticated, getCompanyApplications);
router.get('/company/stats', isAuthenticated, getCompanyStats);
router.get('/student/:id', isAuthenticated, getStudentApplications);
router.get('/opportunity/:id', isAuthenticated, getOpportunityApplications);
router.put('/status/:id', isAuthenticated, updateApplicationStatus);

module.exports = router;
