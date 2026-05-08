require('dotenv').config();
const express    = require('express');
const http       = require('http');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
const passport   = require('passport');
const cors       = require('cors');
const { Server } = require('socket.io');

const connectDB  = require('./config/db');
require('./config/passport');

const {
  securityHeaders,
  sanitize,
  preventHPP,
  generalLimiter,
} = require('./middleware/security');

// ── Routes ────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const opportunityRoutes  = require('./routes/opportunityRoutes');
const applicationRoutes  = require('./routes/applicationRoutes');
const savedRoutes        = require('./routes/savedRoutes');
const learningRoutes     = require('./routes/learningRoutes');
const coverLetterRoutes  = require('./routes/coverLetterRoutes');
const skillGapRoutes     = require('./routes/skillGapRoutes');
const atsRoutes          = require('./routes/atsRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const academicRoutes     = require('./routes/academicRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const resumeRoutes       = require('./routes/resumeRoutes');
const adminRoutes        = require('./routes/adminRoutes');

// ── Connect DB ────────────────────────────────────────────────────
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(sanitize);
app.use(preventHPP);
app.use(generalLimiter);

// ── Serve Local Uploads (Fallback for Cloudinary) ─────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Session ───────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/skillbridge',
    touchAfter: 24 * 3600,
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/saved',         savedRoutes);
app.use('/api/learn',         learningRoutes);
app.use('/api/coverletter',   coverLetterRoutes);
app.use('/api/skillgap',      skillGapRoutes);
app.use('/api/ats',           atsRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/academic',      academicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/resume',        resumeRoutes);
app.use('/api/admin',         adminRoutes);

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry — this record already exists' });
  }
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── HTTP + Socket.io ──────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

global.io = io;

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (userId && typeof userId === 'string') {
      socket.join(`user_${userId}`);
    }
  });
  socket.on('disconnect', () => {});
});

httpServer.listen(PORT, () => {
  console.log(`\n🚀 SkillBridge API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
