const express = require('express');
const router = express.Router();
const { isAuthenticated, isStudent } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/security');
const { chat } = require('../controllers/chatController');

// POST /api/chat
router.post('/', isAuthenticated, chatLimiter, chat);

module.exports = router;
