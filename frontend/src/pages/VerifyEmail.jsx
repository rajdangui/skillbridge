import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    authAPI.verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed. Link may be expired.'); });
  }, [token]);

  const configs = {
    verifying: { icon:'⏳', title:'Verifying...', desc:'Please wait while we verify your email.', color:'var(--text-accent)' },
    success:   { icon:'✅', title:'Email Verified!', desc:'Your account is now fully active.', color:'var(--green)' },
    error:     { icon:'❌', title:'Verification Failed', desc:message, color:'var(--red)' },
  };
  const c = configs[status];

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', background:'var(--bg-base)' }}>
      <div className="card" style={{ maxWidth:400, width:'100%', textAlign:'center', padding:'var(--space-10)' }}>
        <div style={{ fontSize:48, marginBottom:'var(--space-5)' }}>{c.icon}</div>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:20, letterSpacing:'-0.02em', color:c.color, marginBottom:8 }}>{c.title}</h1>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:'var(--space-6)' }}>{c.desc}</p>
        {status !== 'verifying' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
            <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ justifyContent:'center' }}>Go to Dashboard</Link>
            {status === 'error' && <Link to="/login" className="btn btn-secondary btn-sm" style={{ justifyContent:'center' }}>Sign In</Link>}
          </div>
        )}
        {status === 'verifying' && (
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid var(--accent-muted)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }}/>
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
