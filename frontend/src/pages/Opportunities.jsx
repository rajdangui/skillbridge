import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { opportunityAPI } from '../services/api';
import OpportunityCard from '../components/OpportunityCard';
import SearchBar from '../components/SearchBar';

const TYPES = [{id:'all',label:'All'},{id:'internship',label:'Internship'},{id:'job',label:'Full-time'},{id:'freelance',label:'Freelance'},{id:'part-time',label:'Part-time'}];

export default function Opportunities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [opps, setOpps] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type:searchParams.get('type')||'all', search:searchParams.get('search')||'', page:1 });

  useEffect(()=>{fetch();},[filters]);
  const fetch = async()=>{
    setLoading(true);
    try{const r=await opportunityAPI.getAll({page:filters.page,limit:12,...(filters.type!=='all'&&{type:filters.type}),...(filters.search&&{search:filters.search})});setOpps(r.data.opportunities||[]);setPagination(r.data.pagination||{});}
    catch(e){console.error(e);}finally{setLoading(false);}
  };

  return (
    <div className="page page-in">
      <div style={{ marginBottom:'var(--space-8)' }}>
        <p className="label" style={{ marginBottom:8 }}>{pagination.total||'—'} opportunities available</p>
        <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.6rem,3vw,2.2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:'var(--space-6)' }}>Find Your Next Role</h1>
        <SearchBar onSearch={q=>{setFilters(p=>({...p,search:q,page:1}));setSearchParams({search:q});}} placeholder="Search roles, companies, skills..." defaultValue={filters.search} style={{ maxWidth:560 }}/>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:'var(--space-2)', marginBottom:'var(--space-6)', overflowX:'auto', paddingBottom:4, borderBottom:'1px solid var(--border-subtle)' }}>
        {TYPES.map(t=>(
          <button key={t.id} onClick={()=>setFilters(p=>({...p,type:t.id,page:1}))}
            style={{ flexShrink:0, padding:'6px 16px', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontWeight:500, fontSize:13, cursor:'pointer', transition:'all var(--t-fast)', border:'1px solid', borderColor:filters.type===t.id?'var(--accent-border)':'transparent', background:filters.type===t.id?'var(--accent-muted)':'transparent', color:filters.type===t.id?'var(--text-accent)':'var(--text-secondary)' }}
            onMouseEnter={e=>{if(filters.type!==t.id)e.currentTarget.style.color='var(--text-primary)';}}
            onMouseLeave={e=>{if(filters.type!==t.id)e.currentTarget.style.color='var(--text-secondary)';}}>
            {t.label}
          </button>
        ))}
        {(filters.search||filters.type!=='all') && (
          <button onClick={()=>setFilters({type:'all',search:'',page:1})} className="btn btn-ghost btn-xs" style={{ marginLeft:'auto' }}>Clear ×</button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--space-4)' }}>
          {[...Array(9)].map((_,i)=><div key={i} className="skeleton" style={{ height:180 }}/>)}
        </div>
      ) : opps.length > 0 ? (
        <>
          <div className="bento-grid stagger">
            {opps.map(o=><div key={o._id} className="col-4"><OpportunityCard opportunity={o}/></div>)}
          </div>
          {pagination.pages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-2)', marginTop:'var(--space-10)' }}>
              <button onClick={()=>setFilters(p=>({...p,page:p.page-1}))} disabled={filters.page<=1} className="btn btn-secondary btn-sm">← Prev</button>
              {[...Array(Math.min(pagination.pages,5))].map((_,i)=>(
                <button key={i+1} onClick={()=>setFilters(p=>({...p,page:i+1}))}
                  className={`btn btn-sm ${filters.page===i+1?'btn-primary':'btn-secondary'}`}>{i+1}</button>
              ))}
              <button onClick={()=>setFilters(p=>({...p,page:p.page+1}))} disabled={filters.page>=pagination.pages} className="btn btn-secondary btn-sm">Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-16)', border:'1px dashed var(--border-default)' }}>
          <p style={{ fontFamily:"'Geist'", fontSize:15, color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>No opportunities found</p>
          <button onClick={()=>setFilters({type:'all',search:'',page:1})} className="btn btn-secondary btn-sm">Clear Filters</button>
        </div>
      )}
    </div>
  );
}
