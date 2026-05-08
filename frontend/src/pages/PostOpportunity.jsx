import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { opportunityAPI } from '../services/api';
const TYPES = ['internship','job','freelance','part-time'];
export default function PostOpportunity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title:'',company:'',description:'',requiredSkills:'',location:'Remote',type:'internship',stipend:'',duration:'',applyDeadline:'' });
  const handleChange = e => { setForm(p=>({...p,[e.target.name]:e.target.value})); setError(''); };
  const handleSubmit = async e => {
    e.preventDefault(); if(!form.title||!form.company||!form.description){setError('Title, company and description are required');return;}
    setLoading(true);
    try{const r=await opportunityAPI.create(form);navigate(`/opportunities/${r.data.opportunity._id}`);}
    catch(err){setError(err.response?.data?.message||'Failed to post');}finally{setLoading(false);}
  };
  const skillPreview = form.requiredSkills.split(',').map(s=>s.trim()).filter(Boolean);
  return (
    <div className="page page-in">
      <Link to="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', textDecoration:'none', marginBottom:'var(--space-6)' }}>← Dashboard</Link>
      <div style={{ marginBottom:'var(--space-8)' }}>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4 }}>Post an Opportunity</h1>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>Reach thousands of talented students</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)', maxWidth:720 }}>
        <div className="card">
          <p className="label" style={{ marginBottom:'var(--space-5)' }}>Basic Details</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            {[['title','text','Job Title *','Frontend Developer Intern'],['company','text','Company *','Acme Corp'],['location','text','Location','Remote / Mumbai'],['stipend','text','Stipend / Salary','₹15,000/mo'],['duration','text','Duration','3 months'],['applyDeadline','date','Application Deadline','']].map(([n,t,l,p])=>(
              <div key={n}><label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>{l}</label><input name={n} type={t} value={form[n]} onChange={handleChange} className="input" placeholder={p} required={l.endsWith('*')}/></div>
            ))}
          </div>
          <div style={{ marginTop:'var(--space-4)' }}>
            <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>Opportunity Type</label>
            <div style={{ display:'flex', gap:'var(--space-2)' }}>
              {TYPES.map(t=>(
                <button key={t} type="button" onClick={()=>setForm(p=>({...p,type:t}))}
                  style={{ padding:'7px 16px', borderRadius:'var(--radius-md)', border:`1px solid ${form.type===t?'var(--accent-border)':'var(--border-default)'}`, background:form.type===t?'var(--accent-muted)':'var(--bg-elevated)', fontFamily:"'Geist'", fontWeight:500, fontSize:13, color:form.type===t?'var(--text-accent)':'var(--text-secondary)', cursor:'pointer', transition:'all var(--t-fast)', textTransform:'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <p className="label" style={{ marginBottom:'var(--space-5)' }}>Description & Requirements</p>
          <div style={{ marginBottom:'var(--space-4)' }}>
            <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input" required style={{ resize:'none', height:160, fontFamily:"'Geist'" }} placeholder="Describe the role, responsibilities, and what students will learn..."/>
          </div>
          <div>
            <label style={{ fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Required Skills <span style={{ color:'var(--text-tertiary)' }}>(comma-separated)</span></label>
            <input name="requiredSkills" value={form.requiredSkills} onChange={handleChange} className="input" placeholder="React, JavaScript, CSS, Git..."/>
            {skillPreview.length > 0 && <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:'var(--space-3)' }}>{skillPreview.map((s,i)=><span key={i} className="tag tag-accent">{s}</span>)}</div>}
          </div>
        </div>
        {error && <div style={{ padding:'10px 14px', background:'var(--red-muted)', border:'1px solid rgba(248,113,113,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--red)' }}>{error}</div>}
        <div style={{ display:'flex', gap:'var(--space-3)' }}>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">{loading?'Posting...':'Post Opportunity'}</button>
          <button type="button" onClick={()=>navigate(-1)} className="btn btn-secondary btn-lg">Cancel</button>
        </div>
      </form>
    </div>
  );
}
