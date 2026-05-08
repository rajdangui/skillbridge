import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { coverLetterAPI, opportunityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';

const TONES = [{id:'professional',label:'Professional',emoji:'👔'},{id:'enthusiastic',label:'Enthusiastic',emoji:'🔥'},{id:'concise',label:'Concise',emoji:'⚡'},{id:'creative',label:'Creative',emoji:'🎨'}];

export default function CoverLetterGenerator() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Profile score gate — require >= 50% to use AI features
  const profileScore = (() => {
    const checks = [
      !!user?.bio && user.bio.length >= 30,
      (user?.skills||[]).length >= 3,
      !!user?.college,
      !!user?.branch,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  })();
  const isLocked = profileScore < 50;

  const [opps, setOpps] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(searchParams.get('opportunity')||'');
  const [tone, setTone] = useState('professional');
  const [extraNotes, setExtraNotes] = useState('');
  const [result, setResult] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef();

  useEffect(()=>{ opportunityAPI.getAll({limit:50}).then(r=>setOpps(r.data.opportunities||[])).catch(console.error); },[]);

  const handleGenerate = async()=>{
    if(!selectedOpp){setError('Please select an opportunity');return;}
    setLoading(true);setError('');setResult('');setEditMode(false);
    try{const r=await coverLetterAPI.generate({opportunityId:selectedOpp,tone,extraNotes});setResult(r.data.coverLetter);setIsDemo(r.data.demo||false);setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),100);}
    catch(err){setError(err.response?.data?.message||'Failed to generate');}finally{setLoading(false);}
  };
  const handleCopy = async()=>{ await navigator.clipboard.writeText(editMode?editText:result); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div className="page page-in">
      <div style={{ marginBottom:'var(--space-8)' }}>
        <p className="label" style={{ marginBottom:8 }}>AI-Powered</p>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4 }}>Cover Letter Generator</h1>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>Tailored to the role, written in seconds</p>
      </div>

      {isLocked && (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px solid var(--amber-muted)', background:'rgba(251,191,36,0.04)', marginBottom:'var(--space-6)' }}>
          <div style={{ fontSize:48, marginBottom:'var(--space-4)' }}>🔒</div>
          <p style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:16, color:'var(--text-primary)', marginBottom:8 }}>Profile too incomplete</p>
          <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', maxWidth:360, margin:'0 auto var(--space-6)', lineHeight:1.6 }}>
            Your profile is <strong style={{color:'var(--amber)'}}>{profileScore}%</strong> complete. Add your bio, skills, college and branch to unlock AI Cover Letters (need 50%).
          </p>
          <a href="/profile/edit" className="btn btn-primary btn-sm" style={{ display:'inline-flex' }}>Complete Profile →</a>
        </div>
      )}
      {!isLocked && !user?.bio && <div style={{ marginBottom:'var(--space-6)', padding:'10px 14px', background:'var(--amber-muted)', border:'1px solid rgba(251,191,36,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--amber)' }}>⚠️ Add your <strong>bio</strong> and <strong>skills</strong> to <Link to="/profile/edit" style={{ color:'var(--amber)', fontWeight:700 }}>your profile</Link> for better results.</div>}

      <div className="bento-grid">
        {/* Config — 4 cols */}
        <div className="col-4" style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
          <div className="card">
            <p className="label" style={{ marginBottom:'var(--space-4)' }}>1 · Select Role</p>
            <SearchableSelect
              options={opps.map(o => ({ value: o._id, label: `${o.title} — ${o.company}` }))}
              value={selectedOpp}
              onChange={(val) => { setSelectedOpp(val); setError(''); }}
              placeholder="Search or select a role..."
              emptyLabel="Choose a role..."
            />
          </div>
          <div className="card">
            <p className="label" style={{ marginBottom:'var(--space-4)' }}>2 · Tone</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-2)' }}>
              {TONES.map(t=>(
                <button key={t.id} onClick={()=>setTone(t.id)}
                  style={{ padding:'10px 12px', borderRadius:'var(--radius-md)', border:`1px solid ${tone===t.id?'var(--accent-border)':'var(--border-default)'}`, background:tone===t.id?'var(--accent-muted)':'var(--bg-elevated)', cursor:'pointer', textAlign:'left', transition:'all var(--t-fast)' }}>
                  <div style={{ fontSize:16, marginBottom:4 }}>{t.emoji}</div>
                  <div style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:12, color:tone===t.id?'var(--text-accent)':'var(--text-secondary)' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <p className="label" style={{ marginBottom:'var(--space-4)' }}>3 · Extra Notes <span style={{ color:'var(--text-tertiary)', textTransform:'none', fontSize:11 }}>(optional)</span></p>
            <textarea value={extraNotes} onChange={e=>setExtraNotes(e.target.value)} className="input" style={{ resize:'none', height:90, fontFamily:"'Geist'" }} placeholder="Specific achievements to mention..."/>
          </div>
          {error && <div style={{ padding:'10px 14px', background:'var(--red-muted)', border:'1px solid rgba(248,113,113,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--red)' }}>{error}</div>}
          <button onClick={handleGenerate} disabled={loading||!selectedOpp||isLocked} className="btn btn-primary btn-lg" style={{ justifyContent:'center' }}>
            {loading ? <><span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite', display:'inline-block' }}/>Generating...</> : result?'↻ Regenerate':'✨ Generate'}
          </button>
        </div>

        {/* Result — 8 cols */}
        <div className="col-8" ref={resultRef}>
          {!result && !loading && (
            <div className="card" style={{ height:'100%', minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', border:'1px dashed var(--border-default)' }}>
              <div style={{ fontSize:40, marginBottom:'var(--space-4)' }}>✍️</div>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-secondary)', marginBottom:8 }}>Your cover letter will appear here</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', maxWidth:300 }}>Select a role and click generate to create a tailored letter.</p>
            </div>
          )}
          {loading && (
            <div className="card" style={{ height:'100%', minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid var(--accent-muted)', borderTopColor:'var(--accent)', animation:'spin .8s linear infinite', marginBottom:'var(--space-5)' }}/>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-secondary)' }}>Crafting your cover letter...</p>
            </div>
          )}
          {result && !loading && (
            <div className="card" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-5)', paddingBottom:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                  <span className="badge badge-blue">{TONES.find(t=>t.id===tone)?.emoji} {TONES.find(t=>t.id===tone)?.label}</span>
                  {isDemo && <span className="badge badge-amber">Demo</span>}
                </div>
                <div style={{ display:'flex', gap:'var(--space-2)' }}>
                  <button onClick={()=>{setEditMode(!editMode);if(!editMode)setEditText(result);}} className={`btn btn-xs ${editMode?'btn-primary':'btn-secondary'}`}>{editMode?'Done':'Edit'}</button>
                  <button onClick={handleCopy} className="btn btn-secondary btn-xs">{copied?'✓ Copied':'Copy'}</button>
                </div>
              </div>
              {editMode
                ? <textarea value={editText} onChange={e=>setEditText(e.target.value)} className="input" style={{ flex:1, resize:'none', minHeight:400, fontFamily:"'Geist'", fontSize:13.5, lineHeight:1.75 }}/>
                : <div style={{ fontFamily:"'Geist'", fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.75, whiteSpace:'pre-wrap', flex:1 }}>{result}</div>
              }
              {isDemo && (
                <div style={{ marginTop:'var(--space-5)', paddingTop:'var(--space-4)', borderTop:'1px solid var(--border-subtle)', fontFamily:"'Geist'", fontSize:12, color:'var(--amber)' }}>
                  ⚠️ Demo mode — Add <code style={{ fontFamily:'var(--font-mono)', background:'var(--bg-elevated)', padding:'1px 5px', borderRadius:4 }}>GEMINI_API_KEY</code> to .env for real AI generation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
