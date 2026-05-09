const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { generateToken, hashToken } = require('../utils/tokens');

// Lazy-load email to avoid crash if nodemailer not installed
let emailUtils = null;
const getEmailUtils = () => {
  if (!emailUtils) {
    try {
      emailUtils = require('../utils/email');
    } catch (e) {
      console.warn('Email utils not available:', e.message);
      emailUtils = {
        sendVerificationEmail: async () => {},
        sendPasswordResetEmail: async () => {},
        sendWelcomeEmail: async () => {}
      };
    }
  }
  return emailUtils;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, college, branch } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'student',
      college: college?.trim() || '',
      branch: branch?.trim() || '',
      isEmailVerified: true
    });

    // Send welcome email — non-blocking, never crash on failure
    getEmailUtils().sendWelcomeEmail(user)
      .catch(err => console.warn('Welcome email failed (non-fatal):', err.message));

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('req.login error after register:', loginErr);
        return res.status(500).json({ message: 'Account created but auto-login failed. Please log in manually.' });
      }
      res.status(201).json({
        message: 'Account created successfully! Welcome to SkillBridge.',
        user: user.toJSON(),
        emailSent: true
      });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = await User.findOne({
      emailVerifyToken: hashToken(token),
      emailVerifyExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });
    if (user.isEmailVerified) return res.json({ message: 'Email already verified', alreadyVerified: true });

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    getEmailUtils().sendWelcomeEmail(user).catch(() => {});
    res.json({ message: 'Email verified successfully! Welcome to SkillBridge.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No account found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

    const rawToken = generateToken();
    user.emailVerifyToken = hashToken(rawToken);
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await getEmailUtils().sendVerificationEmail(user, rawToken);
    res.json({ message: 'Verification email resent' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Error resending verification' });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Passport authenticate error:', err);
      return res.status(500).json({ message: 'Authentication error. Please try again.' });
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid email or password' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('req.login error:', loginErr);
        return res.status(500).json({ message: 'Login session error. Please try again.' });
      }
      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        emailVerified: user.isEmailVerified
      });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    req.session.destroy(() => {
      res.clearCookie('sb.sid');
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
};

exports.getCurrentUser = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({ user: req.user });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return same message to prevent email enumeration
    if (!user || !user.password) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken = generateToken();
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await getEmailUtils().sendPasswordResetEmail(user, rawToken);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error processing request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Reset token is invalid or has expired' });

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.json({ valid: false });
    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: Date.now() }
    });
    res.json({ valid: !!user });
  } catch (err) {
    res.json({ valid: false });
  }
};
