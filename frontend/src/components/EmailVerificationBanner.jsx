import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);
  if (!user || user.isEmailVerified || dismissed) return null;
  return (
    <div style={{ background:'var(--amber-muted)', borderBottom:'1px solid rgba(251,191,36,0.15)', padding:'10px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:14 }}>⚠️</span>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--amber)', flex:1 }}>
          Please verify your email.{' '}
          {!sent ? <button onClick={async()=>{await authAPI.resendVerification({email:user.email});setSent(true);}} style={{ color:'var(--amber)', fontWeight:600, background:'none', border:'none', textDecoration:'underline', cursor:'pointer', fontFamily:"'Geist'", fontSize:13 }}>Resend email</button>
          : <span style={{ fontWeight:600 }}>Sent!</span>}
        </p>
        <button onClick={()=>setDismissed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--amber)', fontSize:20, lineHeight:1 }}>×</button>
      </div>
    </div>
  );
}
