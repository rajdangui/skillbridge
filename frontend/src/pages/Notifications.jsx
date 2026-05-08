import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';

const TYPE_ICON = {
  application_status:'💼', new_job_match:'🎯', assignment_due:'📝',
  exam_upcoming:'📋', attendance_low:'⚠️', profile_incomplete:'👤',
  application_received:'📨', system:'🔔',
};
const TYPE_COLOR = {
  application_status:'var(--accent)', new_job_match:'var(--green)',
  assignment_due:'var(--amber)', exam_upcoming:'var(--purple)',
  attendance_low:'var(--red)', application_received:'var(--teal)',
  system:'var(--text-secondary)',
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s/60)} min ago`;
  if (s < 86400) return `${Math.floor(s/3600)} hours ago`;
  if (s < 604800)return `${Math.floor(s/86400)} days ago`;
  return new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all | unread

  useEffect(() => { fetchPage(1); }, []);

  const fetchPage = async (pg) => {
    setLoading(true);
    try {
      const r = await notificationAPI.getAll({ page: pg, limit: 20 });
      const items = r.data.notifications || [];
      setNotifications(pg === 1 ? items : prev => [...prev, ...items]);
      setUnread(r.data.unreadCount || 0);
      setHasMore(pg < r.data.pages);
      setPage(pg);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      await notificationAPI.markRead(notif._id);
      setNotifications(prev => prev.map(n => n._id === notif._id ? {...n, read:true} : n));
      setUnread(u => Math.max(0, u-1));
    }
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markRead('all');
    setNotifications(prev => prev.map(n => ({...n, read:true})));
    setUnread(0);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await notificationAPI.delete(id);
    setNotifications(prev => {
      const removed = prev.find(n => n._id === id);
      if (removed && !removed.read) setUnread(u => Math.max(0,u-1));
      return prev.filter(n => n._id !== id);
    });
  };

  const displayed = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div className="page page-in">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'var(--space-8)', paddingBottom:'var(--space-6)', borderBottom:'1px solid var(--border-subtle)', flexWrap:'wrap', gap:'var(--space-4)' }}>
        <div>
          <p className="label" style={{ marginBottom:8 }}>Activity</p>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)' }}>
            Notifications
          </h1>
          {unread > 0 && <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', marginTop:4 }}>{unread} unread</p>}
        </div>
        <div style={{ display:'flex', gap:'var(--space-2)' }}>
          {unread > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'var(--space-6)', borderBottom:'1px solid var(--border-subtle)' }}>
        {[['all','All'], ['unread','Unread']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding:'8px 20px', border:'none', borderBottom:`2px solid ${filter===v?'var(--accent)':'transparent'}`, background:'transparent', fontFamily:"'Geist'", fontWeight:500, fontSize:13.5, color:filter===v?'var(--text-accent)':'var(--text-tertiary)', cursor:'pointer', transition:'all var(--t-fast)', marginBottom:-1 }}>
            {l}{v==='unread'&&unread>0?` (${unread})`:''}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && notifications.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
          {[...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{ height:70, borderRadius:'var(--radius-lg)' }}/>)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'var(--space-16)', border:'1px dashed var(--border-default)' }}>
          <div style={{ fontSize:48, marginBottom:'var(--space-4)' }}>🔔</div>
          <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', marginBottom:8 }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>
            {filter === 'unread' ? "You're all caught up!" : 'Apply to jobs, add skills, and stay active to get notified.'}
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-1)' }}>
          {displayed.map(n => (
            <div key={n._id} onClick={() => handleClick(n)}
              style={{ display:'flex', gap:'var(--space-4)', padding:'14px var(--space-5)', background: n.read ? 'var(--bg-surface)' : 'rgba(61,142,240,0.04)', border:'1px solid', borderColor: n.read ? 'var(--border-subtle)' : 'rgba(61,142,240,0.15)', borderRadius:'var(--radius-lg)', cursor: n.link ? 'pointer' : 'default', transition:'all var(--t-fast)', position:'relative' }}
              onMouseEnter={e => { if(n.link) e.currentTarget.style.borderColor='var(--border-default)'; e.currentTarget.style.background='var(--bg-elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor= n.read ? 'var(--border-subtle)' : 'rgba(61,142,240,0.15)'; e.currentTarget.style.background= n.read ? 'var(--bg-surface)' : 'rgba(61,142,240,0.04)'; }}>

              {/* Unread indicator */}
              {!n.read && (
                <div style={{ position:'absolute', left:6, top:'50%', transform:'translateY(-50%)', width:6, height:6, borderRadius:'50%', background:'var(--accent)' }}/>
              )}

              {/* Icon */}
              <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {TYPE_ICON[n.type] || '🔔'}
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'var(--space-4)', flexWrap:'wrap' }}>
                  <p style={{ fontFamily:"'Geist'", fontWeight: n.read ? 500 : 700, fontSize:14, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', marginBottom:3 }}>{n.title}</p>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)', flexShrink:0 }}>{timeAgo(n.createdAt)}</span>
                </div>
                <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{n.message}</p>
                {n.link && (
                  <p style={{ fontFamily:"'Geist'", fontSize:11, color:TYPE_COLOR[n.type]||'var(--text-accent)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                    View details →
                  </p>
                )}
              </div>

              {/* Delete */}
              <button onClick={(e) => handleDelete(e, n._id)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:18, flexShrink:0, padding:'0 4px', lineHeight:1, opacity:0.5, borderRadius:4, alignSelf:'flex-start', marginTop:2, transition:'all var(--t-fast)' }}
                onMouseEnter={e => { e.target.style.color='var(--red)'; e.target.style.opacity=1; }}
                onMouseLeave={e => { e.target.style.color='var(--text-tertiary)'; e.target.style.opacity=0.5; }}>
                ×
              </button>
            </div>
          ))}

          {/* Load more */}
          {hasMore && filter === 'all' && (
            <button onClick={() => fetchPage(page + 1)} disabled={loading}
              className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center', marginTop:'var(--space-4)' }}>
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
