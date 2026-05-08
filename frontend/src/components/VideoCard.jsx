import { Link } from 'react-router-dom';
export default function VideoCard({ video }) {
  const { id, title, channelName, thumbnail, publishedAt } = video;
  const d = publishedAt ? Math.floor((Date.now()-new Date(publishedAt))/86400000) : null;
  return (
    <Link to={`/learning/watch/${id}`} style={{ textDecoration:'none', display:'block' }}>
      <div className="card card-interactive" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', background:'var(--bg-elevated)' }}>
          <img src={thumbnail||`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt={title}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform var(--t-slow)' }}
            onMouseEnter={e=>e.target.style.transform='scale(1.05)'}
            onMouseLeave={e=>e.target.style.transform='scale(1)'}
            onError={e=>{e.target.src=`https://img.youtube.com/vi/${id}/hqdefault.jpg`;}}/>
          <div style={{ position:'absolute', bottom:8, right:8 }}>
            <span className="badge badge-red" style={{ background:'rgba(239,68,68,0.9)', color:'#fff', borderColor:'transparent', backdropFilter:'blur(4px)' }}>YT</span>
          </div>
        </div>
        <div style={{ padding:'var(--space-4)' }}>
          <h3 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13.5, color:'var(--text-primary)', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:6 }}>{title}</h3>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)' }}>{channelName}</span>
            {d!==null && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{d===0?'Today':`${d}d`}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
