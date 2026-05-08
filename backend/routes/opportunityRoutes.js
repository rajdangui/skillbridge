const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateOpportunity, handleValidation } = require('../middleware/security');
const {
  createOpportunity, getAllOpportunities, getOpportunityById,
  updateOpportunity, deleteOpportunity, getMyOpportunities,
  getPublicStats
} = require('../controllers/opportunityController');

router.get('/',             getAllOpportunities);
router.get('/public-stats', getPublicStats);
router.get('/my',           isAuthenticated, getMyOpportunities);
router.get('/:id',          getOpportunityById);
router.post('/',      isAuthenticated, validateOpportunity, handleValidation, createOpportunity);
router.put('/:id',    isAuthenticated, validateOpportunity, handleValidation, updateOpportunity);
router.delete('/:id', isAuthenticated, deleteOpportunity);

module.exports = router;
