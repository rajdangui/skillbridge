const rateLimit    = require('express-rate-limit');
const helmet       = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp          = require('hpp');
const { body, validationResult } = require('express-validator');

// ── Security headers ──────────────────────────────────────────────
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      fontSrc:     ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc:  ["'self'", 'https://generativelanguage.googleapis.com', 'wss:', 'ws:'],
      frameSrc:    ["'self'", 'https://www.youtube.com', 'https://youtube.com', 'http://localhost:5000'],
      frameAncestors: ["'self'", 'http://localhost:5173'],
      mediaSrc:    ["'self'", 'https:'],
      objectSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false, // Let CSP frameAncestors handle it instead of X-Frame-Options
});

// ── NoSQL injection sanitize ──────────────────────────────────────
exports.sanitize = mongoSanitize({ allowDots: true });

// ── HTTP Parameter Pollution ──────────────────────────────────────
exports.preventHPP = hpp({ whitelist: ['skills', 'type', 'status', 'sort'] });

// ── Rate limiters ─────────────────────────────────────────────────
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

exports.forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { message: 'Too many password reset requests. Please try again in an hour.' },
});

exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { message: 'Upload limit reached. Please try again in an hour.' },
});

exports.aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { message: 'AI generation limit reached. Please try again in an hour.' },
});

exports.chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 60,
  message: { message: 'Chat limit reached (60/hour). Please try again later.' },
});

exports.marksheetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { message: 'Marksheet parse limit reached (10/hour). Please try again later.' },
});

// ── Validation error handler ──────────────────────────────────────
exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// ── Register validation ───────────────────────────────────────────
exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min:2, max:100 }).withMessage('Name must be 2–100 characters'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password').isLength({ min:6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student','company']).withMessage('Role must be student or company'),
];

// ── Login validation ──────────────────────────────────────────────
exports.validateLogin = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Password reset validation ─────────────────────────────────────
exports.validatePasswordReset = [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min:6 }).withMessage('Password must be at least 6 characters'),
];

// ── Opportunity validation ────────────────────────────────────────
exports.validateOpportunity = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max:200 }).withMessage('Title max 200 chars'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max:5000 }).withMessage('Description max 5000 chars'),
  body('type').isIn(['internship','job','freelance','part-time'])
    .withMessage('Invalid opportunity type'),
];

// ── Profile update validation ─────────────────────────────────────
exports.validateProfileUpdate = [
  body('name').optional().trim().isLength({ min:2, max:100 }).withMessage('Name must be 2–100 chars'),
  body('bio').optional().trim().isLength({ max:500 }).withMessage('Bio max 500 chars'),
  body('github').optional({ checkFalsy:true }).trim()
    .isURL({ require_protocol:true }).withMessage('Invalid GitHub URL'),
  body('linkedin').optional({ checkFalsy:true }).trim()
    .isURL({ require_protocol:true }).withMessage('Invalid LinkedIn URL'),
  body('website').optional({ checkFalsy:true }).trim()
    .isURL({ require_protocol:true }).withMessage('Invalid website URL'),
];
