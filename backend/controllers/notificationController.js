const Notification = require('../models/Notification');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const AcademicProfile = require('../models/AcademicProfile');

// ── GET notifications (paginated) ─────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, read: false }),
    ]);

    res.json({ notifications, total, unreadCount, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// ── GET unread count only (for navbar badge polling) ─────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch count' });
  }
};

// ── MARK as read (single or all) ─────────────────────────────────────────
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;  // if "all", mark all
    if (id === 'all') {
      await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    } else {
      await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: { read: true } });
    }
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark read' });
  }
};


// ── MARK ALL as read ──────────────────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    res.json({ unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all read' });
  }
};

// ── DELETE notification ───────────────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete' });
  }
};

// ── GENERATE academic reminders (called on dashboard load) ────────────────
exports.generateAcademicReminders = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.json({ generated: 0 });

    const academic = await AcademicProfile.findOne({ userId: req.user._id });
    if (!academic) return res.json({ generated: 0 });

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const generated = [];

    // Assignment due in 24h
    for (const a of (academic.assignments || [])) {
      if (a.status !== 'pending') continue;
      const due = new Date(a.dueDate);
      if (due > now && due <= in24h) {
        // Only create if not already notified today
        const exists = await Notification.findOne({
          userId: req.user._id,
          type: 'assignment_due',
          'meta.subjectName': a.title,
          createdAt: { $gte: new Date(now.setHours(0,0,0,0)) },
        });
        if (!exists) {
          await Notification.create({
            userId: req.user._id,
            type: 'assignment_due',
            title: '📝 Assignment Due Tomorrow',
            message: `"${a.title}" for ${a.subject} is due tomorrow.`,
            link: '/college-dashboard',
            meta: { subjectName: a.title },
          });
          generated.push('assignment_due');
        }
      }
    }

    // Exam in 48h
    for (const e of (academic.exams || [])) {
      if (e.status !== 'upcoming') continue;
      const examDate = new Date(e.date);
      if (examDate > now && examDate <= in48h) {
        const exists = await Notification.findOne({
          userId: req.user._id,
          type: 'exam_upcoming',
          'meta.subjectName': e.title,
          createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) },
        });
        if (!exists) {
          await Notification.create({
            userId: req.user._id,
            type: 'exam_upcoming',
            title: '📋 Exam in 2 Days',
            message: `${e.title} (${e.subject}) is on ${new Date(e.date).toLocaleDateString()}.`,
            link: '/college-dashboard',
            meta: { subjectName: e.title },
          });
          generated.push('exam_upcoming');
        }
      }
    }

    // Low attendance
    for (const att of (academic.attendance || [])) {
      if (att.total < 5) continue;
      const pct = Math.round((att.present / att.total) * 100);
      if (pct < (att.minRequired || 75)) {
        const exists = await Notification.findOne({
          userId: req.user._id,
          type: 'attendance_low',
          'meta.subjectName': att.subject,
          createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // once every 3 days
        });
        if (!exists) {
          await Notification.create({
            userId: req.user._id,
            type: 'attendance_low',
            title: '⚠️ Low Attendance',
            message: `Your attendance in ${att.subject} is ${pct}% — below the required ${att.minRequired || 75}%.`,
            link: '/college-dashboard',
            meta: { subjectName: att.subject },
          });
          generated.push('attendance_low');
        }
      }
    }

    res.json({ generated: generated.length, types: generated });
  } catch (err) {
    console.error('Academic reminder error:', err);
    res.status(500).json({ message: 'Failed to generate reminders' });
  }
};

// ── EXPORTED HELPER — create a notification from other controllers ────────
exports.createNotification = async (userId, type, title, message, link = '', meta = {}) => {
  try {
    const notif = await Notification.create({ userId, type, title, message, link, meta });
    return notif;
  } catch (err) {
    console.error('createNotification error:', err.message);
    return null;
  }
};
