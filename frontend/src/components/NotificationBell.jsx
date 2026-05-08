import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const TYPE_ICON = {
  application_status:   '💼',
  new_job_match:        '🎯',
  assignment_due:       '📝',
  exam_upcoming:        '📋',
  attendance_low:       '⚠️',
  profile_incomplete:   '👤',
  application_received: '📨',
  system:               '🔔',
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const dropRef = useRef(null);
  const socketRef = useRef(null);
  const pollRef = useRef(null);

  if (!user) return null;

  // ── Socket.io connection ──────────────────────────────────────────────
  useEffect(() => {
    const BACKEND = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
    try {
      socketRef.current = io(BACKEND, { withCredentials: true, reconnectionDelay: 2000, transports: ['websocket','polling'] });
      socketRef.current.on('connect', () => {
        socketRef.current.emit('join', user._id);
      });
      socketRef.current.on('notification', () => {
        // Just increment badge — fetch full list when dropdown opens
        setUnread(u => u + 1);
      });
    } catch (_) {}

    return () => { socketRef.current?.disconnect(); };
  }, [user._id]);

  // ── Polling fallback (every 60s) ──────────────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const r = await notificationAPI.getUnreadCount();
        setUnread(r.data.count);
      } catch (_) {}
    };
    fetchCount();
    pollRef.current = setInterval(fetchCount, 60000);
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Load notifications when dropdown opens ────────────────────────────
  const fetchNotifications = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const r = await notificationAPI.getAll({ page: pg, limit: 15 });
      const items = r.data.notifications || [];
      setNotifications(pg === 1 ? items : prev => [...prev, ...items]);
      setUnread(r.data.unreadCount || 0);
      setHasMore(pg < r.data.pages);
      setPage(pg);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) fetchNotifications(1);
  };

  // ── Click outside to close ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClickItem = async (notif) => {
    if (!notif.read) {
      await notificationAPI.markRead(notif._id);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnread(u => Math.max(0, u - 1));
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await notificationAPI.delete(id);
    setNotifications(prev => {
      const removed = prev.find(n => n._id === id);
      if (removed && !removed.read) setUnread(u => Math.max(0, u - 1));
      return prev.filter(n => n._id !== id);
    });
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={`${unread} unread notifications`}
        style={{ position:'relative', width:34, height:34, borderRadius:'var(--radius-md)', background: open ? 'var(--bg-overlay)' : 'transparent', border:'1px solid', borderColor: open ? 'var(--border-default)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all var(--t-fast)', color:'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--bg-overlay)'; e.currentTarget.style.borderColor='var(--border-default)'; }}
        onMouseLeave={e => { if(!open){e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent';} }}>
        {/* Bell SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{ position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:99, background:'var(--red)', border:'2px solid var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist'", fontSize:9, fontWeight:700, color:'#fff', padding:'0 2px' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:360, maxHeight:480, display:'flex', flexDirection:'column', background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-lg)', zIndex:200, overflow:'hidden', animation:'page-in .2s cubic-bezier(.16,1,.3,1)' }}>

          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Notifications</span>
              {unread > 0 && (
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, background:'var(--accent-muted)', color:'var(--text-accent)', border:'1px solid var(--accent-border)', borderRadius:99, padding:'1px 7px' }}>{unread} new</span>
              )}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {unread > 0 && (
                <button onClick={handleMarkAllRead}
                  style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-accent)', background:'none', border:'none', cursor:'pointer', padding:'3px 6px', borderRadius:'var(--radius-sm)' }}
                  onMouseEnter={e=>e.target.style.background='var(--accent-muted)'}
                  onMouseLeave={e=>e.target.style.background='none'}>
                  Mark all read
                </button>
              )}
              <Link to="/notifications" onClick={()=>setOpen(false)}
                style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-secondary)', textDecoration:'none', padding:'3px 6px', borderRadius:'var(--radius-sm)' }}
                onMouseEnter={e=>e.target.style.background='var(--bg-overlay)'}
                onMouseLeave={e=>e.target.style.background='none'}>
                See all →
              </Link>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY:'auto', flex:1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8, padding:12 }}>
                {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:56, borderRadius:'var(--radius-md)' }}/>)}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔔</div>
                <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', fontWeight:600, marginBottom:4 }}>You're all caught up!</p>
                <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>Notifications will appear here</p>
              </div>
            ) : (
              <>
                {notifications.map(n => (
                  <div key={n._id}
                    onClick={() => handleClickItem(n)}
                    style={{ display:'flex', gap:10, padding:'11px 14px', cursor:'pointer', background: n.read ? 'transparent' : 'rgba(61,142,240,0.04)', borderBottom:'1px solid var(--border-subtle)', transition:'background var(--t-fast)', position:'relative' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background= n.read ? 'transparent' : 'rgba(61,142,240,0.04)'}>
                    {/* Unread dot */}
                    {!n.read && (
                      <div style={{ position:'absolute', top:14, left:5, width:5, height:5, borderRadius:'50%', background:'var(--accent)' }}/>
                    )}
                    <div style={{ width:34, height:34, borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                      {TYPE_ICON[n.type] || '🔔'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"'Geist'", fontWeight: n.read ? 500 : 600, fontSize:13, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</p>
                      <p style={{ fontFamily:"'Geist'", fontSize:11.5, color:'var(--text-tertiary)', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{n.message}</p>
                      <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-tertiary)', marginTop:3 }}>{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n._id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:14, padding:'2px 4px', flexShrink:0, opacity:0.6, borderRadius:4 }}
                      onMouseEnter={e => { e.target.style.color='var(--red)'; e.target.style.opacity=1; }}
                      onMouseLeave={e => { e.target.style.color='var(--text-tertiary)'; e.target.style.opacity=0.6; }}>
                      ×
                    </button>
                  </div>
                ))}
                {hasMore && (
                  <button onClick={() => fetchNotifications(page + 1)} disabled={loading}
                    style={{ width:'100%', padding:'10px', fontFamily:"'Geist'", fontSize:12, color:'var(--text-accent)', background:'none', border:'none', borderTop:'1px solid var(--border-subtle)', cursor:'pointer' }}
                    onMouseEnter={e=>e.target.style.background='var(--bg-overlay)'}
                    onMouseLeave={e=>e.target.style.background='none'}>
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
