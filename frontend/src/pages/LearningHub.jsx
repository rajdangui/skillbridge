import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { learningAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import SearchBar from '../components/SearchBar';

const TOPICS = [
  {l:'Python',emoji:'🐍',c:'var(--amber)'},{l:'React',emoji:'⚛️',c:'var(--accent)'},{l:'JavaScript',emoji:'⚡',c:'var(--amber)'},
  {l:'Data Structures',emoji:'🌳',c:'var(--green)'},{l:'Machine Learning',emoji:'🤖',c:'var(--purple)'},{l:'Node.js',emoji:'🟢',c:'var(--green)'},
  {l:'TypeScript',emoji:'💎',c:'var(--accent)'},{l:'Docker',emoji:'🐳',c:'var(--teal)'},{l:'System Design',emoji:'🏗️',c:'var(--amber)'},
  {l:'Git & GitHub',emoji:'🔧',c:'var(--text-secondary)'},{l:'SQL',emoji:'🗃️',c:'var(--purple)'},{l:'GraphQL',emoji:'📊',c:'var(--red)'},
];

export default function LearningHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [topic, setTopic] = useState('');
  const q = searchParams.get('q');

  useEffect(()=>{if(q){setTopic(q);searchVideos(q);}}, [q]);

  const searchVideos = async(t)=>{
    setLoading(true);setError('');setTopic(t);
    try{const r=await learningAPI.searchVideos(t);setVideos(r.data.videos||[]);setIsMock(r.data.mock||false);}
    catch(e){setError(e.response?.data?.message||'Failed to load');setVideos([]);}
    finally{setLoading(false);}
  };

  return (
    <div className="page page-in">
      <div style={{ textAlign:'center', marginBottom:'var(--space-12)' }}>
        <span className="badge badge-blue" style={{ marginBottom:'var(--space-4)', display:'inline-flex' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite', display:'inline-block', marginRight:4 }}/>
          Powered by YouTube
        </span>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(2rem,4vw,3rem)', letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:'var(--space-4)' }}>Learning Hub</h1>
        <p style={{ fontFamily:"'Geist'", fontSize:15, color:'var(--text-secondary)', maxWidth:480, margin:'0 auto var(--space-8)' }}>
          Search any skill and watch the best tutorials — without leaving SkillBridge.
        </p>
        <SearchBar onSearch={q=>setSearchParams({q})} placeholder="Search: React, Python, System Design..." defaultValue={q||''} style={{ maxWidth:560, margin:'0 auto' }}/>
      </div>

      {isMock && (
        <div style={{ marginBottom:'var(--space-6)', padding:'10px var(--space-5)', background:'var(--amber-muted)', border:'1px solid rgba(251,191,36,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--amber)', display:'flex', alignItems:'center', gap:8 }}>
          ⚠️ Demo mode — add <code style={{ fontFamily:'var(--font-mono)', background:'var(--bg-elevated)', padding:'1px 5px', borderRadius:4 }}>YOUTUBE_API_KEY</code> to <code style={{ fontFamily:'var(--font-mono)', background:'var(--bg-elevated)', padding:'1px 5px', borderRadius:4 }}>.env</code> for live results.
        </div>
      )}

      {!q && (
        <div>
          <p className="label" style={{ marginBottom:'var(--space-5)' }}>Popular topics</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-3)' }}>
            {TOPICS.map(t=>(
              <button key={t.l} onClick={()=>setSearchParams({q:t.l})}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:99, fontFamily:"'Geist'", fontWeight:500, fontSize:13, color:'var(--text-secondary)', cursor:'pointer', transition:'all var(--t-fast)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-default)';e.currentTarget.style.color='var(--text-primary)';e.currentTarget.style.background='var(--bg-elevated)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.background='var(--bg-surface)';}}>
                <span style={{ fontSize:15 }}>{t.emoji}</span>{t.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'var(--space-6)' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid var(--accent-border)', borderTopColor:'var(--accent)', animation:'spin .7s linear infinite' }}/>
            <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)' }}>Searching for <span style={{ color:'var(--text-accent)' }}>"{topic}"</span>...</p>
          </div>
          <div className="bento-grid">
            {[...Array(8)].map((_,i)=><div key={i} className="col-3 skeleton" style={{ height:220 }}/>)}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px solid var(--border-default)' }}>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--red)', marginBottom:'var(--space-4)' }}>{error}</p>
          <button onClick={()=>searchVideos(topic)} className="btn btn-secondary btn-sm">Try Again</button>
        </div>
      )}

      {videos.length > 0 && !loading && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)' }}>
            <div>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)' }}>Results for <span style={{ color:'var(--text-accent)' }}>"{topic}"</span></p>
              <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>{videos.length} tutorials found</p>
            </div>
            <button onClick={()=>setSearchParams({})} className="btn btn-ghost btn-sm">← New search</button>
          </div>
          <div className="bento-grid stagger">
            {videos.map(v=><div key={v.id} className="col-3"><VideoCard video={v}/></div>)}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
