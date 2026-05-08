import { Link } from 'react-router-dom';
const TYPE_CLASS = { internship:'type-internship', job:'type-job', freelance:'type-freelance', 'part-time':'type-part-time' };
export default function OpportunityCard({ opportunity }) {
  const { _id, title, company, location, type, requiredSkills, stipend, createdAt } = opportunity;
  const d = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  return (
    <Link to={`/opportunities/${_id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div className="card card-interactive" style={{ height:'100%', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', lineHeight:1.3, marginBottom:4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{title}</h3>
            <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)' }}>{company}</p>
          </div>
          <span className={TYPE_CLASS[type]||'type-internship'}>{type}</span>
        </div>
        <div style={{ height:1, background:'var(--border-subtle)' }} />
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:12, color:'var(--text-secondary)', fontFamily:"'Geist'" }}>
          {location && <span>📍 {location}</span>}
          {stipend && <span>💰 {stipend}</span>}
          <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{d===0?'Today':`${d}d ago`}</span>
        </div>
        {requiredSkills?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:'auto' }}>
            {requiredSkills.slice(0,4).map(s => <span key={s} className="tag">{s}</span>)}
            {requiredSkills.length > 4 && <span className="tag">+{requiredSkills.length-4}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
