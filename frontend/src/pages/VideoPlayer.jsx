import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { learningAPI } from '../services/api';
export default function VideoPlayer() {
  const { videoId } = useParams();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const returnQ = searchParams.get('q');
  useEffect(()=>{ learningAPI.getVideoDetails(videoId).then(r=>setVideo(r.data.video)).catch(()=>setVideo({id:videoId})).finally(()=>setLoading(false)); },[videoId]);
  return (
    <div className="page page-in">
      <Link to={returnQ?`/learning?q=${encodeURIComponent(returnQ)}`:'/learning'} style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', textDecoration:'none', marginBottom:'var(--space-6)', transition:'color var(--t-fast)' }}
        onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
        onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>
        ← Back to Learning Hub
      </Link>
      {loading ? <div className="skeleton" style={{ aspectRatio:'16/9', borderRadius:'var(--radius-xl)' }}/> : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'var(--space-6)', alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
            <div style={{ borderRadius:'var(--radius-xl)', overflow:'hidden', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', boxShadow:'var(--shadow-lg)' }}>
              <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`} title={video?.title||'Video'} style={{ width:'100%', aspectRatio:'16/9', display:'block', border:'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
            </div>
            {video && (
              <div className="card">
                <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:18, letterSpacing:'-0.02em', color:'var(--text-primary)', marginBottom:'var(--space-3)' }}>{video.title||'Tutorial Video'}</h1>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-5)', fontSize:13, color:'var(--text-secondary)', fontFamily:"'Geist'", paddingBottom:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)', marginBottom:'var(--space-4)' }}>
                  {video.channelName && <span>📺 {video.channelName}</span>}
                  {video.viewCount && <span>👁 {parseInt(video.viewCount).toLocaleString()} views</span>}
                  {video.publishedAt && <span>📅 {new Date(video.publishedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>}
                </div>
                {video.description && <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', whiteSpace:'pre-wrap' }}>{video.description}</p>}
              </div>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div className="card card-sm">
              <p className="label" style={{ marginBottom:'var(--space-4)' }}>Actions</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ justifyContent:'center' }}>Open in YouTube ↗</a>
                {returnQ && <Link to={`/learning?q=${encodeURIComponent(returnQ)}`} className="btn btn-secondary btn-sm" style={{ justifyContent:'center' }}>More {returnQ} Videos</Link>}
              </div>
            </div>
            <div className="card card-accent card-sm">
              <p className="label" style={{ marginBottom:8, color:'var(--text-accent)' }}>Pro Tip</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>After watching, use the <Link to="/skill-gap" style={{ color:'var(--text-accent)', textDecoration:'none', fontWeight:600 }}>Skill Gap Analyzer</Link> to see how this improves your match score.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
