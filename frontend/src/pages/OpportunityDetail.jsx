import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { opportunityAPI, applicationAPI, savedAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SaveButton from '../components/SaveButton';

const TYPE_CLASS = { internship:'type-internship', job:'type-job', freelance:'type-freelance', 'part-time':'type-part-time' };

export default function OpportunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyError, setApplyError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(()=>{
    opportunityAPI.getById(id).then(r=>setOpp(r.data.opportunity)).catch(()=>navigate('/opportunities')).finally(()=>setLoading(false));
    if(user) savedAPI.getSaved().then(r=>setIsSaved((r.data.opportunities||[]).some(o=>o._id===id))).catch(()=>{});
  },[id,user]);

  const handleApply = async(e)=>{
    e.preventDefault(); setApplying(true); setApplyError('');
    try{await applicationAPI.apply({opportunityId:id,coverLetter});setApplied(true);setShowForm(false);}
    catch(err){const msg=err.response?.data?.message||'Failed to apply';if(msg.toLowerCase().includes('already'))setApplied(true);setApplyError(msg);}
    finally{setApplying(false);}
  };

  if (loading) return (
    <div className="page"><div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div className="skeleton" style={{ height:32, width:200 }}/><div className="skeleton" style={{ height:280 }}/><div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'var(--space-5)' }}><div className="skeleton" style={{ height:200 }}/><div className="skeleton" style={{ height:300 }}/></div>
    </div></div>
  );
  if (!opp) return null;

  const { title,company,description,requiredSkills,location,type,stipend,duration,applyDeadline,postedBy,createdAt } = opp;
  const isOwner = user && (user._id===postedBy?._id||user._id===postedBy);
  const canApply = user?.role==='student' && !isOwner;
  const daysAgo = Math.floor((Date.now()-new Date(createdAt))/86400000);

  return (
    <div className="page page-in">
      <Link to="/opportunities" style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', textDecoration:'none', marginBottom:'var(--space-6)', transition:'color var(--t-fast)' }}
        onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
        onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>
        ← All Opportunities
      </Link>

      <div className="bento-grid">
        {/* Main — 8 cols */}
        <div className="col-8" style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
          <div className="card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'var(--space-4)', marginBottom:'var(--space-5)' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-3)', flexWrap:'wrap' }}>
                  <span className={TYPE_CLASS[type]||'type-internship'}>{type}</span>
                  {applyDeadline && new Date(applyDeadline)>new Date() && <span className="badge badge-amber">Closes {new Date(applyDeadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{daysAgo===0?'Today':`${daysAgo}d ago`}</span>
                </div>
                <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.3rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:6 }}>{title}</h1>
                <p style={{ fontFamily:"'Geist'", fontSize:15, color:'var(--text-secondary)' }}>{company}</p>
              </div>
              {user && <SaveButton opportunityId={id} initialSaved={isSaved} onToggle={s=>setIsSaved(s)}/>}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-6)', paddingBlock:'var(--space-5)', borderTop:'1px solid var(--border-subtle)', borderBottom:'1px solid var(--border-subtle)', marginBottom:'var(--space-5)' }}>
              {[location&&{icon:'📍',v:location},stipend&&{icon:'💰',v:stipend},duration&&{icon:'⏱',v:duration}].filter(Boolean).map((m,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Geist'", fontSize:13.5, color:'var(--text-secondary)' }}><span>{m.icon}</span>{m.v}</div>
              ))}
            </div>
            <p className="label" style={{ marginBottom:'var(--space-3)' }}>About the Role</p>
            <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{description}</p>
          </div>

          {requiredSkills?.length > 0 && (
            <div className="card">
              <p className="label" style={{ marginBottom:'var(--space-4)' }}>Required Skills</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {requiredSkills.map(s=><span key={s} className="tag tag-accent" style={{ fontSize:13 }}>{s}</span>)}
              </div>
            </div>
          )}

          {applied && (
            <div className="card" style={{ border:'1px solid var(--green)22', background:'var(--green-muted)' }}>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--green)', display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Application submitted! Track it in <Link to="/applications" style={{ color:'var(--green)', fontWeight:700 }}>My Applications</Link>.
              </p>
            </div>
          )}

          {showForm && (
            <div className="card card-accent">
              <h3 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', marginBottom:'var(--space-5)' }}>Your Application</h3>
              <form onSubmit={handleApply} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <div>
                  <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Cover Letter <span style={{ color:'var(--text-tertiary)' }}>(optional)</span></label>
                  <textarea value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} className="input" style={{ resize:'none', height:140, fontFamily:"'Geist'" }} placeholder="Tell them why you're the right fit..."/>
                </div>
                {applyError && <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--red)' }}>{applyError}</p>}
                <div style={{ display:'flex', gap:'var(--space-3)' }}>
                  <button type="submit" disabled={applying} className="btn btn-primary">{applying?'Submitting...':'Submit Application'}</button>
                  <button type="button" onClick={()=>setShowForm(false)} className="btn btn-ghost">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {isOwner && (
            <div className="card" style={{ border:'1px solid var(--amber-muted)' }}>
              <p className="label" style={{ marginBottom:'var(--space-4)', color:'var(--amber)' }}>Your Listing</p>
              <div style={{ display:'flex', gap:'var(--space-3)' }}>
                <Link to={`/applications?opportunity=${id}`} className="btn btn-secondary btn-sm">View Applicants</Link>
                <button onClick={async()=>{if(confirm('Delete this opportunity?')){await opportunityAPI.delete(id);navigate('/opportunities');}}} className="btn btn-danger btn-sm">Delete</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — 4 cols */}
        <div className="col-4" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
          {canApply && !applied && (
            <div className="card">
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', marginBottom:4 }}>Interested?</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginBottom:'var(--space-5)' }}>Apply before the deadline.</p>
              {!showForm && <button onClick={()=>setShowForm(true)} className="btn btn-primary" style={{ width:'100%', marginBottom:'var(--space-3)' }}>Apply Now</button>}
              <Link to={`/cover-letter?opportunity=${id}`} className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }}>✍️ Generate Cover Letter</Link>
            </div>
          )}
          {!user && (
            <div className="card" style={{ textAlign:'center' }}>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', marginBottom:6 }}>Sign in to apply</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginBottom:'var(--space-5)' }}>Create a free account to apply.</p>
              <Link to="/register" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:'var(--space-2)' }}>Get Started Free</Link>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }}>Sign In</Link>
            </div>
          )}
          {user?.role==='student' && (
            <div className="card card-accent">
              <p className="label" style={{ marginBottom:'var(--space-4)' }}>AI Tools</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                <Link to={`/skill-gap/${id}`} className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start' }}>📊 Skill Gap Analyzer</Link>
                <Link to={`/cover-letter?opportunity=${id}`} className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start' }}>✍️ Cover Letter</Link>
                <Link to={`/ats-checker?opportunity=${id}`} className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start' }}>🎯 ATS Resume Check</Link>
              </div>
            </div>
          )}
          <div className="card card-sm">
            <p className="label" style={{ marginBottom:'var(--space-4)' }}>About Company</p>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
              <div style={{ width:36, height:36, borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px solid var(--border-default)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist'", fontWeight:700, fontSize:14, color:'var(--text-secondary)' }}>{company?.[0]?.toUpperCase()}</div>
              <div><p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13.5, color:'var(--text-primary)' }}>{company}</p><p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>{location}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
