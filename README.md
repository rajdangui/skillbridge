# SkillBridge — Student Career & Academic Platform

A full-stack MERN application connecting Indian college students with internships and jobs, featuring AI-powered tools, a college academic dashboard, and real-time notifications.

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
# Backend
cd skillbridge/backend
cp .env.example .env        # fill in your values
npm install
node server.js

# Frontend (new terminal)
cd skillbridge/frontend
npm install
npm run dev
```

### 2. Open
```
http://localhost:5173
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `SESSION_SECRET` | ✅ | Min 32-char random string |
| `CLIENT_URL` | ✅ | Frontend URL (default: http://localhost:5173) |
| `GEMINI_API_KEY` | ⚡ | Enables AI cover letters, chat, marksheet parsing |
| `YOUTUBE_API_KEY` | ⚡ | Enables Learning Hub video search |
| `CLOUDINARY_*` | ⚡ | Enables resume/marksheet file uploads |
| `GOOGLE_CLIENT_*` | ➕ | Google OAuth login |
| `GITHUB_CLIENT_*` | ➕ | GitHub OAuth login |
| `SMTP_*` | ➕ | Email verification & password reset |
| `PUPPETEER_EXECUTABLE_PATH` | ➕ | PDF export in Resume Builder |

✅ = Required | ⚡ = Enables key features | ➕ = Optional

---

## Features

### Career
- Browse 2,400+ internships and jobs
- Smart skill-based matching
- One-click apply with cover letter
- Application tracker with real-time status
- Save roles for later

### AI Tools (require `GEMINI_API_KEY`)
- **Cover Letter Generator** — 4 tones, auto-filled from profile
- **Skill Gap Analyzer** — match score + learning roadmap
- **ATS Resume Checker** — score against ATS systems
- **AI Assistant** — chat bot with full user context

### College Dashboard
- Marks & CGPA tracker per semester
- Assignment & exam manager with deadlines
- Weekly timetable builder
- Attendance tracker with shortfall calculator
- Marksheet PDF upload → AI auto-extract grades

### Resume Builder
- 3 templates: Minimal, Modern, ATS-Safe
- Auto-fills from profile
- Live A4 preview
- PDF export

### Notifications
- Real-time via Socket.io
- Application status changes
- New matching jobs
- Assignment/exam reminders
- Low attendance alerts

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | Passport.js (Local + Google + GitHub) |
| Real-time | Socket.io |
| AI | Google Gemini (gemini-flash-latest) |
| File Storage | Cloudinary |
| Email | Nodemailer |

---

## Project Structure

```
skillbridge/
├── backend/
│   ├── config/          # DB + Passport config
│   ├── controllers/     # Route handlers (14 files)
│   ├── middleware/       # Auth guards, security, rate limiting
│   ├── models/          # Mongoose schemas (5 models)
│   ├── routes/          # Express routers (14 files)
│   ├── utils/           # Email, profile score helpers
│   ├── server.js        # Express + Socket.io entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/  # Navbar, ChatWidget, NotificationBell, etc.
    │   ├── context/     # AuthContext
    │   ├── pages/       # 20 pages
    │   ├── services/    # API client (api.js)
    │   └── App.jsx
    └── vite.config.js
```

---

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, OAuth, verify email, password reset |
| `/api/users` | Profile CRUD, resume upload |
| `/api/opportunities` | Job listings CRUD |
| `/api/applications` | Apply, track, update status |
| `/api/saved` | Bookmark opportunities |
| `/api/learn` | YouTube video search |
| `/api/coverletter` | AI cover letter generation |
| `/api/skillgap` | Skill gap analysis |
| `/api/ats` | Resume ATS scoring |
| `/api/chat` | AI assistant |
| `/api/academic` | College dashboard data |
| `/api/notifications` | Real-time notifications |
| `/api/resume` | Resume builder data + PDF export |
| `/api/admin` | Admin panel (admin role only) |

---

## Deployment (Render)

1. Push to GitHub
2. Create **Web Service** → connect repo → `backend/` root
   - Build: `npm install`
   - Start: `node server.js`
   - Add all env vars
3. Create **Static Site** → connect repo → `frontend/` root
   - Build: `npm install && npm run build`
   - Publish: `dist`
   - Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Update `CLIENT_URL` in backend env to your frontend URL

---

## Academic Information

**Project:** SkillBridge — Student Career Management System  
**Student:** Raj Dangui | PRN: 1292240011  
**Guide:** Prof. Sudeepta Banerji  
**Program:** SY MCA, MIT World Peace University, Pune  
