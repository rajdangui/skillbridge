import { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

// ── MARKDOWN RENDERER ─────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code) =>
      `<pre style="background:var(--bg-base);border:1px solid var(--border-subtle);border-radius:6px;padding:10px 12px;overflow-x:auto;margin:6px 0;font-size:11.5px;"><code style="font-family:var(--font-mono);color:var(--text-primary);white-space:pre;">${code.trim()}</code></pre>`)
    .replace(/`([^`\n]+)`/g, '<code style="font-family:var(--font-mono);font-size:12px;background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:4px;padding:1px 5px;color:var(--text-accent);">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:600;">$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<p style="font-weight:600;font-size:13px;color:var(--text-primary);margin:8px 0 3px;">$1</p>')
    .replace(/^## (.+)$/gm,  '<p style="font-weight:700;font-size:14px;color:var(--text-primary);margin:10px 0 4px;">$1</p>')
    .replace(/^[-•] (.+)$/gm, '<li style="margin:1px 0;padding-left:2px;">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, s => `<ul style="padding-left:14px;margin:5px 0;display:flex;flex-direction:column;gap:1px;">${s}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:1px 0;padding-left:2px;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n(?!<)/g, '<br/>');
}

// ── SUGGESTED PROMPTS ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon:'💼', text:'What skills should I learn next?' },
  { icon:'📝', text:'Help me prep for a technical interview' },
  { icon:'🎯', text:'How can I improve my CGPA?' },
  { icon:'🚀', text:'What roles match my current skills?' },
];

// ── TYPING DOTS ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'10px 14px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-tertiary)', animation:`dotPulse 1.4s ${i*0.2}s ease-in-out infinite` }}/>
      ))}
    </div>
  );
}

// ── MESSAGE BUBBLE ─────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom:10, gap:8, alignItems:'flex-end' }}>
      {!isUser && (
        <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color:'#fff' }}>
          ✦
        </div>
      )}
      <div style={{
        maxWidth:'82%',
        padding: isUser ? '9px 13px' : '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--accent)' : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        color: isUser ? '#fff' : 'var(--text-secondary)',
        fontFamily:"'Geist',sans-serif",
        fontSize: 13.5,
        lineHeight: 1.55,
        wordBreak: 'break-word',
        boxShadow: isUser ? '0 2px 8px rgba(61,142,240,0.25)' : '0 1px 3px rgba(0,0,0,0.2)',
      }}>
        {isUser
          ? <span style={{ whiteSpace:'pre-wrap' }}>{msg.content}</span>
          : <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}/>
        }
        {msg.demo && (
          <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border-subtle)', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--amber)', lineHeight:1.4 }}>
            ⚠ Demo mode — add <code style={{ background:'var(--bg-base)', padding:'1px 4px', borderRadius:3 }}>MISTRAL_API_KEY</code> to .env
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN WIDGET ────────────────────────────────────────────────────────────
const HIDE_ON = ['/login','/register','/forgot-password','/reset-password','/verify-email'];

export default function ChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 480);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const textareaRef = useRef(null);

  // Reactive mobile detection
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Only show for logged-in students/admins, hide on auth pages
  if (!user || user.role === 'company') return null;
  if (HIDE_ON.some(p => location.pathname.startsWith(p))) return null;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  // Track unread when closed
  useEffect(() => {
    if (!open && hasGreeted && messages.length > 0 && messages[messages.length-1]?.role === 'assistant') {
      setUnread(u => u + 1);
    }
  }, [messages]);

  const greet = useCallback(() => {
    const h = new Date().getHours();
    const tod = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const first = user?.name?.split(' ')[0] || 'there';
    setMessages([{
      role: 'assistant',
      content: `Good ${tod}, **${first}**! 👋\n\nI'm your SkillBridge AI — here to help with:\n- Career guidance & interview prep\n- Skills to learn, roadmaps, project ideas\n- Academic planning & exam strategy\n- Cover letters, job applications, tips\n\nWhat's on your mind?`,
    }]);
    setHasGreeted(true);
  }, [user]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
    if (!hasGreeted) greet();
  };

  const sendMessage = useCallback(async (overrideText) => {
    const content = (overrideText ?? input).trim();
    if (!content || loading) return;

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setInput('');

    const next = [...messages, { role:'user', content }];
    setMessages(next);
    setLoading(true);

    try {
      const r = await chatAPI.send(next.map(m => ({ role:m.role, content:m.content })));
      setMessages(prev => [...prev, { role:'assistant', content:r.data.reply, demo:r.data.demo }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role:'assistant', content:`⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [messages, input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages([]); setInput(''); setHasGreeted(false);
    setTimeout(() => greet(), 50);
  };

  // Responsive sizing — full width on mobile
  const widgetStyle = isMobile
    ? { left:0, right:0, bottom:0, width:'100%', height:'70vh', borderRadius:'20px 20px 0 0' }
    : { right:24, bottom:24, width:380, height:580, borderRadius:'var(--radius-2xl)' };

  return (
    <>
      <style>{`
        @keyframes dotPulse { 0%,100%{transform:scale(0.6);opacity:.4} 50%{transform:scale(1);opacity:1} }
        @keyframes widgetIn { from{opacity:0;transform:translateY(16px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fabIn    { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes badgePop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes toastSlide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .sb-fab { transition:transform .2s,box-shadow .2s !important; }
        .sb-fab:hover { transform:scale(1.08) !important; box-shadow:0 6px 28px rgba(61,142,240,.55) !important; }
        .sb-fab:active { transform:scale(0.94) !important; }
        .sb-send:hover:not(:disabled) { background:var(--accent-hover) !important; }
        .sb-send:disabled { opacity:.35 !important; cursor:not-allowed !important; }
        .sb-chip:hover { border-color:var(--accent-border) !important; background:var(--accent-muted) !important; color:var(--text-accent) !important; }
        .sb-close:hover { background:var(--bg-overlay) !important; color:var(--text-secondary) !important; }
        .sb-textarea:focus { border-color:var(--accent) !important; box-shadow:0 0 0 3px var(--accent-muted) !important; outline:none !important; }
        .sb-messages { scrollbar-width:thin; scrollbar-color:var(--bg-overlay) transparent; }
        .sb-messages::-webkit-scrollbar { width:3px; }
        .sb-messages::-webkit-scrollbar-thumb { background:var(--bg-overlay); border-radius:99px; }
      `}</style>

      {/* ── FAB ──────────────────────────────────────────── */}
      {!open && (
        <button className="sb-fab" onClick={handleOpen} aria-label="Open AI Chat"
          style={{ position:'fixed', bottom:24, right:24, zIndex:1000, width:54, height:54, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(61,142,240,.4)', color:'#fff', animation:'fabIn .3s cubic-bezier(.34,1.56,.64,1)' }}>
          {/* Chat bubble icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {unread > 0 && (
            <div aria-label={`${unread} unread`} style={{ position:'absolute', top:-4, right:-4, minWidth:20, height:20, borderRadius:'50%', background:'var(--red)', border:'2px solid var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist'", fontSize:10, fontWeight:700, color:'#fff', padding:'0 3px', animation:'badgePop .25s cubic-bezier(.34,1.56,.64,1)' }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </button>
      )}

      {/* ── CHAT WINDOW ──────────────────────────────────── */}
      {open && (
        <div role="dialog" aria-label="SkillBridge AI Chat"
          style={{ position:'fixed', zIndex:1000, background:'var(--bg-surface)', border:'1px solid var(--border-default)', boxShadow:'var(--shadow-lg)', display:'flex', flexDirection:'column', overflow:'hidden', animation:'widgetIn .25s cubic-bezier(.16,1,.3,1)', ...widgetStyle }}>

          {/* Header */}
          <div style={{ padding:'12px 14px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff', flexShrink:0 }}>
              ✦
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:14, color:'var(--text-primary)', lineHeight:1 }}>SkillBridge AI</p>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }}/>
                <span style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)' }}>Online · Personalised to your profile</span>
              </div>
            </div>
            <button className="sb-close" onClick={clearChat} title="New chat"
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'all var(--t-fast)' }}>
              ↺
            </button>
            <button className="sb-close" onClick={() => setOpen(false)} title="Close"
              style={{ width:28, height:28, borderRadius:'var(--radius-sm)', background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, lineHeight:1, transition:'all var(--t-fast)' }}>
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="sb-messages" style={{ flex:1, overflowY:'auto', padding:'14px 12px 8px', display:'flex', flexDirection:'column' }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg}/>)}

            {loading && (
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:8 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent) 0%,#6366f1 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color:'#fff' }}>✦</div>
                <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'4px 16px 16px 16px', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}>
                  <TypingDots/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Suggestion chips — only before first user message */}
          {messages.length <= 1 && !loading && (
            <div style={{ padding:'0 12px 8px', display:'flex', gap:5, flexWrap:'wrap', flexShrink:0 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="sb-chip" onClick={() => sendMessage(s.text)}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:99, fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)', cursor:'pointer', transition:'all var(--t-fast)', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:11 }}>{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{ padding:'8px 10px', background:'var(--bg-elevated)', borderTop:'1px solid var(--border-subtle)', display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
            <textarea
              ref={textareaRef}
              className="sb-textarea"
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about career, studies, skills…"
              rows={1}
              style={{ flex:1, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-lg)', padding:'8px 12px', fontFamily:"'Geist'", fontSize:13.5, color:'var(--text-primary)', resize:'none', minHeight:38, maxHeight:120, overflowY:'auto', lineHeight:1.5, transition:'border-color var(--t-fast),box-shadow var(--t-fast)' }}
            />
            <button className="sb-send" onClick={() => sendMessage()} disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{ width:36, height:36, borderRadius:'50%', background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-overlay)', border:'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all var(--t-fast)', color: input.trim() && !loading ? '#fff' : 'var(--text-tertiary)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
              </svg>
            </button>
          </div>

          {/* Footer branding */}
          <div style={{ padding:'5px 12px 8px', textAlign:'center', flexShrink:0 }}>
            <span style={{ fontFamily:"'Geist'", fontSize:10, color:'var(--text-tertiary)' }}>Powered by Mistral · Enter to send · Shift+Enter for new line</span>
          </div>
        </div>
      )}
    </>
  );
}
