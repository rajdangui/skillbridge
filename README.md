# <p align="center"><img src="https://img.shields.io/badge/SkillBridge-Student%20Career%20%26%20Academic%20Platform-3b82f6?style=for-the-badge&logo=google-chrome&logoColor=white" width="450"/></p>

<p align="center">
  <img src="https://img.shields.io/github/license/rajdangui/skillbridge?style=flat-square&color=blue" alt="License" />
  <img src="https://img.shields.io/github/stars/rajdangui/skillbridge?style=flat-square&color=yellow" alt="Stars" />
  <img src="https://img.shields.io/github/forks/rajdangui/skillbridge?style=flat-square&color=lightgrey" alt="Forks" />
  <img src="https://img.shields.io/github/directory-file-count/rajdangui/skillbridge?style=flat-square&color=green" alt="Files" />
</p>

<p align="center">
  <strong>SkillBridge</strong> is an advanced, full-stack student career and academic platform built with the <strong>MERN stack</strong> (MongoDB, Express, React, Node.js). It connects college students directly with verified opportunities while offering cutting-edge <strong>AI tools</strong> (powered by Google Gemini), dynamic timetables, automated mark sheet parsers, and live notification streams.
</p>

---

## 🎨 Technology Stack & Shields

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-%234aa356.svg?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img src="https://img.shields.io/badge/Node.js-6da55f?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white" />
</p>

---

## 🔌 Systems Architecture

Here is how the core systems interact in real-time across the platform:

```mermaid
graph TD
  Client["💻 React Client (Vite & Tailwind)"]
  Server["⚙️ Express.js REST API Server"]
  Database[("💾 MongoDB (Mongoose Models)")]
  Gemini["🧠 Google Gemini API (AI Orchestration)"]
  Cloudinary["☁️ Cloudinary Storage (File Uploads)"]
  Sockets["⚡ Socket.io (Live Notifications)"]
  Nodemailer["📧 SMTP / Nodemailer (Email Triggers)"]

  Client -->|HTTPS REST Queries| Server
  Client <-->|WebSockets (Real-time Alerts)| Sockets
  Server <--> Sockets
  Server <--> Database
  Server -->|Resume/Marksheet Analysis| Gemini
  Server -->|Grades Extraction & Verification| Gemini
  Server -->|Resume/Marksheet Uploads| Cloudinary
  Server -->|Account Verification & Reminders| Nodemailer
```

---

## ✨ Core Platforms & Feature Sets

### 🏢 1. Career Hub
* **Dynamic Postings:** Access live jobs, freelance work, and part-time internships directly from verified recruiting companies.
* **Intelligent Gaze Owl (`AuthPage.jsx`):** A beautiful left-panel split layout featuring a giant interactive Owl mascot whose pupils track your password inputs organically when made visible.
* **Single-Click Apply:** Instantly apply to roles with profile-synced resumes and personalized cover letters.
* **Real-time Tracker:** Monitor application progresses (Submitted, Under Review, Shortlisted, Accepted, or Rejected) with live update events.

### 🧠 2. AI Intelligence Suite (Google Gemini-Driven)
* **Cover Letter Generator:** Creates premium, targeted cover letters in seconds with 4 tone adjustments (*Professional*, *Enthusiastic*, *Concise*, *Creative*).
* **Skill Gap Analyzer:** Audits your resume skills against specific requirements to output matching scores and step-by-step learning roadmaps.
* **ATS Resume Checker:** Scores your raw resume content against ATS validation criteria to guarantee maximum callback rates.
* **Contextual Assistant:** A full-context floating chat assistant holding references to your profile metrics to guide you personally.

### 📅 3. Academic & College Dashboard
* **Grades & Semester Ledger:** Keep track of semester-wise GPA, CGPA, and dynamic performance trends.
* **Timetable Builder:** High-fidelity interactive calendar slots to configure student schedules.
* **Attendance Ledger & Forecasts:** Automatically computes attendance statistics, marking warning states or class-cut requirements to stay above college thresholds (e.g., 75%).
* **AI Marksheet PDF Parser:** Upload any university grade sheets as a PDF to automatically scan, extract, verify, and ingest subject records into your ledger!

### 📄 4. Professional Resume Builder
* **Dynamic Templates:** Render resumes in 3 responsive templates: *Minimalist*, *Modern*, or *ATS-Safe*.
* **Live A4 Sandbox:** Real-time preview panel adapting to typing inputs instantaneously.
* **PDF Compile Engine:** Single-tap download to compile your portfolio into high-quality, ATS-compliant static PDFs.

---

## ⚙️ Environment Variables Mappings

To configure and run the application successfully, copy `backend/.env.example` to `backend/.env` and fill in:

| Key Variable | Status | Role & Integration |
| :--- | :---: | :--- |
| `MONGO_URI` | 🚨 Required | Connection URI for MongoDB Atlas or Local Database. |
| `SESSION_SECRET` | 🚨 Required | Highly secure random cryptographic key for Passport.js session tokens. |
| `CLIENT_URL` | 🚨 Required | URL of the frontend app (e.g., `http://localhost:5173` locally). |
| `GEMINI_API_KEY` | 🧠 AI Core | Enables Gemini-powered Cover Letters, ATS scoring, Marksheet uploads, and Chat. |
| `YOUTUBE_API_KEY` | 🍿 Media | Powers search, categories, and video results inside the Learning Hub stream. |
| `CLOUDINARY_URL` | 📁 Storage | Handles automated profile pictures, parsed marksheets, and PDF resume storing. |
| `SMTP_HOST` / `PORT` | 📧 Mailer | SMTP server triggers for user registration verify pins and reset tickets. |

---

## 🛠️ Quick Start & Running Locally

### 1. Prerequisite Checklist
* **Node.js** v18 or higher installed.
* **MongoDB** daemon running locally or active Cloud cluster.

### 2. Run Backend Server
```bash
# Navigate to backend directory
cd backend

# Install production dependencies
npm install

# Set up configuration variables
cp .env.example .env

# Start dev server with hot-reloading
npm run dev
```

### 3. Run Frontend App
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install UI assets & libraries
npm install

# Start Vite dev server
npm run dev
```
The application will launch on `http://localhost:5173` natively.

---

## 🚪 API Routing Layout

| Route Namespace | Functionality |
| :--- | :--- |
| `/api/auth` | Login, Register, Local + OAuth sessions, Email Pins, Password Resets. |
| `/api/users` | Profile CRUD, custom student/company details, and profile scores. |
| `/api/opportunities` | Live Job, Internship, Freelance postings and Dynamic Stats calculations. |
| `/api/applications` | Apply to opportunities, modify recruiter actions, and review logs. |
| `/api/academic` | Grades tracking, timetables, assignments, and AI mark sheet scanning. |
| `/api/notifications` | Live application alerts, attendance prompts, and low-grade warnings. |
| `/api/resume` | Professional portfolio profiles, template setups, and PDF compilers. |

---

## 🎓 Academic Recognition & Enrollment

<div align="center">
  <table style="width: 100%; text-align: left; border-collapse: collapse;">
    <tr>
      <td style="padding: var(--space-4); border: 1px solid var(--border-subtle); background: var(--bg-surface);">
        <strong>🏫 Project Designation:</strong> SkillBridge — Student Career & Academic Management System
      </td>
      <td style="padding: var(--space-4); border: 1px solid var(--border-subtle); background: var(--bg-surface);">
        <strong>🎓 Academic Scholar:</strong> Raj Dangui
      </td>
    </tr>
    <tr>
      <td style="padding: var(--space-4); border: 1px solid var(--border-subtle); background: var(--bg-surface);">
        <strong>🏢 Board of Instructors:</strong> Prof. Sudeepta Banerji
      </td>
      <td style="padding: var(--space-4); border: 1px solid var(--border-subtle); background: var(--bg-surface);">
        <strong>📝 Student Identifier:</strong> MIT WPU PRN: 1292240011
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding: var(--space-4); border: 1px solid var(--border-subtle); background: var(--bg-surface); text-align: center;">
        <strong>🏫 Faculty of Management & Technology — MIT World Peace University, Pune, India</strong>
      </td>
    </tr>
  </table>
</div>
