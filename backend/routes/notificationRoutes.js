const express = require('express');
const router  = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const nc = require('../controllers/notificationController');

router.get('/',              isAuthenticated, nc.getNotifications);
router.get('/unread-count',  isAuthenticated, nc.getUnreadCount);
router.post('/reminders',    isAuthenticated, nc.generateAcademicReminders);

// IMPORTANT: /all/read MUST come before /:id/read — otherwise Express matches "all" as an id
router.put('/all/read',      isAuthenticated, nc.markAllRead);
router.put('/:id/read',      isAuthenticated, nc.markRead);
router.delete('/:id',        isAuthenticated, nc.deleteNotification);

module.exports = router;
