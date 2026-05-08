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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  return user ? children : <Navigate to="/login" replace/>;
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
  const { loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <Spinner/>
    </div>
  );
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)' }}>
      <Navbar/>
      <EmailVerificationBanner/>
      <Routes>
        {/* Public */}
        <Route path="/"                         element={<Landing/>}/>
        <Route path="/login"                    element={<AuthPage mode="login"/>}/>
        <Route path="/register"                 element={<AuthPage mode="register"/>}/>
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
