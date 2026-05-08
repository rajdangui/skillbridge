import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { skillGapAPI, opportunityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';

function ScoreRing({ score }) {
  const size=120, r=(size-14)/2, circ=2*Math.PI*r, offset=circ-(score/100)*circ;
  const color=score>=70?'var(--green)':score>=50?'var(--amber)':score>=30?'var(--red)':'var(--red)';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="10"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transformOrigin:`${size/2}px ${size/2}px`, transform:'rotate(-90deg)', transition:'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }}/>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size*.2} fontFamily="'Geist'" fontWeight="700">{score}%</text>
      </svg>
    </div>
  );
}

export default function SkillGapAnalyzer() {
  const { user } = useAuth();
  const { opportunityId:paramId } = useParams();
  const [searchParams] = useSearchParams();
  const [opps, setOpps] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(paramId||searchParams.get('opportunity')||'');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{ opportunityAPI.getAll({limit:50}).then(r=>setOpps(r.data.opportunities||[])).catch(console.error); },[]);
  useEffect(()=>{ if(paramId&&user?.skills?.length){setSelectedOpp(paramId);analyze(paramId);} },[paramId]);

  const analyze = async(id=selectedOpp)=>{
    if(!id){setError('Please select an opportunity');return;}
    if(!user?.skills?.length){setError('Add skills to your profile first');return;}
    setLoading(true);setError('');setResult(null);
    try{const r=await skillGapAPI.analyze(id);setResult(r.data);}
    catch(err){setError(err.response?.data?.message||'Analysis failed');}finally{setLoading(false);}
  };

  const opp = opps.find(o=>o._id===selectedOpp);
  const verdict = result ? (result.matchScore>=70?{label:'Strong Match',color:'var(--green)',badge:'badge-green'} : result.matchScore>=50?{label:'Moderate Match',color:'var(--amber)',badge:'badge-amber'} : {label:'Needs Work',color:'var(--red)',badge:'badge-red'}) : null;

  return (
    <div className="page page-in">
      <div style={{ marginBottom:'var(--space-8)' }}>
        <p className="label" style={{ marginBottom:8 }}>AI-Powered</p>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4 }}>Skill Gap Analyzer</h1>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>See your match score for any role</p>
      </div>

      {!user?.skills?.length && <div style={{ marginBottom:'var(--space-6)', padding:'10px 14px', background:'var(--amber-muted)', border:'1px solid rgba(251,191,36,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--amber)' }}>⚠️ Add skills to your <Link to="/profile/edit" style={{ color:'var(--amber)', fontWeight:700 }}>profile</Link> first.</div>}

      <div className="bento-grid">
        {/* Left — 4 cols */}
        <div className="col-4" style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
          <div className="card">
            <p className="label" style={{ marginBottom:'var(--space-4)' }}>Select Opportunity</p>
            <SearchableSelect
              options={opps.map(o => ({ value: o._id, label: `${o.title} — ${o.company}` }))}
              value={selectedOpp}
              onChange={(val) => { setSelectedOpp(val); setError(''); setResult(null); }}
              placeholder="Search or select a role..."
              emptyLabel="Choose a role..."
              style={{ marginBottom: 'var(--space-4)' }}
            />
            {user?.skills?.length > 0 && (
              <div>
                <p className="label" style={{ marginBottom:'var(--space-3)' }}>Your Skills ({user.skills.length})</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {user.skills.slice(0,8).map(s=><span key={s} className="tag tag-accent">{s}</span>)}
                  {user.skills.length>8 && <span className="tag">+{user.skills.length-8}</span>}
                </div>
              </div>
            )}
          </div>
          {error && <div style={{ padding:'10px 14px', background:'var(--red-muted)', border:'1px solid rgba(248,113,113,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--red)' }}>{error}</div>}
          <button onClick={()=>analyze()} disabled={loading||!selectedOpp||!user?.skills?.length} className="btn btn-primary btn-lg" style={{ justifyContent:'center' }}>
            {loading?<><span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite', display:'inline-block' }}/>Analyzing...</>:result?'↻ Re-analyze':'🔍 Analyze'}
          </button>
        </div>

        {/* Right — 8 cols */}
        <div className="col-8">
          {!result && !loading && (
            <div className="card" style={{ minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', border:'1px dashed var(--border-default)' }}>
              <div style={{ fontSize:40, marginBottom:'var(--space-4)' }}>📊</div>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-secondary)', marginBottom:8 }}>Ready to analyze</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', maxWidth:280 }}>Select an opportunity and click analyze to see your match score.</p>
            </div>
          )}
          {loading && (
            <div className="card" style={{ minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid var(--accent-muted)', borderTopColor:'var(--accent)', animation:'spin .8s linear infinite', marginBottom:'var(--space-5)' }}/>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-secondary)' }}>Analyzing your skills...</p>
            </div>
          )}
          {result && !loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
              {/* Score card */}
              <div className="card" style={{ display:'flex', alignItems:'center', gap:'var(--space-8)' }}>
                <ScoreRing score={result.matchScore||0}/>
                <div>
                  {verdict && <span className={`badge ${verdict.badge}`} style={{ marginBottom:'var(--space-3)', display:'inline-flex' }}>{verdict.label}</span>}
                  {opp && <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', marginBottom:4 }}>{opp.title}</p>}
                  <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)' }}>
                    You match <span style={{ color:verdict?.color, fontWeight:700 }}>{result.matchScore||0}%</span> of required skills
                  </p>
                  <div style={{ display:'flex', gap:'var(--space-5)', marginTop:'var(--space-4)' }}>
                    {[{c:'var(--green)',v:result.matchedSkills?.length||0,l:'matched'},{c:'var(--amber)',v:result.partialMatches?.length||0,l:'partial'},{c:'var(--red)',v:result.missingSkills?.length||0,l:'missing'}].map((s,i)=>(
                      <div key={i}><span style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:18, color:s.c }}>{s.v}</span><span style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)', marginLeft:4 }}>{s.l}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Skill breakdown */}
              {[{skills:result.matchedSkills,label:'You Have These',color:'var(--green)',bg:'var(--green-muted)',border:'rgba(52,211,153,.2)',showLearn:false},{skills:result.partialMatches,label:'Related Skills',color:'var(--amber)',bg:'var(--amber-muted)',border:'rgba(251,191,36,.2)',showLearn:false},{skills:result.missingSkills,label:'Skills to Learn',color:'var(--red)',bg:'var(--red-muted)',border:'rgba(248,113,113,.2)',showLearn:true}].filter(g=>g.skills?.length>0).map((g,i)=>(
                <div key={i} className="card" style={{ border:`1px solid ${g.border}` }}>
                  <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13, color:g.color, marginBottom:'var(--space-4)' }}>{g.label} ({g.skills.length})</p>
                  {g.showLearn ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                      {g.skills.map(s=>(
                        <div key={s} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px var(--space-3)', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)' }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-secondary)' }}>{s}</span>
                          <Link to={`/learning?q=${encodeURIComponent(s)}`} style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-accent)', textDecoration:'none', fontWeight:500 }}>Learn →</Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {g.skills.map(s=><span key={s} className="tag">{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
              {result.matchScore>=70 && opp && (
                <div className="card" style={{ textAlign:'center', border:'1px solid rgba(52,211,153,.3)', background:'var(--green-muted)' }}>
                  <p style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:16, color:'var(--green)', marginBottom:8 }}>🚀 You're a great fit!</p>
                  <Link to={`/opportunities/${opp._id}`} className="btn btn-primary btn-sm">Apply Now →</Link>
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
