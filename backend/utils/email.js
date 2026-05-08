const nodemailer = require('nodemailer');

// Create transporter — supports Gmail, Outlook, or any SMTP
const createTransporter = () => {
  // Use Ethereal (fake SMTP) in development if no mail config set
  if (!process.env.MAIL_USER) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal_user@ethereal.email',
        pass: 'ethereal_pass'
      }
    });
  }

  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS // Use App Password for Gmail
    }
  });
};

const transporter = createTransporter();

const FROM = `"SkillBridge" <${process.env.MAIL_USER || 'noreply@skillbridge.dev'}>`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── EMAIL TEMPLATES ─────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f3f0; font-family: 'DM Sans', -apple-system, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; }
    .header {
      background: #211b17; padding: 28px 36px;
      border-radius: 16px 16px 0 0;
      display: flex; align-items: center; gap: 12px;
    }
    .logo-mark {
      width: 36px; height: 36px; background: #e8ff5a;
      border-radius: 8px; display: inline-flex;
      align-items: center; justify-content: center;
      font-weight: 800; font-size: 13px; color: #211b17;
    }
    .logo-text { color: #f5f3f0; font-size: 18px; font-weight: 700; }
    .logo-text span { color: #e8ff5a; }
    .body { background: #fff; padding: 36px; }
    h1 { font-size: 22px; font-weight: 700; color: #211b17; margin-bottom: 12px; }
    p { font-size: 15px; color: #5a4d41; line-height: 1.7; margin-bottom: 16px; }
    .btn {
      display: inline-block; background: #e8ff5a; color: #211b17;
      font-weight: 700; font-size: 15px; padding: 14px 32px;
      border-radius: 12px; text-decoration: none; margin: 8px 0 20px;
    }
    .divider { border: none; border-top: 1px solid #e8e4dc; margin: 24px 0; }
    .small { font-size: 12px; color: #9a8d78; }
    .code {
      background: #f5f3f0; border: 1px solid #d0c9bb;
      border-radius: 8px; padding: 12px 20px;
      font-family: monospace; font-size: 28px; font-weight: 700;
      letter-spacing: 8px; color: #211b17; text-align: center;
      margin: 16px 0;
    }
    .footer {
      background: #f5f3f0; padding: 20px 36px;
      border-radius: 0 0 16px 16px;
      text-align: center; font-size: 12px; color: #9a8d78;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-mark">SB</div>
      <span class="logo-text">Skill<span>Bridge</span></span>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} SkillBridge · You're receiving this because you signed up at skillbridge.dev
    </div>
  </div>
</body>
</html>
`;

// ── SEND FUNCTIONS ───────────────────────────────────────

exports.sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;

  const html = baseTemplate(`
    <h1>Verify your email address</h1>
    <p>Hi ${user.name}, welcome to SkillBridge! Click the button below to verify your email and activate your account.</p>
    <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    <hr class="divider">
    <p class="small">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
    <p class="small">Or copy this URL: ${verifyUrl}</p>
  `);

  const info = await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Verify your SkillBridge account',
    html
  });

  // In development, log the preview URL (Ethereal)
  if (!process.env.MAIL_USER) {
    console.log('📧 Email preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

exports.sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <h1>Reset your password</h1>
    <p>Hi ${user.name}, we received a request to reset your SkillBridge password.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <hr class="divider">
    <p class="small">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    <p class="small">Or copy this URL: ${resetUrl}</p>
  `);

  const info = await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Reset your SkillBridge password',
    html
  });

  if (!process.env.MAIL_USER) {
    if (process.env.NODE_ENV !== 'production') console.log('📧 Password reset preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

exports.sendWelcomeEmail = async (user) => {
  const html = baseTemplate(`
    <h1>You're in, ${user.name}! 🎉</h1>
    <p>Your SkillBridge account is verified and ready. Here's what you can do next:</p>
    <p>→ <strong>Complete your profile</strong> — add skills, bio and resume<br>
       → <strong>Browse opportunities</strong> — internships and jobs from top companies<br>
       → <strong>Explore the Learning Hub</strong> — search any skill, watch tutorials in-app</p>
    <a href="${CLIENT_URL}/dashboard" class="btn">Go to Dashboard</a>
    <hr class="divider">
    <p class="small">Need help? Reply to this email and we'll get back to you.</p>
  `);

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Welcome to SkillBridge 🚀',
    html
  });
};
