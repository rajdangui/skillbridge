const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'application_status',   // company updated your application
      'new_job_match',        // new job posted matching your skills
      'assignment_due',       // assignment due in 24h
      'exam_upcoming',        // exam in 48h
      'attendance_low',       // attendance below threshold
      'profile_incomplete',   // nudge to complete profile
      'application_received', // company got a new applicant
      'system',               // general platform message
    ],
  },
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  link:    { type: String, trim: true },   // href to navigate to on click
  read:    { type: Boolean, default: false, index: true },
  // Optional metadata for rich display
  meta: {
    company:     String,
    jobTitle:    String,
    status:      String,
    subjectName: String,
  },
}, { timestamps: true });

// Auto-expire notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Compound index for fast unread count queries
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
