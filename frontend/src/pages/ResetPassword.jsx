import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) return (
    <div style={{ minHeight:'calc(100vh-56px)', display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:'var(--bg-base)' }}>
      <div className="card" style={{ maxWidth:400, width:'100%', textAlign:'center', padding:'var(--space-8)' }}>
        <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--red)', marginBottom:'var(--space-4)' }}>Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="btn btn-secondary btn-sm">Request New Link</Link>
      </div>
    </div>
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (password.length < 6) { setError('Min 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try { await authAPI.resetPassword({ token, newPassword: password }); setSuccess(true); setTimeout(() => navigate('/login'), 2500); }
    catch (err) { setError(err.response?.data?.message || 'Reset failed. Link may be expired.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', background:'var(--bg-base)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:'var(--radius-lg)', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22 }}>🔒</div>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:22, letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:6 }}>Set New Password</h1>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)' }}>Choose a strong password for your account</p>
        </div>

        {success ? (
          <div className="card" style={{ textAlign:'center', padding:'var(--space-8)', border:'1px solid rgba(52,211,153,.25)' }}>
            <div style={{ fontSize:40, marginBottom:'var(--space-4)' }}>✅</div>
            <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--green)', marginBottom:8 }}>Password reset!</p>
            <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)' }}>Redirecting you to sign in...</p>
          </div>
        ) : (
          <div className="card" style={{ padding:'var(--space-6)' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }} noValidate>
              {[['New Password', password, setPassword, 'new-password'], ['Confirm Password', confirm, setConfirm, 'new-password']].map(([label, val, setter, ac]) => (
                <div key={label}>
                  <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>{label}</label>
                  <input type="password" value={val} onChange={e => { setter(e.target.value); setError(''); }}
                    className="input" placeholder="••••••••" autoComplete={ac} minLength={6}/>
                </div>
              ))}
              {error && <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--red)' }}>⚠ {error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', padding:11 }}>
                {loading ? <><span style={{ width:15, height:15, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite', display:'inline-block' }}/>Resetting...</> : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
