import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI } from '../services/api';

function validate(name, value) {
  if (name==='name')     return !value.trim()?'Required':value.trim().length<2?'Too short':'';
  if (name==='email')    return !value.trim()?'Required':!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?'Invalid email':'';
  if (name==='password') return !value?'Required':value.length<6?'Min 6 characters':'';
  return '';
}
function strength(p) {
  let s=0; if(p.length>=8)s++; if(p.length>=12)s++; if(/[A-Z]/.test(p))s++; if(/[0-9]/.test(p))s++; if(/[^A-Za-z0-9]/.test(p))s++;
  return s;
}
const STR_LABEL = ['','Very weak','Weak','Fair','Strong','Very strong'];
const STR_COLOR = ['','var(--red)','var(--red)','var(--amber)','var(--green)','var(--green)'];

// Owl — outside to prevent remount/focus-loss
function Owl({ watching }) {
  return (
    <div className="owl-floating-container" style={{
      position: 'absolute',
      right: 'calc(50% + 240px)',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px',
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 10,
      width: 170,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ position:'relative' }}>
        <svg viewBox="0 0 80 80" width="100" height="100">
          <ellipse cx="40" cy="54" rx="21" ry="19" fill="var(--bg-elevated)"/>
          <ellipse cx="40" cy="34" rx="18" ry="16" fill="var(--bg-overlay)"/>
          <polygon points="26,21 22,9 31,17" fill="var(--bg-overlay)"/>
          <polygon points="54,21 58,9 49,17" fill="var(--bg-overlay)"/>
          <ellipse cx="40" cy="57" rx="12" ry="11" fill="#1C2130"/>
          <ellipse cx="40" cy="34" rx="12" ry="11" fill="#1C2130"/>
          
          {/* Left Eye */}
          <ellipse cx="32" cy="33" rx="6" ry="6" fill="var(--bg-base)" stroke="var(--accent)" strokeWidth="1.5"/>
          <g style={{
            transform: watching ? 'translate(2.5px, 0.8px)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: '32px 33px'
          }}>
            <ellipse cx="32" cy="33" rx="3.8" ry="3.8" fill="white" style={{transformOrigin:'32px 33px',transform:watching?'scaleY(1)':'scaleY(0.07)',transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}/>
            <ellipse cx="32" cy="33" rx="2" ry="2" fill="var(--bg-base)" style={{transformOrigin:'32px 33px',transform:watching?'scaleY(1)':'scaleY(0.07)',transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}/>
            <circle cx="33" cy="32" r="0.8" fill="white" style={{opacity:watching?1:0,transition:'opacity .2s'}}/>
          </g>
          <ellipse cx="32" cy="33" rx="6" ry="3" fill="var(--bg-overlay)" style={{transformOrigin:'32px 33px',transform:watching?'scaleY(0)':'scaleY(1)',transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}/>
          {!watching && <rect x="24" y="30" width="15" height="5" rx="2" fill="var(--bg-elevated)" stroke="var(--border-default)"/>}
          
          {/* Right Eye */}
          <ellipse cx="48" cy="33" rx="6" ry="6" fill="var(--bg-base)" stroke="var(--accent)" strokeWidth="1.5"/>
          <g style={{
            transform: watching ? 'translate(2.5px, 0.8px)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: '48px 33px'
          }}>
            <ellipse cx="48" cy="33" rx="3.8" ry="3.8" fill="white" style={{transformOrigin:'48px 33px',transform:watching?'scaleY(1)':'scaleY(0.07)',transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}/>
            <ellipse cx="48" cy="33" rx="2" ry="2" fill="var(--bg-base)" style={{transformOrigin:'48px 33px',transform:watching?'scaleY(1)':'scaleY(0.07)',transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}/>
            <circle cx="49" cy="32" r="0.8" fill="white" style={{opacity:watching?1:0,transition:'opacity .2s'}}/>
          </g>
          <ellipse cx="48" cy="33" rx="6" ry="3" fill="var(--bg-overlay)" style={{transformOrigin:'48px 33px',transform:watching?'scaleY(0)':'scaleY(1)',transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'}}/>
          {!watching && <rect x="41" y="30" width="15" height="5" rx="2" fill="var(--bg-elevated)" stroke="var(--border-default)"/>}
          
          <polygon points="40,38 37,44 43,44" fill="var(--amber)"/>
          <ellipse cx="20" cy="55" rx="7" ry="12" fill="var(--bg-elevated)" transform="rotate(-8,20,55)"/>
          <ellipse cx="60" cy="55" rx="7" ry="12" fill="var(--bg-elevated)" transform="rotate(8,60,55)"/>
        </svg>
        <div style={{ marginTop: 12, textAlign: 'center', whiteSpace:'nowrap', padding:'3px 10px', borderRadius:99, fontSize:11, fontFamily:"'Geist'", fontWeight:600, background:watching?'var(--accent-muted)':'var(--bg-elevated)', color:watching?'var(--text-accent)':'var(--text-secondary)', border:`1px solid ${watching?'var(--accent-border)':'var(--border-subtle)'}`, transition: 'all 0.2s ease' }}>
          {watching ? 'I see you! 👀' : 'Security Mode 🙈'}
        </div>
      </div>
    </div>
  );
}

// Field — outside AuthPage to prevent remount / focus loss
function Field({ name,type,label,placeholder,required,value,error,touched,isValid,onChange,onBlur,showPassword,onToggle,isLogin,score }) {
  const isPass = name==='password';
  const hasErr = touched && error;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)' }}>
        {label}{required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        <input name={name} type={isPass?(showPassword?'text':'password'):type} value={value}
          onChange={onChange} onBlur={onBlur} placeholder={placeholder}
          autoComplete={isPass?(isLogin?'current-password':'new-password'):name}
          className={`input${hasErr?' input-error':isValid?' input-valid':''}`}
          style={{ paddingRight: (isPass||isValid||hasErr) ? 38 : 14 }}/>
        {(isPass||isValid||hasErr) && (
          <div style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)' }}>
            {isPass ? (
              <button type="button" onClick={onToggle} tabIndex={-1} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', padding:0, display:'flex', alignItems:'center', transition:'color var(--t-fast)' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text-secondary)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-tertiary)'}>
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            ) : isValid ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : hasErr ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ) : null}
          </div>
        )}
      </div>
      {hasErr && <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--red)', display:'flex', alignItems:'center', gap:4 }}>⚠ {error}</p>}
      {isPass && !isLogin && value && (
        <div>
          <div style={{ display:'flex', gap:3, marginBottom:4 }}>
            {[1,2,3,4,5].map(i=><div key={i} style={{ flex:1, height:2, borderRadius:99, background:i<=score?STR_COLOR[score]:'var(--border-default)', transition:'all var(--t-base)' }}/>)}
          </div>
          <p style={{ fontFamily:"'Geist'", fontSize:11, color:STR_COLOR[Math.min(score,5)] }}>{STR_LABEL[Math.min(score,5)]}</p>
        </div>
      )}
    </div>
  );
}

export default function AuthPage({ mode='login' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode==='login');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({ name:'',email:'',password:'',role:'student',college:'',branch:'' });
  const [studentsCount, setStudentsCount] = useState(18000);
  const score = strength(form.password);

  // Fix: reset showPassword on every mode switch
  useEffect(() => { 
    setIsLogin(mode==='login'); 
    setServerError(''); 
    setFieldErrors({}); 
    setTouched({}); 
    setShowPassword(false); 
  }, [mode]);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await opportunityAPI.getPublicStats();
        if (active && res.data && res.data.studentsCount) {
          setStudentsCount(res.data.studentsCount);
        }
      } catch (err) {
        // dynamic failover
      }
    };
    fetchStats();
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target; setForm(p=>({...p,[name]:value})); setServerError('');
    if (touched[name]) setFieldErrors(p=>({...p,[name]:validate(name,value)}));
  };
  const handleBlur = (e) => {
    const { name, value } = e.target; setTouched(p=>({...p,[name]:true})); setFieldErrors(p=>({...p,[name]:validate(name,value)}));
  };
  const validateAll = () => {
    const fields = isLogin?['email','password']:['name','email','password'];
    const errors = {}; fields.forEach(f=>{const e=validate(f,form[f]);if(e)errors[f]=e;});
    setFieldErrors(errors); setTouched(fields.reduce((a,f)=>({...a,[f]:true}),{}));
    return !Object.keys(errors).length;
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); if(!validateAll())return;
    setLoading(true); setServerError('');
    try {
      if(isLogin) await login({email:form.email.trim(),password:form.password});
      else await register({name:form.name.trim(),email:form.email.trim(),password:form.password,role:form.role,college:form.college.trim(),branch:form.branch.trim()});
      navigate('/dashboard');
    } catch(err) {
      const msg=err.response?.data?.message;
      setServerError(msg&&!msg.startsWith('TypeError')?msg:'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };
  const switchMode = () => { setIsLogin(v=>!v); setServerError(''); setFieldErrors({}); setTouched({}); setShowPassword(false); setForm({name:'',email:'',password:'',role:'student',college:'',branch:''}); };
  const fp = (name,type,label,placeholder,required=false) => ({ name,type,label,placeholder,required, value:form[name], error:fieldErrors[name]||'', touched:touched[name]||false, isValid:!!(touched[name]&&!fieldErrors[name]&&form[name]), onChange:handleChange, onBlur:handleBlur, showPassword, onToggle:()=>setShowPassword(v=>!v), isLogin, score });

  return (
    <div style={{ height:'calc(100vh - 56px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px', background:'var(--bg-base)', overflow:'hidden', position:'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 1024px) {
          .owl-floating-container {
            display: none !important;
          }
        }
        .card-scrollable {
          max-height: calc(100vh - 160px);
          overflow-y: auto;
        }
        .card-scrollable::-webkit-scrollbar {
          width: 4px;
        }
        .card-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        .card-scrollable::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 99px;
        }
      `}</style>
      
      <Owl watching={showPassword} />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:5 }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:22, letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:6 }}>
            {isLogin?'Welcome back':'Create account'}
          </h1>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)' }}>
            {isLogin?'Sign in to your dashboard':`Join ${studentsCount.toLocaleString()}+ students getting hired`}
          </p>
        </div>

        <div className="card card-scrollable" style={{ padding:'var(--space-6)' }}>
          {/* OAuth */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              { href:'/api/auth/google', label:'Google', icon: <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
              { href:'/api/auth/github', label:'GitHub', icon: <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> },
            ].map(b => (
              <a key={b.label} href={b.href} className="btn btn-secondary" style={{ justifyContent:'center', gap:8 }}>
                {b.icon}{b.label}
              </a>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:'var(--border-subtle)' }}/><span style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>or</span><div style={{ flex:1, height:1, background:'var(--border-subtle)' }}/>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }} noValidate>
            {!isLogin && <Field {...fp('name','text','Full name','Alex Johnson',true)}/>}
            <Field {...fp('email','email','Email','alex@university.edu',true)}/>
            <Field {...fp('password','password','Password',isLogin?'Enter password':'Min. 6 characters',true)}/>

            {!isLogin && (
              <>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)' }}>I am a</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {['student','company'].map(r=>(
                      <button key={r} type="button" onClick={()=>setForm(p=>({...p,role:r}))}
                        style={{ padding:'9px 12px', borderRadius:'var(--radius-md)', border:`1px solid ${form.role===r?'var(--accent-border)':'var(--border-default)'}`, background:form.role===r?'var(--accent-muted)':'var(--bg-elevated)', fontFamily:"'Geist'", fontWeight:500, fontSize:13, color:form.role===r?'var(--text-accent)':'var(--text-secondary)', cursor:'pointer', transition:'all var(--t-fast)', textTransform:'capitalize' }}>
                        {r==='student'?'🎓 Student':'🏢 Company'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.role==='student' && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <Field {...fp('college','text','College','MIT')}/><Field {...fp('branch','text','Branch','CS')}/>
                  </div>
                )}
              </>
            )}

            {isLogin && (
              <div style={{ textAlign:'right', marginTop:-4 }}>
                <Link to="/forgot-password" style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)', textDecoration:'none', transition:'color var(--t-fast)' }}
                  onMouseEnter={e=>e.target.style.color='var(--text-accent)'}
                  onMouseLeave={e=>e.target.style.color='var(--text-tertiary)'}>Forgot password?</Link>
              </div>
            )}

            {serverError && (
              <div style={{ padding:'10px 14px', background:'var(--red-muted)', border:'1px solid rgba(248,113,113,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--red)', display:'flex', gap:8, alignItems:'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg>
                {serverError}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', padding:'11px', marginTop:2 }}>
              {loading ? <><span style={{ width:15, height:15, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite', display:'inline-block' }}/>{isLogin?'Signing in...':'Creating account...'}</> : isLogin?'Sign In →':'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginTop:20 }}>
          {isLogin?"Don't have an account? ":"Already have an account? "}
          <button onClick={switchMode} style={{ color:'var(--text-accent)', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontFamily:"'Geist'", fontSize:13 }}>
            {isLogin?'Sign up free':'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
