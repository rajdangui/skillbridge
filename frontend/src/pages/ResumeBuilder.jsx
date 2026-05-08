import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumeAPI } from '../services/api';

// ── TEMPLATE RENDERERS ─────────────────────────────────────────────────────
// Each returns an HTML string used for both preview and PDF generation

function templateMinimal(data) {
  const { name='', email='', phone='', college='', branch='', skills=[], bio='', projects=[], github='', linkedin='', website='' } = data;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Arial',sans-serif;font-size:11px;color:#1a1a1a;padding:32px 36px;line-height:1.5;max-width:794px;}
  h1{font-size:22px;font-weight:700;letter-spacing:-0.5px;margin-bottom:2px;}
  .contact{display:flex;flex-wrap:wrap;gap:12px;font-size:10px;color:#555;margin-bottom:18px;padding-bottom:14px;border-bottom:1.5px solid #1a1a1a;}
  .contact a{color:#555;text-decoration:none;}
  h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#555;margin:16px 0 8px;padding-bottom:3px;border-bottom:1px solid #ddd;}
  .bio{font-size:11px;color:#333;line-height:1.6;}
  .skill-list{display:flex;flex-wrap:wrap;gap:5px;}
  .skill{background:#f3f3f3;border:1px solid #e0e0e0;border-radius:3px;padding:2px 8px;font-size:10px;}
  .project{margin-bottom:12px;}
  .project-title{font-weight:700;font-size:11.5px;}
  .project-tech{font-size:10px;color:#666;margin:2px 0;}
  .project-desc{font-size:11px;color:#333;line-height:1.5;}
  .link{font-size:10px;color:#2563eb;}
  .edu-row{display:flex;justify-content:space-between;align-items:baseline;}
  .edu-name{font-weight:700;}
  .edu-meta{font-size:10px;color:#666;}
</style></head><body>
  <h1>${name}</h1>
  <div class="contact">
    ${email?`<span>${email}</span>`:''}
    ${phone?`<span>${phone}</span>`:''}
    ${college?`<span>${college}${branch?` · ${branch}`:''}</span>`:''}
    ${github?`<a href="${github}">${github.replace('https://','')}</a>`:''}
    ${linkedin?`<a href="${linkedin}">${linkedin.replace('https://','')}</a>`:''}
    ${website?`<a href="${website}">${website.replace('https://','')}</a>`:''}
  </div>
  ${bio?`<h2>Profile</h2><p class="bio">${bio}</p>`:''}
  ${skills.length?`<h2>Skills</h2><div class="skill-list">${skills.map(s=>`<span class="skill">${s}</span>`).join('')}</div>`:''}
  ${projects.length?`<h2>Projects</h2>${projects.map(p=>`<div class="project"><div class="project-title">${p.name}${p.liveUrl?` <a class="link" href="${p.liveUrl}">↗</a>`:''}</div>${p.techStack?.length?`<div class="project-tech">${p.techStack.join(' · ')}</div>`:''}<div class="project-desc">${p.description||''}</div></div>`).join('')}`:''}
  <h2>Education</h2>
  <div class="edu-row"><span class="edu-name">${college||'Your College'}</span><span class="edu-meta">${branch||'Branch'}</span></div>
</body></html>`;
}

function templateModern(data) {
  const { name='', email='', phone='', college='', branch='', skills=[], bio='', projects=[], github='', linkedin='', website='' } = data;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Helvetica Neue','Arial',sans-serif;font-size:11px;color:#0f172a;display:grid;grid-template-columns:200px 1fr;min-height:100vh;max-width:794px;}
  .sidebar{background:#0f172a;color:#e2e8f0;padding:28px 20px;font-size:10.5px;}
  .main{padding:28px 28px;}
  .avatar{width:60px;height:60px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#7dd3fc;margin:0 auto 16px;}
  .name{font-size:17px;font-weight:700;color:#fff;text-align:center;margin-bottom:4px;letter-spacing:-0.3px;}
  .role{font-size:10px;color:#94a3b8;text-align:center;margin-bottom:20px;}
  .section-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin:14px 0 7px;padding-bottom:4px;border-bottom:1px solid #1e293b;}
  .contact-item{display:flex;align-items:center;gap:6px;margin-bottom:5px;word-break:break-all;}
  .contact-item a{color:#7dd3fc;text-decoration:none;font-size:10px;}
  .skill-bar-label{display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px;}
  .skill-pill{background:#1e293b;color:#94a3b8;border-radius:3px;padding:2px 7px;font-size:9.5px;display:inline-block;margin:2px 2px 2px 0;}
  .main h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;}
  .bio-text{font-size:11px;line-height:1.7;color:#334155;}
  .project-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:10px 12px;margin-bottom:8px;}
  .project-title{font-weight:700;font-size:11.5px;color:#0f172a;margin-bottom:3px;}
  .project-tech{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;}
  .tech-tag{background:#dbeafe;color:#1d4ed8;border-radius:3px;padding:1px 6px;font-size:9.5px;}
  .project-desc{font-size:10.5px;color:#475569;line-height:1.5;}
  .link-small{font-size:9.5px;color:#2563eb;}
</style></head><body>
  <div class="sidebar">
    <div class="avatar">${name?name[0].toUpperCase():'?'}</div>
    <div class="name">${name}</div>
    <div class="role">${branch||'Student'}</div>
    <div class="section-label">Contact</div>
    ${email?`<div class="contact-item"><span>✉</span><span>${email}</span></div>`:''}
    ${phone?`<div class="contact-item"><span>📞</span><span>${phone}</span></div>`:''}
    ${github?`<div class="contact-item"><span>⌥</span><a href="${github}">GitHub Profile</a></div>`:''}
    ${linkedin?`<div class="contact-item"><span>in</span><a href="${linkedin}">LinkedIn</a></div>`:''}
    ${website?`<div class="contact-item"><span>🌐</span><a href="${website}">Portfolio</a></div>`:''}
    ${skills.length?`<div class="section-label">Skills</div>${skills.map(s=>`<span class="skill-pill">${s}</span>`).join('')}`:''}
    ${college?`<div class="section-label">Education</div><div style="font-size:10px;color:#cbd5e1">${college}</div><div style="font-size:9.5px;color:#64748b">${branch||''}</div>`:''}
  </div>
  <div class="main">
    ${bio?`<h2>About</h2><p class="bio-text">${bio}</p>`:''}
    ${projects.length?`<h2>Projects</h2>${projects.map(p=>`<div class="project-card"><div class="project-title">${p.name}${p.liveUrl?` <a class="link-small" href="${p.liveUrl}">[Live]</a>`:''} ${p.repoUrl?`<a class="link-small" href="${p.repoUrl}">[Code]</a>`:''}</div>${p.techStack?.length?`<div class="project-tech">${p.techStack.map(t=>`<span class="tech-tag">${t}</span>`).join('')}</div>`:''}<p class="project-desc">${p.description||''}</p></div>`).join('')}`:''}
  </div>
</body></html>`;
}

function templateATS(data) {
  const { name='', email='', phone='', college='', branch='', skills=[], bio='', projects=[], github='', linkedin='', website='' } = data;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Times New Roman',Times,serif;font-size:11.5px;color:#000;padding:36px 40px;line-height:1.5;max-width:794px;}
  h1{font-size:20px;font-weight:bold;text-align:center;margin-bottom:4px;}
  .contact-line{text-align:center;font-size:10.5px;color:#333;margin-bottom:16px;}
  .contact-line a{color:#333;text-decoration:none;}
  h2{font-size:12px;font-weight:bold;text-transform:uppercase;margin:14px 0 6px;border-bottom:1px solid #000;padding-bottom:2px;}
  p{margin-bottom:6px;font-size:11px;}
  ul{padding-left:18px;margin-bottom:6px;}
  li{margin-bottom:3px;font-size:11px;}
  .skill-list{font-size:11px;}
  .proj-name{font-weight:bold;}
  .proj-tech{font-style:italic;font-size:10.5px;color:#555;}
</style></head><body>
  <h1>${name}</h1>
  <div class="contact-line">
    ${[email, phone, college&&branch?`${college} | ${branch}`:college||branch, github?`GitHub: ${github.replace('https://github.com/','@')}`:null, linkedin?`LinkedIn: ${linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//,'@')}`:null].filter(Boolean).join(' | ')}
  </div>
  ${bio?`<h2>Professional Summary</h2><p>${bio}</p>`:''}
  ${skills.length?`<h2>Technical Skills</h2><p class="skill-list">${skills.join(', ')}</p>`:''}
  ${projects.length?`<h2>Projects</h2>${projects.map(p=>`<p><span class="proj-name">${p.name}</span>${p.techStack?.length?` <span class="proj-tech">(${p.techStack.join(', ')})</span>`:''}<br/>${p.description||''}${p.liveUrl?` [${p.liveUrl}]`:''}</p>`).join('')}`:''}
  <h2>Education</h2>
  <p>${college||'College Name'} — ${branch||'Branch'}</p>
</body></html>`;
}

const TEMPLATES = [
  { id:'minimal', label:'Minimal', desc:'Clean one-column layout. Universally readable.', render: templateMinimal },
  { id:'modern',  label:'Modern',  desc:'Two-column with dark sidebar. Visually striking.',render: templateModern  },
  { id:'ats',     label:'ATS Safe',desc:'Plain text-friendly. Optimised for ATS parsers.',  render: templateATS    },
];

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const { user, updateUser } = useAuth();
  const iframeRef = useRef(null);
  const [activeTemplate, setActiveTemplate] = useState('minimal');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('personal');
  const [newSkill, setNewSkill] = useState('');
  const [newTech, setNewTech] = useState('');
  const [editingProject, setEditingProject] = useState(null); // index | 'new'

  const [data, setData] = useState({
    name: '', email: '', phone: '', college: '', branch: '',
    bio: '', skills: [], github: '', linkedin: '', website: '', portfolio: '',
    projects: [],
  });

  // Load profile data on mount
  useEffect(() => {
    resumeAPI.getData().then(r => {
      const u = r.data.user;
      setData({
        name:      u.name      || '',
        email:     u.email     || '',
        phone:     u.phone     || '',
        college:   u.college   || '',
        branch:    u.branch    || '',
        bio:       u.bio       || '',
        skills:    u.skills    || [],
        github:    u.github    || '',
        linkedin:  u.linkedin  || '',
        website:   u.website   || '',
        portfolio: u.portfolio || '',
        projects:  u.projects  || [],
      });
    }).catch(console.error);
  }, []);

  // Update preview iframe
  useEffect(() => {
    const tmpl = TEMPLATES.find(t => t.id === activeTemplate);
    if (!tmpl || !iframeRef.current) return;
    const html = tmpl.render(data);
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (doc) { doc.open(); doc.write(html); doc.close(); }
  }, [data, activeTemplate]);

  const set = (field, val) => setData(p => ({...p, [field]: val}));
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await resumeAPI.saveData({
        name: data.name, bio: data.bio, college: data.college, branch: data.branch,
        skills: data.skills, github: data.github, linkedin: data.linkedin,
        website: data.website, portfolio: data.portfolio, projects: data.projects,
      });
      if (updateUser) updateUser(r.data.user);
      showToast('Saved to profile!');
    } catch(e) { showToast('Save failed'); }
    finally { setSaving(false); }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const tmpl = TEMPLATES.find(t => t.id === activeTemplate);
      const html = tmpl.render(data);
      const r = await resumeAPI.generatePDF({ html, filename: `${data.name.replace(/\s+/g,'-') || 'resume'}.pdf` });
      const blob = r.data instanceof Blob ? r.data : new Blob([r.data], { type:'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${data.name || 'resume'}.pdf`; a.click();
      URL.revokeObjectURL(url);
      showToast('PDF downloaded!');
    } catch(e) {
      // Fallback: print preview
      const tmpl = TEMPLATES.find(t => t.id === activeTemplate);
      const html = tmpl.render(data);
      const w = window.open('','_blank');
      w.document.write(html);
      w.document.close();
      w.print();
      showToast('Opened print dialog');
    }
    finally { setExporting(false); }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !data.skills.includes(s)) { set('skills', [...data.skills, s]); }
    setNewSkill('');
  };
  const removeSkill = (s) => set('skills', data.skills.filter(x => x !== s));

  const emptyProject = { name:'', description:'', techStack:[], liveUrl:'', repoUrl:'' };
  const openNewProject = () => {
    setData(p => ({...p, projects: [...p.projects, {...emptyProject}]}));
    setEditingProject(data.projects.length);
  };
  const updateProject = (idx, field, val) => {
    setData(p => { const arr=[...p.projects]; arr[idx]={...arr[idx],[field]:val}; return {...p,projects:arr}; });
  };
  const removeProject = (idx) => {
    setData(p => ({...p, projects: p.projects.filter((_,i)=>i!==idx)}));
    setEditingProject(null);
  };
  const addTechToProject = (idx) => {
    const t = newTech.trim();
    if (t) { updateProject(idx,'techStack',[...(data.projects[idx]?.techStack||[]),t]); setNewTech(''); }
  };

  const SECTIONS = [
    { id:'personal',  label:'Personal Info' },
    { id:'skills',    label:'Skills' },
    { id:'projects',  label:'Projects' },
    { id:'links',     label:'Links & Social' },
  ];

  const inputStyle = { fontFamily:"'Geist'", fontSize:13, color:'var(--text-primary)', background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-md)', padding:'9px 12px', width:'100%', outline:'none', transition:'border-color var(--t-fast),box-shadow var(--t-fast)' };
  const labelStyle = { fontFamily:"'Geist'", fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:5, letterSpacing:'0.02em' };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)', background:'var(--bg-base)', overflow:'hidden' }}>
      <style>{`
        @keyframes toastSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .rb-input:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-muted)!important;}
        .rb-tab:hover{background:var(--bg-overlay)!important;color:var(--text-primary)!important;}
        .rb-tab.active{background:var(--bg-overlay)!important;color:var(--text-primary)!important;border-left-color:var(--accent)!important;}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:70, right:24, zIndex:9999, background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-md)', padding:'10px 18px', fontFamily:"'Geist'", fontSize:13, color:'var(--green)', boxShadow:'var(--shadow-md)', animation:'toastSlide .2s' }}>
          ✓ {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border-subtle)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'var(--space-4)', flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)' }}>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Resume Builder</h1>
          <div style={{ display:'flex', gap:'var(--space-2)' }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setActiveTemplate(t.id)}
                style={{ padding:'5px 12px', borderRadius:'var(--radius-sm)', fontFamily:"'Geist'", fontSize:12, fontWeight:500, cursor:'pointer', transition:'all var(--t-fast)', border:'1px solid', borderColor: activeTemplate===t.id ? 'var(--accent-border)' : 'var(--border-default)', background: activeTemplate===t.id ? 'var(--accent-muted)' : 'var(--bg-elevated)', color: activeTemplate===t.id ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:'var(--space-2)' }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-secondary btn-sm">
            {saving ? 'Saving…' : '💾 Save to Profile'}
          </button>
          <button onClick={handleExportPDF} disabled={exporting} className="btn btn-primary btn-sm">
            {exporting ? 'Generating…' : '⬇ Export PDF'}
          </button>
        </div>
      </div>

      {/* Body: editor | preview */}
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', flex:1, overflow:'hidden' }}>

        {/* ── EDITOR PANEL ───────────────────────────────── */}
        <div style={{ background:'var(--bg-surface)', borderRight:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Section tabs */}
          <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border-subtle)', display:'flex', gap:4, flexWrap:'wrap', flexShrink:0 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`rb-tab${activeSection===s.id?' active':''}`}
                style={{ padding:'5px 10px', borderRadius:'var(--radius-sm)', fontFamily:"'Geist'", fontSize:12, fontWeight:500, cursor:'pointer', border:'none', background: activeSection===s.id?'var(--bg-overlay)':'transparent', color: activeSection===s.id?'var(--text-primary)':'var(--text-secondary)', transition:'all var(--t-fast)' }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ flex:1, overflowY:'auto', padding:'var(--space-5)' }}>

            {/* ── Personal ── */}
            {activeSection === 'personal' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                {[['Full Name','name','text','Alex Johnson'],['Email','email','email','alex@email.com'],['Phone','phone','tel','+91 98765 43210'],['College','college','text','MIT World Peace University'],['Branch / Degree','branch','text','B.Tech Computer Science']].map(([l,k,t,p]) => (
                  <div key={k}>
                    <label style={labelStyle}>{l}</label>
                    <input type={t} value={data[k]} onChange={e => set(k, e.target.value)} placeholder={p}
                      className="rb-input" style={inputStyle}/>
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Professional Summary</label>
                  <textarea value={data.bio} onChange={e => set('bio', e.target.value)} rows={4}
                    placeholder="Write 2–3 sentences about yourself, your goals, and what you bring…"
                    className="rb-input" style={{...inputStyle, resize:'vertical', lineHeight:1.6}}/>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color: data.bio.length < 80 ? 'var(--amber)' : 'var(--text-tertiary)' }}>{data.bio.length} chars</span>
                    {data.bio.length < 80 && <span style={{ fontFamily:"'Geist'", fontSize:10, color:'var(--amber)' }}>Aim for 80+ chars</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Skills ── */}
            {activeSection === 'skills' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
                <div>
                  <label style={labelStyle}>Add Skills</label>
                  <div style={{ display:'flex', gap:'var(--space-2)' }}>
                    <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g. React, Python…"
                      onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSkill();} }}
                      className="rb-input" style={{...inputStyle, flex:1}}/>
                    <button onClick={addSkill} className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>Add</button>
                  </div>
                </div>
                {data.skills.length > 0 && (
                  <div>
                    <label style={labelStyle}>Your Skills ({data.skills.length})</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {data.skills.map((s,i) => (
                        <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius-sm)', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-accent)' }}>
                          {s}
                          <button onClick={() => removeSkill(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:13, lineHeight:1, padding:0, marginLeft:2 }}
                            onMouseEnter={e=>e.target.style.color='var(--red)'}
                            onMouseLeave={e=>e.target.style.color='var(--text-tertiary)'}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Projects ── */}
            {activeSection === 'projects' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                {data.projects.map((proj, idx) => (
                  <div key={idx} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'var(--space-4)', display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{proj.name||`Project ${idx+1}`}</span>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setEditingProject(editingProject===idx?null:idx)}
                          style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-accent)', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', borderRadius:4, padding:'3px 8px', cursor:'pointer' }}>
                          {editingProject===idx?'Done':'Edit'}
                        </button>
                        <button onClick={() => removeProject(idx)}
                          style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--red)', background:'var(--red-muted)', border:'1px solid rgba(248,113,113,.2)', borderRadius:4, padding:'3px 8px', cursor:'pointer' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                    {editingProject === idx && (
                      <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
                        <div><label style={labelStyle}>Project Name</label><input value={proj.name} onChange={e=>updateProject(idx,'name',e.target.value)} className="rb-input" style={inputStyle} placeholder="My Awesome App"/></div>
                        <div><label style={labelStyle}>Description</label><textarea value={proj.description} onChange={e=>updateProject(idx,'description',e.target.value)} rows={3} className="rb-input" style={{...inputStyle,resize:'vertical',lineHeight:1.5}} placeholder="What does it do? What problem does it solve?"/></div>
                        <div>
                          <label style={labelStyle}>Tech Stack</label>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                            {(proj.techStack||[]).map((t,ti) => (
                              <span key={ti} style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',background:'var(--bg-elevated)',border:'1px solid var(--border-default)',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-secondary)' }}>
                                {t}
                                <button onClick={()=>updateProject(idx,'techStack',(proj.techStack||[]).filter((_,ti2)=>ti2!==ti))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:12,lineHeight:1,padding:0 }}>×</button>
                              </span>
                            ))}
                          </div>
                          <div style={{ display:'flex', gap:6 }}>
                            <input value={newTech} onChange={e=>setNewTech(e.target.value)} placeholder="React, Node.js…"
                              onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTechToProject(idx);}}}
                              className="rb-input" style={{...inputStyle,flex:1}}/>
                            <button onClick={()=>addTechToProject(idx)} className="btn btn-secondary btn-xs">+</button>
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                          <div><label style={labelStyle}>Live URL</label><input value={proj.liveUrl||''} onChange={e=>updateProject(idx,'liveUrl',e.target.value)} className="rb-input" style={inputStyle} placeholder="https://…"/></div>
                          <div><label style={labelStyle}>Repo URL</label><input value={proj.repoUrl||''} onChange={e=>updateProject(idx,'repoUrl',e.target.value)} className="rb-input" style={inputStyle} placeholder="github.com/…"/></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={openNewProject} className="btn btn-secondary" style={{ justifyContent:'center' }}>+ Add Project</button>
              </div>
            )}

            {/* ── Links ── */}
            {activeSection === 'links' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                {[['GitHub','github','https://github.com/username'],['LinkedIn','linkedin','https://linkedin.com/in/username'],['Portfolio/Website','website','https://yourname.dev'],['Other Portfolio','portfolio','https://behance.net/…']].map(([l,k,p]) => (
                  <div key={k}>
                    <label style={labelStyle}>{l}</label>
                    <input type="url" value={data[k]} onChange={e=>set(k,e.target.value)} placeholder={p}
                      className="rb-input" style={inputStyle}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template description */}
          <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderTop:'1px solid var(--border-subtle)', flexShrink:0 }}>
            <p style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)', lineHeight:1.5 }}>
              <strong style={{ color:'var(--text-secondary)' }}>{TEMPLATES.find(t=>t.id===activeTemplate)?.label}</strong> — {TEMPLATES.find(t=>t.id===activeTemplate)?.desc}
            </p>
          </div>
        </div>

        {/* ── PREVIEW PANEL ──────────────────────────────── */}
        <div style={{ background:'var(--bg-base)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'var(--bg-surface)', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)', fontWeight:500 }}>Live Preview</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-tertiary)' }}>A4 · Updates as you type</span>
          </div>
          <div style={{ flex:1, overflow:'auto', display:'flex', justifyContent:'center', padding:'24px', background:'#444' }}>
            <iframe ref={iframeRef} title="Resume Preview"
              style={{ width:'794px', minHeight:'1123px', border:'none', background:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', borderRadius:2, flexShrink:0 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}
