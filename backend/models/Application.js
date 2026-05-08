const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  resume: String, // URL or filename
  coverLetter: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'accepted', 'rejected'],
    default: 'applied'
  },
  notes: String // Company internal notes
}, {
  timestamps: true
});

// Prevent duplicate applications
applicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
