import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try { await authAPI.forgotPassword({ email: email.trim() }); setSent(true); }
    catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', background:'var(--bg-base)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:'var(--radius-lg)', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:22 }}>🔑</div>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:22, letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:6 }}>Forgot Password</h1>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)' }}>We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="card" style={{ textAlign:'center', padding:'var(--space-8)' }}>
            <div style={{ fontSize:40, marginBottom:'var(--space-4)' }}>📬</div>
            <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', marginBottom:8 }}>Check your inbox</p>
            <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginBottom:'var(--space-6)', lineHeight:1.6 }}>
              If an account exists for <span style={{ color:'var(--text-accent)', fontWeight:500 }}>{email}</span>, you'll receive a reset link shortly.
            </p>
            <Link to="/login" className="btn btn-secondary btn-sm" style={{ display:'inline-flex' }}>← Back to Sign In</Link>
          </div>
        ) : (
          <div className="card" style={{ padding:'var(--space-6)' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }} noValidate>
              <div>
                <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
                  Email address<span style={{ color:'var(--red)', marginLeft:2 }}>*</span>
                </label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  className={`input${error ? ' input-error' : ''}`} placeholder="alex@university.edu" autoComplete="email"/>
                {error && <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--red)', marginTop:5 }}>⚠ {error}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', padding:11 }}>
                {loading ? <><span style={{ width:15, height:15, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite', display:'inline-block' }}/>Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}

        <p style={{ textAlign:'center', fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginTop:20 }}>
          Remember it? <Link to="/login" style={{ color:'var(--text-accent)', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
