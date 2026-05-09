const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'company', 'admin'],
    default: 'student'
  },
  // OAuth IDs
  googleId: String,
  githubId: String,
  // Profile
  avatar: String,
  bio: {
    type: String,
    maxlength: 500
  },
  college: String,
  branch: String,
  skills: {
    type: [String],
    default: []
  },
  github: String,
  linkedin: String,
  resume: String, // Cloudinary URL
  // Company specific
  companyName: String,
  companyWebsite: String,

  // Portfolio & projects
  website: String,
  portfolio: String,
  projects: {
    type: [{
      name:        { type: String, required: true, trim: true },
      description: { type: String, trim: true, maxlength: 500 },
      techStack:   [String],
      liveUrl:     String,
      repoUrl:     String,
    }],
    default: [],
  },
  // Calculated profile score (cached, recalculated on save)
  profileScore: { type: Number, default: 0, min: 0, max: 100 },

  // Saved opportunities
  savedOpportunities: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' }],
    default: []
  },
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  emailVerifyToken: String,
  emailVerifyExpires: Date,
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true
});

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.githubId;
  delete obj.emailVerifyToken;
  delete obj.emailVerifyExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
