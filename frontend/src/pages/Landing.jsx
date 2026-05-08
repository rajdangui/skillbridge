import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI } from '../services/api';

const ROLES = ['Frontend Developer','ML Engineer','Data Scientist','Backend Engineer','DevOps Intern','Product Designer'];
const COMPANIES = ['Google','Microsoft','Razorpay','Flipkart','Swiggy','Zerodha','CRED','Meesho','PhonePe','Groww','Ola','Zomato'];

function Typewriter() {
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const cur = ROLES[idx];
    const t = setTimeout(() => {
      if (!del && text.length < cur.length) setText(cur.slice(0,text.length+1));
      else if (!del) setTimeout(()=>setDel(true),2200);
      else if (del && text.length > 0) setText(cur.slice(0,text.length-1));
      else { setDel(false); setIdx(i=>(i+1)%ROLES.length); }
    }, del?28:55);
    return ()=>clearTimeout(t);
  },[text,del,idx]);
  return <span style={{ color:'var(--text-accent)' }}>{text}<span style={{ animation:'blink 1s step-end infinite' }}>_</span></span>;
}

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    opportunitiesCount: 2400,
    companiesCount: 340,
    studentsCount: 18000,
    placementRate: 94
  });

  const FEATURES = [
    { icon:'⚡', label:'AI-Powered',  title:'Cover Letter Generator', desc:'Tailored letters in seconds. 4 tones. Fully editable.',          accent:'var(--accent)' },
    { icon:'📊', label:'Skill Match', title:'Gap Analyzer',           desc:'See your match score. Know exactly what to learn.',              accent:'var(--purple)' },
    { icon:'🎯', label:'Free Tool',   title:'ATS Resume Checker',     desc:'Score your resume against ATS systems before you apply.',        accent:'var(--green)' },
    { icon:'🎬', label:'Built-in',    title:'Learning Hub',           desc:'YouTube tutorials without leaving SkillBridge.',                 accent:'var(--teal)' },
    { icon:'📬', label:'Real-time',   title:'Application Tracker',    desc:'All applications in one place. Status updates as they happen.',  accent:'var(--amber)' },
    { icon:'🔎', label:'Smart',       title:'Job Matching',           desc:`${(stats.opportunitiesCount || 2400).toLocaleString()}+ roles filtered to your exact skill set.`,                 accent:'var(--red)' },
  ];

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await opportunityAPI.getPublicStats();
        if (active && res.data) {
          setStats({
            opportunitiesCount: res.data.opportunitiesCount || 0,
            companiesCount: res.data.companiesCount || 0,
            studentsCount: res.data.studentsCount || 0,
            placementRate: res.data.placementRate || 94
          });
        }
      } catch (err) {
        console.error('Error fetching public stats:', err);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{ background:'var(--bg-base)' }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      {/* ── HERO ─────────────────────────────── */}
      <section style={{ padding:'80px 0 72px', borderBottom:'1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)' }}>

          {/* Live indicator */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:99, padding:'5px 14px', marginBottom:32 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'pulse 2s infinite' }} />
            <span style={{ fontFamily:"'Geist'", fontSize:12, fontWeight:500, color:'var(--text-secondary)' }}>
              {stats.companiesCount ? `${stats.companiesCount} verified companies` : '340+ companies'} hiring right now
            </span>
          </div>

          {/* Bento hero layout */}
          <div className="bento-grid" style={{ gap:'var(--space-5)' }}>

            {/* Headline card — 7 cols */}
            <div className="col-7" style={{ display:'flex', flexDirection:'column', justifyContent:'center', paddingRight:'var(--space-8)' }}>
              <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(2.6rem,5vw,4.2rem)', lineHeight:1.06, letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:20 }}>
                Land your next<br/>
                <Typewriter /><br/>
                <span style={{ color:'var(--text-tertiary)', fontWeight:400 }}>role.</span>
              </h1>
              <p style={{ fontFamily:"'Geist'", fontSize:15.5, color:'var(--text-secondary)', lineHeight:1.65, maxWidth:480, marginBottom:36 }}>
                SkillBridge connects ambitious students with top opportunities. AI-powered applications, skill gap analysis, and a learning hub — all free.
              </p>
              {/* Landing Hero Search Bar */}
              <form onSubmit={handleSearchSubmit} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '6px 6px 6px 14px',
                maxWidth: 480,
                marginBottom: 24,
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.15)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = 'var(--accent-border)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15), 0 4px 20px -2px rgba(0,0,0,0.15)';
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.15)';
              }}
              >
                <div style={{ color: 'var(--text-tertiary)', fontSize: 16, display: 'flex', alignItems: 'center' }}>🔍</div>
                <input
                  type="text"
                  placeholder="Search for roles, skills, companies..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontFamily: "'Geist'",
                    fontSize: 14,
                    flex: 1,
                    padding: '8px 4px',
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ height: 38, padding: '0 16px', fontSize: 13, fontWeight: 600, border: 'none' }}>
                  Search
                </button>
              </form>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard →</Link>
                ) : (
                  <Link to="/register" className="btn btn-primary btn-lg">Get started free →</Link>
                )}
                <Link to="/opportunities" className="btn btn-secondary btn-lg">Browse roles</Link>
              </div>
              {/* Social proof */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:36 }}>
                <div style={{ display:'flex' }}>
                  {['A','R','S','M','K'].map((l,i)=>(
                    <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:['var(--accent-muted)','var(--green-muted)','var(--purple-muted)','var(--amber-muted)','var(--red-muted)'][i], border:'2px solid var(--bg-base)', marginLeft:i>0?-8:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist'", fontWeight:600, fontSize:11, color:['var(--text-accent)','var(--green)','var(--purple)','var(--amber)','var(--red)'][i] }}>
                      {l}
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)' }}>
                  <span style={{ color:'var(--text-primary)', fontWeight:600 }}>
                    {stats.studentsCount ? `${stats.studentsCount.toLocaleString()}+` : '18,000+'}
                  </span> students launched their careers
                </p>
              </div>
            </div>

            {/* Stats bento — 5 cols */}
            <div className="col-5">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)', height:'100%' }}>
                {[
                  { val: stats.opportunitiesCount ? `${stats.opportunitiesCount}` : '2,400+', label:'Opportunities',  sub:'Live now',       accent:'var(--accent)',  bg:'var(--accent-muted)', border:'var(--accent-border)' },
                  { val: stats.companiesCount ? `${stats.companiesCount}` : '340+',   label:'Companies',      sub:'Actively hiring', accent:'var(--green)',   bg:'var(--green-muted)',  border:'rgba(52,211,153,.25)' },
                  { val: stats.placementRate ? `${stats.placementRate}%` : '94%',    label:'Placement',      sub:'Within 3 months', accent:'var(--purple)',  bg:'var(--purple-muted)', border:'rgba(167,139,250,.25)' },
                  { val: stats.studentsCount ? `${stats.studentsCount}` : '18K+',   label:'Students',       sub:'And growing',     accent:'var(--amber)',   bg:'var(--amber-muted)',  border:'rgba(251,191,36,.25)' },
                ].map((s,i)=>(
                  <div key={i} className="card" style={{ padding:'var(--space-5)', border:`1px solid ${s.border}`, background:'var(--bg-surface)' }}>
                    <div style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:28, letterSpacing:'-0.04em', color:s.accent, lineHeight:1, marginBottom:6 }}>{s.val}</div>
                    <div style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ──────────────────────────── */}
      <div style={{ borderBottom:'1px solid var(--border-subtle)', overflow:'hidden', background:'var(--bg-surface)', padding:'11px 0' }}>
        <div style={{ display:'flex', animation:'ticker 26s linear infinite', width:'max-content' }}>
          {[...COMPANIES,...COMPANIES].map((c,i)=>(
            <span key={i} style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:12.5, color:'var(--text-tertiary)', padding:'0 28px', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--border-strong)', display:'inline-block' }}/>{c}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES BENTO ──────────────────── */}
      <section style={{ padding:'80px 0', borderBottom:'1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)' }}>
          <div style={{ marginBottom:48 }}>
            <p className="label" style={{ marginBottom:10 }}>What's inside</p>
            <h2 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.4rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', maxWidth:400 }}>
              Built for serious students
            </h2>
          </div>
          <div className="bento-grid stagger">
            {FEATURES.map((f,i)=>(
              <div key={i} className="col-4 card card-interactive">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ width:36, height:36, borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px solid var(--border-default)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                    {f.icon}
                  </div>
                  <span className="badge badge-gray">{f.label}</span>
                </div>
                <h3 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14.5, color:'var(--text-primary)', marginBottom:6 }}>{f.title}</h3>
                <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section style={{ padding:'80px 0', background:'var(--bg-surface)', borderBottom:'1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)' }}>
          <p className="label" style={{ marginBottom:10 }}>Simple process</p>
          <h2 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.4rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:52 }}>
            Four steps to hired
          </h2>
          <div className="bento-grid stagger">
            {[
              { n:'01', t:'Create profile',       d:'Add skills, education, and resume in 5 minutes.' },
              { n:'02', t:'Browse matched roles',  d:'Opportunities filtered to your exact skill set.' },
              { n:'03', t:'Apply with AI',         d:'Generate cover letter, check skill gap, apply.' },
              { n:'04', t:'Track & get hired',     d:'Monitor all applications. Know your status instantly.' },
            ].map((s,i)=>(
              <div key={i} className="col-3 card">
                <div style={{ fontFamily:'var(--font-mono)', fontWeight:500, fontSize:11, color:'var(--text-tertiary)', letterSpacing:'0.06em', marginBottom:16 }}>{s.n}</div>
                <div style={{ height:1, background:'var(--border-subtle)', marginBottom:16 }} />
                <h3 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', marginBottom:8 }}>{s.t}</h3>
                <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section style={{ padding:'80px 0' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)' }}>
          <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-2xl)', padding:'60px', display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'center' }}>
            <div>
              <p className="label" style={{ marginBottom:10 }}>Ready?</p>
              <h2 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.4rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:12 }}>
                Your next role is already posted.
              </h2>
              <p style={{ fontFamily:"'Geist'", fontSize:14.5, color:'var(--text-secondary)', lineHeight:1.6 }}>
                Join ${(stats.studentsCount || 18000).toLocaleString()}+ students who launched their careers through SkillBridge.
              </p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard →</Link>
              ) : (
                <Link to="/register" className="btn btn-primary btn-lg">Create free account →</Link>
              )}
              <Link to="/opportunities" className="btn btn-secondary btn-lg">Browse roles</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────── */}
      <footer style={{ borderTop:'1px solid var(--border-subtle)', padding:'28px 0', background:'var(--bg-surface)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 var(--space-6)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:24, height:24, background:'var(--accent)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:10, color:'#fff' }}>SB</span>
            </div>
            <span style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>Skill<span style={{ color:'var(--text-accent)' }}>Bridge</span></span>
          </div>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>© {new Date().getFullYear()} SkillBridge. Built for students.</p>
          <nav style={{ display:'flex', gap:20 }}>
            {[['Browse','/opportunities'],['Learn','/learning'],['Sign Up','/register']].map(([l,h])=>(
              <Link key={h} to={h} style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', textDecoration:'none', transition:'color var(--t-fast)' }}
                onMouseEnter={e=>e.target.style.color='var(--text-primary)'}
                onMouseLeave={e=>e.target.style.color='var(--text-tertiary)'}>{l}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
