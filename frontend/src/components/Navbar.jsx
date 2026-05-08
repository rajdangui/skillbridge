import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [drop, setDrop] = useState(false);
  const [mob, setMob] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); setDrop(false); };
  const active = (p) => loc.pathname.startsWith(p);

  const studentMenuItems = [
    ['/dashboard',          'Dashboard'],
    ['/profile/edit',       'Edit Profile'],
    ['/college-dashboard',  '🎓 College Dashboard'],
    ['/resume-builder',     '📄 Resume Builder'],
    ['/applications',       'Applications'],
    ['/saved',              'Saved Roles'],
    ['/cover-letter',       'Cover Letter'],
    ['/skill-gap',          'Skill Gap'],
    ['/ats-checker',        'ATS Checker'],
    ['/notifications',      'Notifications'],
  ];
  const companyMenuItems = [
    ['/dashboard',          'Dashboard'],
    ['/profile/edit',       'Edit Profile'],
    ['/opportunities/post', 'Post a Role'],
    ['/applications',       'Applications'],
    ['/notifications',      'Notifications'],
  ];
  const adminMenuItems = [
    ['/dashboard', 'Dashboard'],
    ['/admin',     'Admin Panel'],
    ['/notifications', 'Notifications'],
  ];

  const menuItems = user?.role === 'company' ? companyMenuItems
    : user?.role === 'admin' ? adminMenuItems
    : studentMenuItems;

  const navLink = (path, label) => (
    <Link key={path} to={path}
      style={{
        fontFamily:"'Geist',sans-serif", fontSize:13.5, fontWeight:500,
        padding:'5px 12px', borderRadius:8, textDecoration:'none',
        color: active(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active(path) ? 'var(--bg-elevated)' : 'transparent',
        border: active(path) ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition:'all var(--t-fast)',
      }}
      onMouseEnter={e => { if(!active(path)){e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='var(--bg-overlay)';} }}
      onMouseLeave={e => { if(!active(path)){e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.background='transparent';} }}>
      {label}
    </Link>
  );

  return (
    <header style={{ background:'rgba(13,15,18,0.9)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border-subtle)', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:28, height:28, background:'var(--accent)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:11, color:'#fff', letterSpacing:'-0.01em' }}>SB</span>
          </div>
          <span style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>
            Skill<span style={{ color:'var(--text-accent)' }}>Bridge</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav style={{ display:'flex', alignItems:'center', gap:2, flex:1, justifyContent:'center', maxWidth:360 }}>
          {navLink('/opportunities', 'Browse Roles')}
          {navLink('/learning', 'Learning')}
          {user?.role === 'student' && navLink('/college-dashboard', 'College')}
          {user?.role === 'company' && navLink('/opportunities/post', 'Post Role')}
        </nav>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {user ? (
            <>
              <NotificationBell/>
              <div style={{ position:'relative' }}>
                <button onClick={() => setDrop(v => !v)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 5px', borderRadius:'var(--radius-lg)', background:'var(--bg-elevated)', border:`1px solid ${drop?'var(--border-default)':'var(--border-subtle)'}`, cursor:'pointer', transition:'all var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-default)'}
                  onMouseLeave={e => { if(!drop) e.currentTarget.style.borderColor='var(--border-subtle)'; }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'Geist'", fontWeight:700, fontSize:12, color:'var(--text-accent)' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontFamily:"'Geist'", fontSize:13, fontWeight:500, color:'var(--text-primary)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color:'var(--text-tertiary)', transform: drop?'rotate(180deg)':'rotate(0)', transition:'transform var(--t-fast)' }}>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {drop && (
                  <>
                    <div style={{ position:'fixed', inset:0, zIndex:40 }} onClick={() => setDrop(false)}/>
                    <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:220, background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', zIndex:50, overflow:'hidden', animation:'page-in .2s cubic-bezier(.16,1,.3,1)' }}>
                      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
                        <p style={{ fontFamily:"'Geist'", fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>{user.name}</p>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{user.email}</p>
                        <span style={{ display:'inline-block', marginTop:5, fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', padding:'2px 7px', borderRadius:4, background:'var(--accent-muted)', color:'var(--text-accent)', border:'1px solid var(--accent-border)' }}>{user.role}</span>
                      </div>
                      <div style={{ padding:6 }}>
                        {menuItems.map(([path, label]) => (
                          <Link key={path} to={path} onClick={() => setDrop(false)}
                            style={{ display:'block', padding:'8px 12px', fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', textDecoration:'none', borderRadius:'var(--radius-sm)', transition:'all var(--t-fast)' }}
                            onMouseEnter={e => { e.currentTarget.style.background='var(--bg-overlay)'; e.currentTarget.style.color='var(--text-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                            {label}
                          </Link>
                        ))}
                        <div style={{ height:1, background:'var(--border-subtle)', margin:'4px 0' }}/>
                        <button onClick={handleLogout}
                          style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', fontFamily:"'Geist'", fontSize:13, color:'var(--red)', background:'transparent', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'background var(--t-fast)' }}
                          onMouseEnter={e => e.target.style.background='var(--red-muted)'}
                          onMouseLeave={e => e.target.style.background='transparent'}>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register"
                className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
