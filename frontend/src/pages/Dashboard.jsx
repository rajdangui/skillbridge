import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI, applicationAPI, notificationAPI } from '../services/api';
import OpportunityCard from '../components/OpportunityCard';
import SearchBar from '../components/SearchBar';

const SKILL_MAP = { React:['TypeScript','Next.js','GraphQL'], Node:['Docker','Redis','PostgreSQL'], Python:['ML','FastAPI','Data Science'], JavaScript:['TypeScript','React','Node.js'] };
function getRec(skills=[]) {
  const out=new Set(); skills.forEach(s=>{const k=Object.keys(SKILL_MAP).find(k=>s.toLowerCase().includes(k.toLowerCase())||k.toLowerCase().includes(s.toLowerCase()));if(k)SKILL_MAP[k].forEach(r=>out.add(r));});
  if(!out.size)['System Design','Docker','TypeScript','Git','SQL'].forEach(s=>out.add(s));
  return [...out].filter(r=>!skills.map(s=>s.toLowerCase()).includes(r.toLowerCase())).slice(0,5);
}

function StatCard({ val, label, sub, accent }) {
  return (
    <div className="card" style={{ border:`1px solid ${accent}22`, background:`linear-gradient(135deg, var(--bg-surface) 0%, ${accent}06 100%)` }}>
      <div style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:28, letterSpacing:'-0.04em', color:accent, lineHeight:1, marginBottom:6 }}>{val}</div>
      <div style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:2 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opps, setOpps] = useState([]);
  const [apps, setApps] = useState([]);
  const [companyStats, setCompanyStats] = useState({ totalApplicants: 0, pendingReview: 0, shortlisted: 0, accepted: 0, reviewed: 0 });
  const [loading, setLoading] = useState(true);
  const isCompany = user?.role === 'company';
  const rec = getRec(user?.skills);

  useEffect(() => {
    (async () => {
      try {
        // Generate academic reminders (students only, non-blocking)
        if (!isCompany) notificationAPI.generateReminders().catch(() => {});
        if (isCompany) {
          const [or, sr] = await Promise.all([
            opportunityAPI.getMine(),
            applicationAPI.getCompanyStats()
          ]);
          setOpps(or.data.opportunities || []);
          setCompanyStats(sr.data);
        } else {
          const [or, ar] = await Promise.all([opportunityAPI.getAll({limit:6}), applicationAPI.getMyApplications()]);
          setOpps(or.data.opportunities || []);
          setApps(ar.data.applications || []);
        }
      } catch(e){console.error(e);} finally{setLoading(false);}
    })();
  },[isCompany]);

  const profileScore = () => {
    const checks = [
      { pts:15, ok: !!user?.bio && user.bio.length >= 30 },
      { pts:15, ok: (user?.skills||[]).length >= 3 },
      { pts:10, ok: !!user?.college },
      { pts:10, ok: !!user?.branch },
      { pts: 5, ok: !!user?.github },
      { pts: 5, ok: !!user?.linkedin },
      { pts:15, ok: !!user?.resume },
      { pts:10, ok: (user?.projects||[]).length >= 1 },
      { pts: 5, ok: !!user?.website || !!user?.portfolio },
      { pts: 5, ok: !!user?.isEmailVerified },
    ];
    return checks.reduce((s,c) => s + (c.ok ? c.pts : 0), 0);
  };
  const companyScore = () => {
    const checks = [
      { pts:20, ok: !!user?.bio && user.bio.length >= 30 },
      { pts:20, ok: !!user?.companyName },
      { pts:20, ok: !!user?.companyWebsite },
      { pts:15, ok: !!user?.linkedin },
      { pts:10, ok: !!user?.avatar },
      { pts: 5, ok: !!user?.website },
      { pts: 5, ok: !!user?.isEmailVerified },
    ];
    return Math.min(100, checks.reduce((s,c) => s + (c.ok ? c.pts : 0), 0));
  };
  const score = isCompany ? companyScore() : profileScore();

  return (
    <div className="page page-in">
      {/* Header */}
      <div style={{ marginBottom:'var(--space-8)', paddingBottom:'var(--space-6)', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <p className="label" style={{ marginBottom:8 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)' }}>
            {new Date().getHours()<12?'Good morning':'Good afternoon'},{' '}
            <span style={{ color:'var(--text-accent)' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
        </div>
        <Link to="/profile/edit" className="btn btn-secondary btn-sm">Edit Profile</Link>
      </div>

      {/* Homepage Quick Search Hero */}
      <div className="card" style={{
        marginBottom:'var(--space-8)',
        padding:'var(--space-6) var(--space-8)',
        background:'linear-gradient(135deg, var(--bg-surface) 0%, rgba(59,130,246,0.03) 100%)',
        border:'1px solid var(--border-subtle)',
        position:'relative',
        overflow:'hidden'
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', pointerEvents:'none' }}/>
        
        <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', marginBottom:'var(--space-3)' }}>
          {isCompany ? "Search Candidates & Postings" : "What are you looking for today?"}
        </h2>
        
        <div style={{ display:'flex', gap:'var(--space-3)', alignItems:'center', maxWidth:640 }}>
          <SearchBar
            onSearch={(q) => {
              if (isCompany) {
                navigate(`/applications?search=${encodeURIComponent(q)}`);
              } else {
                navigate(`/opportunities?search=${encodeURIComponent(q)}`);
              }
            }}
            placeholder={isCompany ? "Search applicants by name, college, skills..." : "Search opportunities, roles, or learning topics..."}
            style={{ flex:1 }}
          />
        </div>
        
        {!isCompany && (
          <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', marginTop:'var(--space-3)' }}>
            <span style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)' }}>Quick search:</span>
            <div style={{ display:'flex', gap:6 }}>
              {['React', 'Node.js', 'Python', 'Internships'].map(tag => (
                <Link
                  key={tag}
                  to={tag === 'Internships' ? '/opportunities?type=internship' : `/opportunities?search=${encodeURIComponent(tag)}`}
                  style={{
                    fontFamily:"'Geist'",
                    fontSize:11.5,
                    color:'var(--text-secondary)',
                    textDecoration:'none',
                    background:'var(--bg-elevated)',
                    border:'1px solid var(--border-subtle)',
                    padding:'2px 8px',
                    borderRadius:4,
                    transition:'all var(--t-fast)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent-border)'; e.currentTarget.style.color='var(--text-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.color='var(--text-secondary)'; }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats bento */}
      <div className="bento-grid stagger" style={{ marginBottom:'var(--space-8)' }}>
        {(isCompany ? [
          { val:opps.length,  label:'Posted Roles',   sub:'total',           accent:'var(--accent)' },
          { val:opps.filter(o=>o.isActive).length, label:'Active',  sub:'live now',        accent:'var(--green)' },
          { val:companyStats.totalApplicants, label:'Applicants',  sub:`${companyStats.pendingReview} pending review`,  accent:'var(--purple)' },
          { val:companyStats.shortlisted, label:'Shortlisted',  sub:'candidates',  accent:'var(--amber)' },
        ] : [
          { val:apps.length, label:'Applications', sub:`${apps.filter(a=>a.status==='shortlisted').length} shortlisted`, accent:'var(--accent)' },
          { val:user?.skills?.length||0, label:'Skills',  sub:'in profile',     accent:'var(--green)' },
          { val:apps.filter(a=>a.status==='shortlisted').length, label:'Shortlisted', sub:'roles',  accent:'var(--purple)' },
          { val:`${score}%`, label:'Profile',       sub:'completeness',    accent:'var(--amber)' },
        ]).map((s,i)=>(
          <div key={i} className="col-3"><StatCard {...s}/></div>
        ))}
      </div>

      {/* Main bento layout */}
      <div className="bento-grid">

        {/* Opportunities — 8 cols */}
        <div className="col-8">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
            <div>
              <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>{isCompany?'Your Postings':'Recommended Roles'}</h2>
              <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)', marginTop:2 }}>{isCompany?'Manage active listings':'Matched to your skills'}</p>
            </div>
            <Link to="/opportunities" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
              {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{ height:160 }}/>)}
            </div>
          ) : opps.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
              {opps.slice(0,4).map(o=><OpportunityCard key={o._id} opportunity={o}/>)}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
              <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-tertiary)', marginBottom:'var(--space-4)' }}>No opportunities yet</p>
              {isCompany && <Link to="/opportunities/post" className="btn btn-primary btn-sm">Post First Role</Link>}
            </div>
          )}

          {/* Recent apps */}
          {!isCompany && apps.length > 0 && (
            <div style={{ marginTop:'var(--space-8)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-5)' }}>
                <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Recent Applications</h2>
                <Link to="/applications" className="btn btn-ghost btn-sm">All →</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                {apps.slice(0,4).map(a=>(
                  <div key={a._id} className="card card-sm" style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', padding:'14px var(--space-5)' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:14, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.opportunityId?.title||'Opportunity'}</p>
                      <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>{a.opportunityId?.company} · {new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`status-${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — 4 cols */}
        <div className="col-4" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>

          {/* Profile card */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-5)', paddingBottom:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'Geist'", fontWeight:700, fontSize:15, color:'var(--text-accent)' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13.5, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{user?.role}</p>
              </div>
            </div>
            <div style={{ marginBottom:'var(--space-4)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)' }}>Profile completeness</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:score<50?'var(--red)':score<80?'var(--amber)':'var(--green)' }}>{score}%</span>
              </div>
              <div style={{ height:3, background:'var(--bg-elevated)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${score}%`, background:score<50?'var(--red)':score<80?'var(--amber)':'var(--green)', borderRadius:99, transition:'width 1s var(--t-slow)' }}/>
              </div>
            </div>
            <Link to="/profile/edit" className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }}>{score<70?'Complete Profile':'Edit Profile'}</Link>
          </div>

          {/* Skills */}
          {(user?.skills||[]).length > 0 && (
            <div className="card">
              <p className="label" style={{ marginBottom:'var(--space-3)' }}>Your Skills</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(user.skills||[]).map(s=><span key={s} className="tag tag-accent">{s}</span>)}
              </div>
            </div>
          )}

          {/* Level up */}
          {!isCompany && rec.length > 0 && (
            <div className="card">
              <p className="label" style={{ marginBottom:'var(--space-3)' }}>Level Up</p>
              <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                {rec.map(s=>(
                  <Link key={s} to={`/learning?q=${encodeURIComponent(s)}`}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px var(--space-3)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', textDecoration:'none', transition:'all var(--t-fast)' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-elevated)';e.currentTarget.style.color='var(--text-primary)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-secondary)';}}>
                    <span>{s}</span>
                    <span style={{ color:'var(--text-tertiary)', fontSize:12 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI Tools */}
          {!isCompany && (
            <div className="card card-accent">
              <p className="label" style={{ marginBottom:'var(--space-4)' }}>AI Tools</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                {[{to:'/college-dashboard',icon:'🎓',label:'College Dashboard'},{to:'/resume-builder',icon:'📄',label:'Resume Builder'},{to:'/cover-letter',icon:'✍️',label:'Cover Letter'},{to:'/skill-gap',icon:'📊',label:'Skill Gap Analyzer'},{to:'/ats-checker',icon:'🎯',label:'ATS Resume Checker'}].map(t=>(
                  <Link key={t.to} to={t.to} className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start', gap:'var(--space-2)' }}>
                    <span>{t.icon}</span>{t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isCompany && (
            <div className="card">
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                <Link to="/opportunities/post" className="btn btn-primary" style={{ justifyContent:'center' }}>+ Post New Role</Link>
                <Link to="/applications" className="btn btn-secondary btn-sm" style={{ justifyContent:'center' }}>Review Applications</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
