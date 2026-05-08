# SkillBridge Project Instructions

## Project Overview
SkillBridge is a full-stack MERN (MongoDB, Express, React, Node.js) application acting as a Student Career & Academic Platform. It connects students with internships and jobs, providing AI-powered tools, an academic dashboard, and real-time notifications. 

## Key Technologies
- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Real-time:** Socket.io
- **AI & Storage:** Google Gemini API, Cloudinary, Nodemailer
- **Authentication:** Passport.js (Local, Google, GitHub)

## Directory Structure
- `backend/`: Contains the Express server setup.
  - `server.js`: Entry point.
  - `models/`: Mongoose schemas.
  - `controllers/` & `routes/`: API logic and endpoints.
- `frontend/`: Contains the React/Vite web application.
  - `src/components/`: Reusable UI components.
  - `src/pages/`: Application views (e.g., Dashboard, Applications, ResumeBuilder).
  - `src/services/`: API client configurations.

## Building and Running

### Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Setup environment variables: Copy `.env.example` to `.env` and provide required keys (e.g., `MONGO_URI`, `SESSION_SECRET`, `CLIENT_URL`, etc.).
4. Start the development server: `npm run dev` (starts on configured port with nodemon) or `node server.js`.

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The application is typically accessible at `http://localhost:5173`.

## Development Conventions
- **API Communication:** Use the pre-configured Axios instance in `frontend/src/services/api.js` for all API calls.
- **Styling:** Tailwind CSS is used globally for styling components.
- **State Management:** React Context (e.g., `AuthContext`) is used for global state.
- **Real-Time Features:** Use Socket.io for live updates (notifications, application status, chat).
