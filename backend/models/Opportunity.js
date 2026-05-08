const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    default: 'Remote'
  },
  type: {
    type: String,
    enum: ['internship', 'job', 'freelance', 'part-time'],
    default: 'internship'
  },
  stipend: String,
  duration: String,
  applyDeadline: Date,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text index for search
opportunitySchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
