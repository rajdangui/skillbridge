import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

function computeScore(u) {
  if (u?.role === 'company') {
    const checks = [
      { pts:20, ok: !!u.bio && u.bio.length >= 30 },
      { pts:20, ok: !!u.companyName },
      { pts:20, ok: !!u.companyWebsite },
      { pts:15, ok: !!u.linkedin },
      { pts:10, ok: !!u.avatar },
      { pts: 5, ok: !!u.website },
      { pts: 5, ok: !!u.isEmailVerified },
    ];
    return Math.min(100, checks.reduce((s,c) => s + (c.ok ? c.pts : 0), 0));
  }
  const checks = [
    { pts:15, ok: !!u.bio && u.bio.length >= 30 },
    { pts:15, ok: (u.skills||[]).length >= 3 },
    { pts:10, ok: !!u.college },
    { pts:10, ok: !!u.branch },
    { pts: 5, ok: !!u.github },
    { pts: 5, ok: !!u.linkedin },
    { pts:15, ok: !!u.resume },
    { pts:10, ok: (u.projects||[]).length >= 1 },
    { pts: 5, ok: !!u.website || !!u.portfolio },
    { pts: 5, ok: !!u.isEmailVerified },
  ];
  return checks.reduce((s,c) => s + (c.ok ? c.pts : 0), 0);
}

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newTech, setNewTech]   = useState('');
  const [editingProjIdx, setEditingProjIdx] = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name:          user?.name          || '',
    bio:           user?.bio           || '',
    college:       user?.college       || '',
    branch:        user?.branch        || '',
    skills:        user?.skills        || [],
    github:        user?.github        || '',
    linkedin:      user?.linkedin      || '',
    website:       user?.website       || '',
    portfolio:     user?.portfolio     || '',
    companyName:   user?.companyName   || '',
    companyWebsite:user?.companyWebsite|| '',
    projects:      user?.projects      || [],
  });

  const score = computeScore({ ...user, ...form });

  const handleChange = (e) => {
    setForm(p => ({...p, [e.target.name]: e.target.value}));
    setSuccess(''); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await userAPI.updateProfile(user._id, { ...form, skills: form.skills });
      updateUser(r.data.user);
      setSuccess('Profile updated!');
    } catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.type !== 'application/pdf') { setError('PDF only'); return; }
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('resume', file);
      const r = await userAPI.uploadResume(fd);
      updateUser(r.data.user); setSuccess('Resume uploaded!');
    } catch (err) { setError(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) setForm(p => ({...p, skills:[...p.skills,s]}));
    setNewSkill('');
  };
  const removeSkill = (s) => setForm(p => ({...p, skills: p.skills.filter(x=>x!==s)}));

  const addProject = () => {
    setForm(p => ({...p, projects:[...p.projects,{name:'',description:'',techStack:[],liveUrl:'',repoUrl:''}]}));
    setEditingProjIdx(form.projects.length);
  };
  const updateProject = (idx, field, val) => {
    setForm(p => { const arr=[...p.projects]; arr[idx]={...arr[idx],[field]:val}; return {...p,projects:arr}; });
  };
  const removeProject = (idx) => {
    setForm(p => ({...p, projects:p.projects.filter((_,i)=>i!==idx)}));
    setEditingProjIdx(null);
  };
  const addTech = (idx) => {
    const t = newTech.trim();
    if (t) { updateProject(idx,'techStack',[...(form.projects[idx].techStack||[]),t]); setNewTech(''); }
  };

  const labelS = { fontFamily:"'Geist'",fontSize:12.5,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:6 };
  const inputS = { fontFamily:"'Geist'",fontSize:13.5,color:'var(--text-primary)',background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',padding:'9px 13px',width:'100%',outline:'none',transition:'border-color var(--t-fast),box-shadow var(--t-fast)' };

  // Missing items for nudge list — role-aware
  const missing = user?.role === 'company' ? [
    !form.bio || form.bio.length<30 ? {pts:20,msg:'Add a company description (30+ chars)'} : null,
    !form.companyName ? {pts:20,msg:'Set your company name'} : null,
    !form.companyWebsite ? {pts:20,msg:'Add your company website'} : null,
    !form.linkedin ? {pts:15,msg:'Add your LinkedIn page'} : null,
    !form.website ? {pts:5,msg:'Add a secondary website'} : null,
  ].filter(Boolean).slice(0,4) : [
    !form.bio || form.bio.length<30 ? {pts:15,msg:'Add a bio (30+ chars)'} : null,
    form.skills.length<3 ? {pts:15,msg:'Add at least 3 skills'} : null,
    !user?.resume ? {pts:15,msg:'Upload your resume PDF'} : null,
    form.projects.length<1 ? {pts:10,msg:'Add at least 1 project'} : null,
    !form.github ? {pts:5,msg:'Add your GitHub'} : null,
    !form.linkedin ? {pts:5,msg:'Add your LinkedIn'} : null,
  ].filter(Boolean).slice(0,4);

  return (
    <div className="page page-in">
      <style>{`.pf-input:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-muted)!important;}`}</style>

      {/* Header */}
      <div style={{ marginBottom:'var(--space-8)' }}>
        <h1 style={{ fontFamily:"'Geist'",fontWeight:700,fontSize:'clamp(1.4rem,3vw,2rem)',letterSpacing:'-0.03em',color:'var(--text-primary)',marginBottom:4 }}>Edit Profile</h1>
        <p style={{ fontFamily:"'Geist'",fontSize:13,color:'var(--text-tertiary)' }}>A strong profile unlocks all AI features and gets 3× more recruiter attention</p>
      </div>

      <div className="bento-grid">
        {/* Form — 8 cols */}
        <div className="col-8">
          {success && <div style={{ marginBottom:'var(--space-4)',padding:'10px 14px',background:'var(--green-muted)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'var(--radius-md)',fontFamily:"'Geist'",fontSize:13,color:'var(--green)' }}>✓ {success}</div>}
          {error   && <div style={{ marginBottom:'var(--space-4)',padding:'10px 14px',background:'var(--red-muted)',border:'1px solid rgba(248,113,113,.2)',borderRadius:'var(--radius-md)',fontFamily:"'Geist'",fontSize:13,color:'var(--red)' }}>⚠ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:'var(--space-5)' }}>

            {/* Basic info */}
            <div className="card">
              <p className="label" style={{ marginBottom:'var(--space-5)' }}>Basic Information</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-4)' }}>
                {[['name','text','Full Name',''],['bio','','Bio',''],
                  user?.role==='student'?['college','text','College','']:['companyName','text','Company Name',''],
                  user?.role==='student'?['branch','text','Branch','']:['companyWebsite','url','Website','']
                ].map(([n,t,l,p]) => (
                  <div key={n} style={{ gridColumn:n==='bio'?'1/-1':undefined }}>
                    <label style={labelS}>{l}</label>
                    {n==='bio'
                      ? <textarea name={n} value={form[n]} onChange={handleChange} rows={3}
                          placeholder="Tell others about yourself, your goals, and what you bring…"
                          className="pf-input" style={{...inputS,resize:'none',lineHeight:1.6}} maxLength={500}/>
                      : <input name={n} type={t||'text'} value={form[n]} onChange={handleChange}
                          className="pf-input" style={inputS} placeholder={p}/>
                    }
                    {n==='bio' && <div style={{ display:'flex',justifyContent:'space-between',marginTop:4 }}><span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-tertiary)' }}>{form.bio.length}/500</span>{form.bio.length<30&&form.bio.length>0&&<span style={{ fontFamily:"'Geist'",fontSize:10,color:'var(--amber)' }}>Add {30-form.bio.length} more chars</span>}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            {user?.role==='student' && (
              <div className="card">
                <p className="label" style={{ marginBottom:'var(--space-5)' }}>Skills</p>
                <div style={{ display:'flex',gap:'var(--space-2)',marginBottom:'var(--space-4)' }}>
                  <input value={newSkill} onChange={e=>setNewSkill(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSkill();}}}
                    placeholder="React, Python, Docker… press Enter"
                    className="pf-input" style={{...inputS,flex:1}}/>
                  <button type="button" onClick={addSkill} className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>Add</button>
                </div>
                {form.skills.length > 0 && (
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {form.skills.map((s,i) => (
                      <div key={i} style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',background:'var(--accent-muted)',border:'1px solid var(--accent-border)',borderRadius:'var(--radius-sm)',fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-accent)' }}>
                        {s}
                        <button type="button" onClick={()=>removeSkill(s)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:14,lineHeight:1,padding:0 }}
                          onMouseEnter={e=>e.target.style.color='var(--red)'}
                          onMouseLeave={e=>e.target.style.color='var(--text-tertiary)'}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Projects */}
            {user?.role==='student' && (
              <div className="card">
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'var(--space-5)' }}>
                  <p className="label">Projects</p>
                  <Link to="/resume-builder" style={{ fontFamily:"'Geist'",fontSize:12,color:'var(--text-accent)',textDecoration:'none' }}>Build resume →</Link>
                </div>
                {form.projects.map((proj,idx) => (
                  <div key={idx} style={{ marginBottom:'var(--space-4)',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:'var(--space-4)' }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: editingProjIdx===idx ? 'var(--space-4)' : 0 }}>
                      <span style={{ fontFamily:"'Geist'",fontWeight:600,fontSize:13.5,color:'var(--text-primary)' }}>{proj.name||`Project ${idx+1}`}</span>
                      <div style={{ display:'flex',gap:6 }}>
                        <button type="button" onClick={()=>setEditingProjIdx(editingProjIdx===idx?null:idx)}
                          style={{ fontFamily:"'Geist'",fontSize:11,color:'var(--text-accent)',background:'var(--accent-muted)',border:'1px solid var(--accent-border)',borderRadius:4,padding:'3px 9px',cursor:'pointer' }}>
                          {editingProjIdx===idx?'Done':'Edit'}
                        </button>
                        <button type="button" onClick={()=>removeProject(idx)}
                          style={{ fontFamily:"'Geist'",fontSize:11,color:'var(--red)',background:'var(--red-muted)',border:'1px solid rgba(248,113,113,.2)',borderRadius:4,padding:'3px 9px',cursor:'pointer' }}>Remove</button>
                      </div>
                    </div>
                    {editingProjIdx===idx && (
                      <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-3)' }}>
                        <div><label style={labelS}>Project Name</label><input value={proj.name} onChange={e=>updateProject(idx,'name',e.target.value)} className="pf-input" style={inputS} placeholder="My Project"/></div>
                        <div><label style={labelS}>Description</label><textarea value={proj.description||''} onChange={e=>updateProject(idx,'description',e.target.value)} rows={2} className="pf-input" style={{...inputS,resize:'none',lineHeight:1.5}} placeholder="What it does, what problem it solves…"/></div>
                        <div>
                          <label style={labelS}>Tech Stack</label>
                          <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:6 }}>
                            {(proj.techStack||[]).map((t,ti)=>(
                              <span key={ti} style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',background:'var(--bg-base)',border:'1px solid var(--border-default)',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-secondary)' }}>
                                {t}<button type="button" onClick={()=>updateProject(idx,'techStack',(proj.techStack).filter((_,i2)=>i2!==ti))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:12,lineHeight:1,padding:0 }}>×</button>
                              </span>
                            ))}
                          </div>
                          <div style={{ display:'flex',gap:6 }}>
                            <input value={newTech} onChange={e=>setNewTech(e.target.value)} placeholder="React, Node.js…" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTech(idx);}}} className="pf-input" style={{...inputS,flex:1}}/>
                            <button type="button" onClick={()=>addTech(idx)} className="btn btn-secondary btn-xs">+</button>
                          </div>
                        </div>
                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-3)' }}>
                          <div><label style={labelS}>Live URL</label><input value={proj.liveUrl||''} onChange={e=>updateProject(idx,'liveUrl',e.target.value)} className="pf-input" style={inputS} placeholder="https://…"/></div>
                          <div><label style={labelS}>Repo URL</label><input value={proj.repoUrl||''} onChange={e=>updateProject(idx,'repoUrl',e.target.value)} className="pf-input" style={inputS} placeholder="github.com/…"/></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addProject} className="btn btn-secondary btn-sm" style={{ width:'100%',justifyContent:'center' }}>+ Add Project</button>
              </div>
            )}

            {/* Social links */}
            <div className="card">
              <p className="label" style={{ marginBottom:'var(--space-5)' }}>Social Links</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-4)' }}>
                {[['github','GitHub','https://github.com/you'],['linkedin','LinkedIn','https://linkedin.com/in/you'],['website','Website','https://yourname.dev'],['portfolio','Portfolio','https://behance.net/…']].map(([n,l,p])=>(
                  <div key={n}><label style={labelS}>{l}</label><input name={n} type="url" value={form[n]} onChange={handleChange} className="pf-input" style={inputS} placeholder={p}/></div>
                ))}
              </div>
            </div>

            {/* Resume upload */}
            {user?.role==='student' && (
              <div className="card">
                <p className="label" style={{ marginBottom:'var(--space-4)' }}>Resume</p>
                <div style={{ display:'flex',alignItems:'center',gap:'var(--space-4)',flexWrap:'wrap' }}>
                  {user?.resume
                    ? <div style={{ display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'8px 14px',background:'var(--green-muted)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'var(--radius-md)',flex:1 }}>
                        <span style={{ fontFamily:"'Geist'",fontSize:13,color:'var(--green)' }}>✓ Resume on file</span>
                        <a href={user.resume} target="_blank" rel="noreferrer" style={{ fontFamily:"'Geist'",fontSize:12,color:'var(--green)',textDecoration:'none',fontWeight:700,marginLeft:'auto' }}>View ↗</a>
                      </div>
                    : <p style={{ fontFamily:"'Geist'",fontSize:13,color:'var(--text-tertiary)' }}>No resume uploaded yet · PDF only · max 5MB</p>
                  }
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display:'none' }}/>
                  <button type="button" onClick={()=>fileRef.current.click()} disabled={uploading} className="btn btn-secondary btn-sm">
                    {uploading?'Uploading…':user?.resume?'Replace Resume':'Upload PDF'}
                  </button>
                  <Link to="/resume-builder" className="btn btn-primary btn-sm">Build Resume →</Link>
                </div>
              </div>
            )}

            <div style={{ display:'flex',gap:'var(--space-3)' }}>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg">{loading?'Saving…':'Save Changes'}</button>
            </div>
          </form>
        </div>

        {/* Sidebar — 4 cols */}
        <div className="col-4" style={{ display:'flex',flexDirection:'column',gap:'var(--space-4)',alignSelf:'start' }}>
          {/* Profile score */}
          <div className="card card-accent">
            <div style={{ display:'flex',alignItems:'center',gap:'var(--space-3)',marginBottom:'var(--space-5)',paddingBottom:'var(--space-4)',borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ width:40,height:40,borderRadius:'50%',background:'var(--accent-muted)',border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Geist'",fontWeight:700,fontSize:16,color:'var(--text-accent)',flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily:"'Geist'",fontWeight:700,fontSize:14,color:'var(--text-primary)' }}>{user?.name}</p>
                <p style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{user?.role}</p>
              </div>
            </div>

            <p className="label" style={{ marginBottom:8 }}>Profile Strength</p>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
              <span style={{ fontFamily:"'Geist'",fontWeight:700,fontSize:24,letterSpacing:'-0.04em',color: score>=70?'var(--green)':score>=50?'var(--amber)':'var(--red)' }}>{score}%</span>
              <span style={{ fontFamily:"'Geist'",fontSize:12,color: score>=70?'var(--green)':score>=50?'var(--amber)':'var(--red)',alignSelf:'center',fontWeight:600 }}>
                {score>=90?'Elite':score>=70?'Strong':score>=50?'Good':score>=30?'Building':'Starter'}
              </span>
            </div>
            <div style={{ height:6,background:'var(--bg-elevated)',borderRadius:99,overflow:'hidden',marginBottom:'var(--space-5)' }}>
              <div style={{ height:'100%',width:`${score}%`,background: score>=70?'var(--green)':score>=50?'var(--amber)':'var(--red)',borderRadius:99,transition:'width 1s cubic-bezier(.16,1,.3,1)' }}/>
            </div>

            {missing.length > 0 && (
              <>
                <p style={{ fontFamily:"'Geist'",fontSize:12,fontWeight:600,color:'var(--text-secondary)',marginBottom:'var(--space-3)' }}>Next steps</p>
                <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-2)' }}>
                  {missing.map((m,i) => (
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:10,fontWeight:700,color:'var(--text-accent)',background:'var(--accent-muted)',border:'1px solid var(--accent-border)',borderRadius:4,padding:'2px 5px',flexShrink:0 }}>+{m.pts}</span>
                      <span style={{ fontFamily:"'Geist'",fontSize:12,color:'var(--text-secondary)' }}>{m.msg}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {score >= 70 && (
              <div style={{ marginTop:'var(--space-4)',padding:'10px 12px',background:'var(--green-muted)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'var(--radius-md)',fontFamily:"'Geist'",fontSize:12,color:'var(--green)' }}>
                ✓ All AI features unlocked
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card card-sm">
            <p className="label" style={{ marginBottom:'var(--space-3)' }}>Quick Links</p>
            <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-2)' }}>
              <Link to="/resume-builder" className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start',gap:'var(--space-2)' }}>📄 Resume Builder</Link>
              <Link to="/ats-checker" className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start',gap:'var(--space-2)' }}>🎯 ATS Checker</Link>
              <Link to="/skill-gap" className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start',gap:'var(--space-2)' }}>📊 Skill Gap Analyzer</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
