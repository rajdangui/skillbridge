const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const {
  getStats,
  getAllUsers, getUserById, updateUser, deleteUser,
  getAllOpportunities, toggleOpportunity, deleteOpportunity,
  getAllApplications
} = require('../controllers/adminController');

// Admin-only middleware
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// All routes require admin
router.use(isAdmin);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Opportunities
router.get('/opportunities', getAllOpportunities);
router.patch('/opportunities/:id/toggle', toggleOpportunity);
router.delete('/opportunities/:id', deleteOpportunity);

// Applications
router.get('/applications', getAllApplications);

module.exports = router;
