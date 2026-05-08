const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  register, login, logout, getCurrentUser,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword, validateResetToken
} = require('../controllers/authController');
const {
  authLimiter, forgotPasswordLimiter,
  validateRegister, validateLogin, validatePasswordReset, handleValidation
} = require('../middleware/security');

// Auth — with rate limiting + validation
router.post('/register', authLimiter, validateRegister, handleValidation, register);
router.post('/login',    authLimiter, validateLogin,    handleValidation, login);
router.get('/logout',    logout);
router.get('/me',        getCurrentUser);

// Email verification
router.get('/verify-email',          verifyEmail);
router.post('/resend-verification',  authLimiter, resendVerification);

// Password reset
router.post('/forgot-password',      forgotPasswordLimiter, forgotPassword);
router.post('/reset-password',       authLimiter, validatePasswordReset, handleValidation, resetPassword);
router.get('/validate-reset-token',  validateResetToken);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => res.redirect(`${process.env.CLIENT_URL}/dashboard`)
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => res.redirect(`${process.env.CLIENT_URL}/dashboard`)
);

module.exports = router;
