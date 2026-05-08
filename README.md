# SkillBridge: Student Career & Academic Platform

SkillBridge is a full-stack web application built on the MERN stack (MongoDB, Express, React, Node.js). It serves as a unified portal for college students to track their academic progress (semester courses, grades, timetables, and attendance) and transition into professional careers (searching jobs, parsing resumes, generating cover letters, and tracking application workflows).

---

## Technical Architecture

The platform uses a decoupled client-server architecture with real-time updates and generative AI integrations:

```mermaid
graph TD
  Client["React Frontend (Vite)"]
  Server["Express.js Server (Node.js)"]
  DB[("MongoDB (Mongoose)")]
  AI["Google Gemini Flash API"]
  CDN["Cloudinary (File Storage)"]
  WS["Socket.io (WebSockets)"]
  Mail["Nodemailer (SMTP)"]

  Client <-->|HTTP / REST API| Server
  Client <-->|WebSockets (Live Alerts)| WS
  Server <--> WS
  Server <--> DB
  Server -->|JSON Prompts / Schema| AI
  Server -->|Binary Uploads| CDN
  Server -->|Verification Emails| Mail
```

---

## Core System Modules

### 1. Academic Dashboard
* **Grade Tracker:** Log courses and grades per semester to calculate active GPA and cumulative CGPA.
* **Attendance Ledger:** Subject-wise log with a built-in forecast engine calculating minimum class attendance to meet academic compliance (75%).
* **Timetable Scheduler:** Visual weekly calendar grid supporting custom subject slot configurations.
* **Automated Grade Ingestion:** Upload academic marksheets (PDF format). The server parses the document using generative vision extraction, returning subject credits and grades to auto-populate the ledger.

### 2. Career & Application Engine
* **Job Board:** Dynamic filtering for internships, full-time jobs, freelance opportunities, and part-time roles.
* **Interactive Auth Portal:** Features a split-pane registration UI with a large interactive Owl assistant whose gaze tracks password visibility states.
* **Application Lifecycle:** Apply with verified profiles, attach parsed resumes, and track recruitment progress (Submitted, Review, Shortlisted, Selected, Rejected) in real-time over WebSockets.

### 3. AI Copilot Integration (Google Gemini)
* **Skill Gap Analyzer:** Matches profile skills against opportunity descriptions to compute match percentage scores and outline structured learning pathways.
* **ATS Resume Audit:** Reviews plain-text resume strings to output formatting checklists, visual structural scores, and keyword suggestions.
* **Cover Letter Generator:** Context-aware editor compiling background details into letters matching specific tone attributes (Professional, Enthusiastic, Concise, Creative).
* **General AI Assistant:** Inline chat module with conversational memory synchronized to student dashboard metrics.

### 4. Live Portfolio & PDF Compiler
* **Resume Builder:** Interactive editor supporting 3 system templates: Minimalist, Modern, and ATS-Safe.
* **A4 Preview Canvas:** Native sandbox displaying layout previews updated instantly upon input changes.
* **Static Export:** Exports resumes directly to clean, standard PDF documents.

---

## Directory Layout

```text
skillbridge/
├── backend/
│   ├── config/          # Passport configurations & DB adapters
│   ├── controllers/     # Route controller actions (Auth, Academic, Ops, etc.)
│   ├── middleware/      # Auth guards, request validation rules
│   ├── models/          # Mongoose Schema definitions
│   ├── routes/          # Express route registrations
│   └── server.js        # Server entry point (Express, Socket.io, HTTP)
└── frontend/
    ├── src/
    │   ├── components/  # Shared layouts, visual components, notification feeds
    │   ├── context/     # Global state controls (AuthContext)
    │   ├── pages/       # Route page containers
    │   └── services/    # Axiom API network bindings
    └── vite.config.js   # Vite configuration script
```

---

## Environment Configuration

Create a `backend/.env` file with the following variables:

```ini
# Core Configuration
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillbridge
SESSION_SECRET=YOUR_32_CHAR_RANDOM_SECRET_KEY
CLIENT_URL=http://localhost:5173

# Third-Party Integrations
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
YOUTUBE_API_KEY=YOUR_YOUTUBE_DATA_API_V3_KEY

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SECRET

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_EMAIL_ADDRESS
SMTP_PASS=YOUR_EMAIL_PASSWORD
```

---

## Installation & Setup

### Prerequisites
* **Node.js** v18.0.0 or higher.
* **MongoDB** server running locally or accessible via cloud URI.

### 1. Initialize Server Environment
```bash
cd backend
npm install
# Set up .env parameters before starting
npm run dev
```

### 2. Initialize Frontend App
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` to browse the portal.

---

## API References

| Context Path | Authorized | Primary Resource Description |
| :--- | :---: | :--- |
| `/api/auth` | Public / Session | Login, Registration, Password Resets, Google/GitHub OAuth links. |
| `/api/users` | Session Protected | Profile configurations, skill mappings, and resume parsing. |
| `/api/opportunities` | Session Protected | Job opportunities feed, listing creation, and public stats telemetry. |
| `/api/applications` | Recruiter / Student | Apply to jobs, retrieve student logs, and modify application stages. |
| `/api/academic` | Student Only | Marks rosters, timetable matrixes, and PDF mark sheet grades analysis. |
| `/api/notifications`| User Protected | Read unread count, delete notification items, and push updates. |
| `/api/resume` | Student Only | Retrieve portfolio state, save resume fields, and print PDF logs. |

---

## Academic Submission Details

* **Project Title:** SkillBridge — Student Career & Academic Management System
* **Author:** Raj Dangui
* **PRN:** 1292240011
* **Degree Program:** SY MCA (Master of Computer Applications)
* **Institution:** MIT World Peace University (MIT-WPU), Pune, India
* **Faculty Advisor:** Prof. Sudeepta Banerji
