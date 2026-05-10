import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import ChatWidget from './components/ChatWidget';

import Landing            from './pages/Landing';
import AuthPage           from './pages/AuthPage';
import Dashboard          from './pages/Dashboard';
import EditProfile        from './pages/EditProfile';
import Opportunities      from './pages/Opportunities';
import OpportunityDetail  from './pages/OpportunityDetail';
import PostOpportunity    from './pages/PostOpportunity';
import Applications       from './pages/Applications';
import SavedOpportunities from './pages/SavedOpportunities';
import LearningHub        from './pages/LearningHub';
import VideoPlayer        from './pages/VideoPlayer';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import SkillGapAnalyzer   from './pages/SkillGapAnalyzer';
import ATSChecker         from './pages/ATSChecker';
import CollegeDashboard   from './pages/CollegeDashboard';
import ResumeBuilder      from './pages/ResumeBuilder';
import Notifications      from './pages/Notifications';
import VerifyEmail        from './pages/VerifyEmail';
import ForgotPassword     from './pages/ForgotPassword';
import ResetPassword      from './pages/ResetPassword';
import AdminPanel         from './pages/admin/AdminPanel';

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:'var(--bg-base)' }}>
    <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid var(--bg-elevated)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const FullScreenLoader = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(13, 15, 18, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fade-in 0.2s ease-out'
  }}>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{
        width: 54,
        height: 54,
        borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: 'var(--accent)',
        borderBottomColor: 'var(--accent)',
        animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite'
      }}/>
      <div style={{
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid transparent',
        borderLeftColor: 'var(--text-accent)',
        borderRightColor: 'var(--text-accent)',
        animation: 'spin 0.7s linear infinite reverse'
      }}/>
    </div>
    <p style={{
      fontFamily: "'Geist', sans-serif",
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em',
      animation: 'pulse 1.5s ease-in-out infinite',
      margin: 0
    }}>
      Securing session...
    </p>
  </div>
);

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  return user ? children : <Navigate to="/login" replace/>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  return user ? <Navigate to="/dashboard" replace/> : children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace/>;
}

function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace/>;
  return user.role === 'student' ? children : <Navigate to="/dashboard" replace/>;
}

function AppContent() {
  const { loading, transitioning } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <Spinner/>
    </div>
  );
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)' }}>
      {transitioning && <FullScreenLoader/>}
      <Navbar/>
      <EmailVerificationBanner/>
      <Routes>
        {/* Public */}
        <Route path="/"                         element={<Landing/>}/>
        <Route path="/login"                    element={<PublicRoute><AuthPage mode="login"/></PublicRoute>}/>
        <Route path="/register"                 element={<PublicRoute><AuthPage mode="register"/></PublicRoute>}/>

        <Route path="/verify-email"             element={<VerifyEmail/>}/>
        <Route path="/forgot-password"          element={<ForgotPassword/>}/>
        <Route path="/reset-password"           element={<ResetPassword/>}/>
        <Route path="/opportunities"            element={<Opportunities/>}/>
        <Route path="/opportunities/:id"        element={<OpportunityDetail/>}/>
        <Route path="/learning"                 element={<LearningHub/>}/>
        <Route path="/learning/watch/:videoId"  element={<VideoPlayer/>}/>

        {/* Authenticated */}
        <Route path="/opportunities/post"       element={<PrivateRoute><PostOpportunity/></PrivateRoute>}/>
        <Route path="/dashboard"                element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
        <Route path="/profile/edit"             element={<PrivateRoute><EditProfile/></PrivateRoute>}/>
        <Route path="/applications"             element={<PrivateRoute><Applications/></PrivateRoute>}/>
        <Route path="/saved"                    element={<PrivateRoute><SavedOpportunities/></PrivateRoute>}/>
        <Route path="/notifications"            element={<PrivateRoute><Notifications/></PrivateRoute>}/>
        <Route path="/resume-builder"           element={<PrivateRoute><ResumeBuilder/></PrivateRoute>}/>
        <Route path="/ats-checker"              element={<PrivateRoute><ATSChecker/></PrivateRoute>}/>

        {/* Student only */}
        <Route path="/cover-letter"             element={<StudentRoute><CoverLetterGenerator/></StudentRoute>}/>
        <Route path="/skill-gap"                element={<StudentRoute><SkillGapAnalyzer/></StudentRoute>}/>
        <Route path="/skill-gap/:opportunityId" element={<StudentRoute><SkillGapAnalyzer/></StudentRoute>}/>
        <Route path="/college-dashboard"        element={<StudentRoute><CollegeDashboard/></StudentRoute>}/>

        {/* Admin */}
        <Route path="/admin"                    element={<AdminRoute><AdminPanel/></AdminRoute>}/>

        {/* Catch-all */}
        <Route path="*"                         element={<Navigate to="/" replace/>}/>
      </Routes>
      <ChatWidget/>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent/>
      </AuthProvider>
    </BrowserRouter>
  );
}
