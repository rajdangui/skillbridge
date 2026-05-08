import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';

const STATUS_META = {
  applied:    {label:'Applied',    accent:'var(--text-accent)'},
  reviewed:   {label:'Reviewed',   accent:'var(--amber)'},
  shortlisted:{label:'Shortlisted',accent:'var(--purple)'},
  accepted:   {label:'Accepted',   accent:'var(--green)'},
  rejected:   {label:'Rejected',   accent:'var(--red)'},
};

export default function Applications() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const oppId = searchParams.get('opportunity');
  const isCompany = user?.role === 'company';

  useEffect(()=>{
    (async()=>{
      try {
        let r;
        if (oppId && isCompany) {
          r = await applicationAPI.getOpportunityApplications(oppId);
        } else if (isCompany) {
          r = await applicationAPI.getCompanyApplications();
        } else {
          r = await applicationAPI.getMyApplications();
        }
        setApps(r.data.applications||[]);
      } catch(e){console.error(e);}finally{setLoading(false);}
    })();
  },[]);

  const handleStatusUpdate = async(id,status)=>{
    setUpdatingId(id);
    try{await applicationAPI.updateStatus(id,{status});setApps(p=>p.map(a=>a._id===id?{...a,status}:a));}
    catch(e){console.error(e);}finally{setUpdatingId(null);}
  };

  const handleSearch = (q) => {
    setSearch(q);
    if (q) {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), search: q });
    } else {
      const copy = { ...Object.fromEntries(searchParams.entries()) };
      delete copy.search;
      setSearchParams(copy);
    }
  };

  const isCompanyView = isCompany;
  const filtered = apps
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .filter(a => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const oppTitle = a.opportunityId?.title?.toLowerCase() || '';
      const oppCompany = a.opportunityId?.company?.toLowerCase() || '';
      const studName = a.studentId?.name?.toLowerCase() || '';
      const studCollege = a.studentId?.college?.toLowerCase() || '';
      const studBranch = a.studentId?.branch?.toLowerCase() || '';
      const studSkills = a.studentId?.skills?.map(s => s.toLowerCase()).join(' ') || '';
      
      return oppTitle.includes(q) || 
             oppCompany.includes(q) || 
             studName.includes(q) || 
             studCollege.includes(q) || 
             studBranch.includes(q) || 
             studSkills.includes(q);
    });
  const counts = Object.keys(STATUS_META).reduce((a,s)=>({...a,[s]:apps.filter(x=>x.status===s).length}),{});

  return (
    <div className="page page-in">
      <div style={{ marginBottom:'var(--space-8)' }}>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4 }}>
          {isCompanyView?'Applicants':'My Applications'}
        </h1>
        <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>{apps.length} total</p>
      </div>

      {/* Status summary bento */}
      {apps.length > 0 && (
        <div className="bento-grid stagger" style={{ marginBottom:'var(--space-6)' }}>
          {Object.entries(STATUS_META).map(([s,m])=>(
            <div key={s} className="col-2" onClick={()=>setStatusFilter(statusFilter===s?'all':s)}
              style={{ cursor:'pointer' }}>
              <div className={`card card-sm`} style={{ textAlign:'center', borderColor:statusFilter===s?m.accent+'44':'var(--border-subtle)', background:statusFilter===s?m.accent+'11':'var(--bg-surface)' }}>
                <div style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:22, color:m.accent, letterSpacing:'-0.03em' }}>{counts[s]}</div>
                <div style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-secondary)', marginTop:3 }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {apps.length > 0 && (
        <div style={{ marginBottom:'var(--space-6)', maxWidth:480 }}>
          <SearchBar onSearch={handleSearch} placeholder={isCompanyView ? "Search applicants by name, role, college, skill..." : "Search applications by role, company..."} defaultValue={search} />
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
          {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{ height:72 }}/>)}
        </div>
      ) : apps.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-16)', border:'1px dashed var(--border-default)' }}>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>{isCompanyView ? 'No applications received yet' : 'No applications yet'}</p>
          {user?.role==='student' && <Link to="/opportunities" className="btn btn-primary btn-sm">Browse Opportunities</Link>}
          {isCompanyView && <Link to="/opportunities/post" className="btn btn-primary btn-sm">Post a Role</Link>}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
          <p style={{ fontFamily:"'Geist'", fontSize:14, color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>No applications match your search filters</p>
          <button onClick={() => { setStatusFilter('all'); handleSearch(''); }} className="btn btn-secondary btn-sm">Clear Filters</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
          {filtered.map(app=>(
            isCompanyView
              ? <CompanyRow key={app._id} app={app} onUpdate={handleStatusUpdate} updating={updatingId===app._id}/>
              : <StudentRow key={app._id} app={app}/>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRow({ app }) {
  const opp = app.opportunityId;
  return (
    <div className="card card-sm" style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', padding:'14px var(--space-5)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <Link to={`/opportunities/${opp?._id}`} style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:14, color:'var(--text-primary)', textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'color var(--t-fast)' }}
          onMouseEnter={e=>e.target.style.color='var(--text-accent)'}
          onMouseLeave={e=>e.target.style.color='var(--text-primary)'}>{opp?.title||'Opportunity'}</Link>
        <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>{opp?.company} · {new Date(app.createdAt).toLocaleDateString()}</p>
      </div>
      <span className={`status-${app.status}`}>{app.status}</span>
    </div>
  );
}

function CompanyRow({ app, onUpdate, updating }) {
  const s = app.studentId;
  const opp = app.opportunityId;
  return (
    <div className="card card-sm" style={{ display:'flex', alignItems:'flex-start', gap:'var(--space-4)', padding:'var(--space-5)' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'Geist'", fontWeight:700, fontSize:13, color:'var(--text-accent)' }}>{s?.name?.[0]?.toUpperCase()}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:14, color:'var(--text-primary)' }}>{s?.name}</p>
        {opp?.title && <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-accent)', marginBottom:2 }}>Applied for: {opp.title}</p>}
        <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)', marginBottom:6 }}>{s?.college}{s?.branch?` · ${s.branch}`:''}{s?.college || s?.branch ? ' · ' : ''}{new Date(app.createdAt).toLocaleDateString()}</p>
        {s?.skills?.length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{s.skills.slice(0,4).map(sk=><span key={sk} className="tag">{sk}</span>)}</div>}
        {app.coverLetter && <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)', marginTop:8, fontStyle:'italic', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>"{app.coverLetter}"</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexShrink:0 }}>
        {s?.resume && <a href={s.resume} target="_blank" rel="noreferrer" style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-accent)', textDecoration:'none' }}>Resume ↗</a>}
        <select value={app.status} onChange={e=>onUpdate(app._id,e.target.value)} disabled={updating}
          style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-default)', color:'var(--text-primary)', fontFamily:"'Geist'", fontSize:12, padding:'5px 10px', borderRadius:'var(--radius-sm)', outline:'none', cursor:'pointer' }}>
          {Object.entries(STATUS_META).map(([s,m])=><option key={s} value={s}>{m.label}</option>)}
        </select>
      </div>
    </div>
  );
}
