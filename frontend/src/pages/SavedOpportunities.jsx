import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { savedAPI } from '../services/api';
import SaveButton from '../components/SaveButton';
import SearchBar from '../components/SearchBar';

const TYPE_CLASS = { internship:'type-internship', job:'type-job', freelance:'type-freelance', 'part-time':'type-part-time' };

export default function SavedOpportunities() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(()=>{savedAPI.getSaved().then(r=>setOpps(r.data.opportunities||[])).catch(console.error).finally(()=>setLoading(false));}, []);
  const handleUnsave = id => setOpps(p=>p.filter(o=>o._id!==id));

  const filteredOpps = opps.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.title?.toLowerCase().includes(q) ||
           o.company?.toLowerCase().includes(q) ||
           o.location?.toLowerCase().includes(q) ||
           o.requiredSkills?.some(s => s.toLowerCase().includes(q));
  });

  return (
    <div className="page page-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4 }}>Saved Roles</h1>
          <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>{filteredOpps.length} of {opps.length} bookmarked</p>
        </div>
        <Link to="/opportunities" className="btn btn-secondary btn-sm">Browse More →</Link>
      </div>

      <div style={{ marginBottom:'var(--space-6)', maxWidth:480 }}>
        <SearchBar onSearch={setSearch} placeholder="Search saved roles by title, company, skill..." defaultValue={search} />
      </div>
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{ height:100 }}/>)}</div>
      ) : opps.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-16)', border:'1px dashed var(--border-default)' }}>
          <p style={{ fontFamily:"'Geist'", fontSize:15, color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>No saved opportunities</p>
          <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', marginBottom:'var(--space-6)' }}>Bookmark roles you're interested in to revisit later.</p>
          <Link to="/opportunities" className="btn btn-primary btn-sm">Browse Opportunities</Link>
        </div>
      ) : filteredOpps.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>No bookmarks match your search</p>
          <button onClick={() => setSearch('')} className="btn btn-secondary btn-sm">Clear Search</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
          {filteredOpps.map(o=>{
            const d=Math.floor((Date.now()-new Date(o.createdAt))/86400000);
            return (
              <div key={o._id} className="card card-sm" style={{ display:'flex', alignItems:'center', gap:'var(--space-5)' }}>
                <Link to={`/opportunities/${o._id}`} style={{ flex:1, minWidth:0, textDecoration:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:6 }}>
                    <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.title}</p>
                    <span className={TYPE_CLASS[o.type]||'type-internship'}>{o.type}</span>
                  </div>
                  <div style={{ display:'flex', gap:'var(--space-5)', fontSize:12, color:'var(--text-secondary)', fontFamily:"'Geist'" }}>
                    <span>{o.company}</span>
                    {o.location && <span>📍 {o.location}</span>}
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-tertiary)' }}>{d===0?'Today':`${d}d ago`}</span>
                  </div>
                  {o.requiredSkills?.length > 0 && <div style={{ display:'flex', gap:4, marginTop:8 }}>{o.requiredSkills.slice(0,4).map(s=><span key={s} className="tag">{s}</span>)}</div>}
                </Link>
                <SaveButton opportunityId={o._id} initialSaved={true} onToggle={saved=>{if(!saved)handleUnsave(o._id);}}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
