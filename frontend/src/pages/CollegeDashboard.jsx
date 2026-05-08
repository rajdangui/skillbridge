import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicAPI } from '../services/api';

// ── UTILITIES ────────────────────────────────────────────────────────────────
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' };
const PRIORITY_COLOR = { high:'var(--red)', medium:'var(--amber)', low:'var(--green)' };
const STATUS_STYLE = {
  pending:   { bg:'var(--accent-muted)',  color:'var(--text-accent)',  border:'var(--accent-border)' },
  submitted: { bg:'var(--green-muted)',   color:'var(--green)',        border:'rgba(52,211,153,.25)' },
  overdue:   { bg:'var(--red-muted)',     color:'var(--red)',          border:'rgba(248,113,113,.25)' },
  graded:    { bg:'var(--purple-muted)',  color:'var(--purple)',       border:'rgba(167,139,250,.25)' },
  upcoming:  { bg:'var(--accent-muted)',  color:'var(--text-accent)',  border:'var(--accent-border)' },
  completed: { bg:'var(--green-muted)',   color:'var(--green)',        border:'rgba(52,211,153,.25)' },
  cancelled: { bg:'var(--bg-elevated)',   color:'var(--text-tertiary)',border:'var(--border-subtle)' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', padding:'2px 8px', borderRadius:99, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      {status}
    </span>
  );
}

function daysUntil(date) {
  const diff = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (diff < 0) return { label:`${Math.abs(diff)}d ago`, color:'var(--text-tertiary)' };
  if (diff === 0) return { label:'Today', color:'var(--red)' };
  if (diff === 1) return { label:'Tomorrow', color:'var(--amber)' };
  if (diff <= 3) return { label:`${diff}d`, color:'var(--amber)' };
  return { label:`${diff}d`, color:'var(--text-secondary)' };
}

// ── MINI MODAL ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-4)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', border:'1px solid var(--border-default)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-5)', paddingBottom:'var(--space-4)', borderBottom:'1px solid var(--border-subtle)' }}>
          <h3 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-tertiary)', cursor:'pointer', fontSize:20, lineHeight:1, padding:4 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── DAILY VIBE WIDGET ─────────────────────────────────────────────────────────
const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
];

function DailyVibe() {
  const [now, setNow] = useState(new Date());
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    const rotate = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIdx(prev => (prev + 1) % QUOTES.length);
        setFade(true);
      }, 400);
    }, 8000);
    return () => { clearInterval(tick); clearInterval(rotate); };
  }, []);

  const h = now.getHours();
  const greeting = h < 5 ? 'Night Owl Mode 🦉' : h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤️' : h < 21 ? 'Good Evening 🌅' : 'Night Owl Mode 🦉';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const q = QUOTES[quoteIdx];

  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Subtle accent glow */}
      <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'50%', background:'var(--accent-muted)', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-30, left:-30, width:80, height:80, borderRadius:'50%', background:'var(--purple-muted)', filter:'blur(30px)', pointerEvents:'none' }} />
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:1 }}>
        <div>
          <p style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:16, color:'var(--text-primary)', marginBottom:3, letterSpacing:'-0.02em' }}>{greeting}</p>
          <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>{dateStr}</p>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:700, color:'var(--accent)', letterSpacing:'-0.02em' }}>
          {timeStr}
        </div>
      </div>
      
      <div style={{ height:1, background:'var(--border-subtle)' }} />

      <div style={{
        position:'relative', zIndex:1,
        opacity: fade ? 1 : 0, transition: 'opacity 0.4s ease',
        minHeight: 36,
      }}>
        <p style={{ fontFamily:"'Geist'", fontSize:13, fontWeight:400, fontStyle:'italic', lineHeight:1.6, color:'var(--text-secondary)' }}>
          "{q.text}"
        </p>
        <p style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)', marginTop:4 }}>— {q.author}</p>
      </div>
    </div>
  );
}

// ── ATTENDANCE BAR ────────────────────────────────────────────────────────────
function AttBar({ subject, present, total, minRequired=75 }) {
  const pct = total > 0 ? Math.round((present/total)*100) : 0;
  const needed = total > 0 ? Math.max(0, Math.ceil((minRequired/100*total - present) / (1 - minRequired/100))) : 0;
  const color = pct >= minRequired ? 'var(--green)' : pct >= minRequired-10 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Geist'", fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{subject}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color, fontWeight:600 }}>{pct}%</span>
      </div>
      <div style={{ height:4, background:'var(--bg-base)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width .8s cubic-bezier(.16,1,.3,1)' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-tertiary)' }}>{present}/{total} classes</span>
        {pct < minRequired && needed > 0 && (
          <span style={{ fontFamily:"'Geist'", fontSize:10, color:'var(--amber)' }}>Need {needed} more to reach {minRequired}%</span>
        )}
      </div>
    </div>
  );
}

// ── MARKSHEET UPLOAD PANEL ────────────────────────────────────────────────────
function MarksheetUploader({ onParsed, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [semLabel, setSemLabel] = useState('');
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { setError('Please select a PDF marksheet'); return; }
    if (!semLabel.trim()) { setError('Please enter a semester name/number'); return; }
    
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('marksheet', file);
      const uploadRes = await academicAPI.parseMarksheet(fd);
      
      const applyRes = await academicAPI.applyParsedData({
        semesterLabel: semLabel.trim(),
        marksheetUrl: uploadRes.data.marksheetUrl
      });
      
      onParsed(applyRes.data.profile);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div
        onClick={() => fileRef.current?.click()}
        style={{ border:`2px dashed ${file ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius:'var(--radius-lg)', padding:'var(--space-8)', textAlign:'center', cursor:'pointer', background: file ? 'var(--accent-muted)' : 'var(--bg-elevated)', transition:'all var(--t-base)' }}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--accent)'; }}
        onDragLeave={e => { e.currentTarget.style.borderColor='var(--border-default)'; }}
        onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f?.type==='application/pdf'){setFile(f);setError('');} else setError('PDF files only'); e.currentTarget.style.borderColor='var(--border-default)'; }}>
        <input ref={fileRef} type="file" accept=".pdf" onChange={e => { setFile(e.target.files[0]); setError(''); }} style={{ display:'none' }}/>
        <div style={{ fontSize:32, marginBottom:'var(--space-3)' }}>{file ? '📄' : '☁️'}</div>
        <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color: file ? 'var(--text-accent)' : 'var(--text-primary)', marginBottom:4 }}>
          {file ? file.name : 'Drop your marksheet PDF here'}
        </p>
        <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>
          {file ? `${(file.size/1024).toFixed(0)} KB — click to change` : 'or click to browse · PDF only · max 10MB'}
        </p>
      </div>
      
      <div>
        <label style={{ display:'block', fontFamily:"'Geist'", fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:6 }}>Semester Name / Number</label>
        <input type="text" className="input" placeholder="e.g. Semester 3 or Fall 2023" value={semLabel} onChange={e=>setSemLabel(e.target.value)} style={{ width:'100%' }} />
      </div>

      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:'10px 14px', fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
        💡 Your PDF will be securely stored and displayed directly in your dashboard.
      </div>
      
      {error && <div style={{ padding:'10px 14px', background:'var(--red-muted)', border:'1px solid rgba(248,113,113,.2)', borderRadius:'var(--radius-md)', fontFamily:"'Geist'", fontSize:13, color:'var(--red)' }}>{error}</div>}
      
      <button onClick={handleUpload} disabled={!file || !semLabel.trim() || loading} className="btn btn-primary" style={{ justifyContent:'center', padding:11 }}>
        {loading ? <><span style={{ width:15, height:15, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite', display:'inline-block' }}/> Uploading...</> : '📄 Upload Marksheet'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const TABS = [
  { id:'overview',    label:'Overview',    icon:'◎' },
  { id:'marks',       label:'Marks',       icon:'📊' },
  { id:'assignments', label:'Assignments', icon:'📝' },
  { id:'exams',       label:'Exams',       icon:'📋' },
  { id:'timetable',   label:'Timetable',   icon:'🕐' },
  { id:'attendance',  label:'Attendance',  icon:'✓' },
];

export default function CollegeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null); // 'marksheet' | 'addAssignment' | 'addExam' | 'addTimetableSlot' | 'editMeta'
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Forms
  const [assignForm, setAssignForm] = useState({ title:'', subject:'', dueDate:'', priority:'medium', maxMarks:100, notes:'' });
  const [examForm,   setExamForm]   = useState({ title:'', subject:'', date:'', time:'', venue:'', type:'other', maxMarks:100, syllabus:'' });
  const [slotForm,   setSlotForm]   = useState({ day:'monday', startTime:'09:00', endTime:'10:00', subject:'', teacher:'', room:'', type:'lecture' });
  const [metaForm,   setMetaForm]   = useState({});

  useEffect(() => {
    academicAPI.getProfile()
      .then(r => { setProfile(r.data.profile); setMetaForm({ institution: r.data.profile.institution||'', degree: r.data.profile.degree||'', branch: r.data.profile.branch||'', enrollmentNo: r.data.profile.enrollmentNo||'', currentSem: r.data.profile.currentSem||1, totalSems: r.data.profile.totalSems||8 }); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };
  const refresh = (p) => { setProfile(p); showToast('Saved!'); setModal(null); };

  const handleAddAssignment = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await academicAPI.addAssignment(assignForm); refresh(r.data.profile); setAssignForm({ title:'', subject:'', dueDate:'', priority:'medium', maxMarks:100, notes:'' }); }
    catch (err) { showToast(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleToggleAssignment = async (id, currentStatus) => {
    const next = currentStatus === 'pending' ? 'submitted' : currentStatus === 'submitted' ? 'graded' : 'pending';
    try { const r = await academicAPI.updateAssignment(id, { status: next }); setProfile(r.data.profile); }
    catch (e) { console.error(e); }
  };

  const handleDeleteAssignment = async (id) => {
    try { const r = await academicAPI.deleteAssignment(id); setProfile(r.data.profile); showToast('Deleted'); }
    catch (e) { console.error(e); }
  };

  const handleAddExam = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await academicAPI.addExam(examForm); refresh(r.data.profile); setExamForm({ title:'', subject:'', date:'', time:'', venue:'', type:'other', maxMarks:100, syllabus:'' }); }
    catch (err) { showToast(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteExam = async (id) => {
    try { const r = await academicAPI.deleteExam(id); setProfile(r.data.profile); showToast('Deleted'); }
    catch (e) { console.error(e); }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const current = profile?.timetable || [];
      const r = await academicAPI.saveTimetable([...current, slotForm]);
      refresh(r.data.profile);
      setSlotForm({ day:'monday', startTime:'09:00', endTime:'10:00', subject:'', teacher:'', room:'', type:'lecture' });
    } catch (err) { showToast('Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteSlot = async (idx) => {
    try {
      const updated = (profile?.timetable || []).filter((_, i) => i !== idx);
      const r = await academicAPI.saveTimetable(updated);
      setProfile(r.data.profile); showToast('Removed');
    } catch (e) { console.error(e); }
  };

  const handleSaveMeta = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await academicAPI.updateProfile(metaForm); refresh(r.data.profile); }
    catch (err) { showToast('Failed'); }
    finally { setSaving(false); }
  };

  const handleAttendanceChange = async (subject, field, val) => {
    const updated = (profile?.attendance || []).map(a =>
      a.subject === subject ? { ...a, [field]: parseInt(val)||0 } : a
    );
    try { const r = await academicAPI.updateAttendance(updated); setProfile(r.data.profile); }
    catch (e) { console.error(e); }
  };

  const handleAddAttendanceSubject = async (subject) => {
    if (!subject.trim()) return;
    const current = profile?.attendance || [];
    if (current.find(a => a.subject === subject)) return;
    const updated = [...current, { subject, present:0, total:0, minRequired:75 }];
    try { const r = await academicAPI.updateAttendance(updated); setProfile(r.data.profile); }
    catch (e) { console.error(e); }
  };

  // ── Derived stats
  const upcoming = [...(profile?.assignments||[]).filter(a => a.status==='pending'), ...(profile?.exams||[]).filter(e => e.status==='upcoming')]
    .sort((a,b) => new Date(a.dueDate||a.date) - new Date(b.dueDate||b.date))
    .slice(0, 5);

  const activeSem = profile?.semesters?.find(s => s.number === profile.currentSem) || profile?.semesters?.[profile?.semesters?.length-1];
  const pendingCount = (profile?.assignments||[]).filter(a=>a.status==='pending').length;
  const overdueCount = (profile?.assignments||[]).filter(a=>a.status==='overdue').length;
  const upcomingExams = (profile?.exams||[]).filter(e=>e.status==='upcoming').length;

  const todayDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  const todaySlots = (profile?.timetable||[]).filter(s=>s.day===todayDay).sort((a,b)=>a.startTime.localeCompare(b.startTime));

  const fieldStyle = {
    label: { fontFamily:"'Geist'", fontSize:12.5, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 },
    row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' },
  };

  if (loading) return (
    <div className="page" style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height: i===0 ? 60 : 200 }}/>)}
    </div>
  );

  return (
    <div className="page page-in">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'var(--space-6)', right:'var(--space-6)', background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-md)', padding:'10px 18px', fontFamily:"'Geist'", fontSize:13, color:'var(--green)', zIndex:100, boxShadow:'var(--shadow-md)', animation:'toastIn .25s cubic-bezier(.16,1,.3,1)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'var(--space-8)', paddingBottom:'var(--space-6)', borderBottom:'1px solid var(--border-subtle)', flexWrap:'wrap', gap:'var(--space-4)' }}>
        <div>
          <p className="label" style={{ marginBottom:8 }}>Academic Tracker</p>
          <h1 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:'clamp(1.4rem,3vw,2rem)', letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4 }}>
            {profile?.institution || user?.college || 'My College Dashboard'}
          </h1>
          <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)' }}>
            {profile?.degree || ''}{profile?.degree && profile?.branch ? ' · ' : ''}{profile?.branch || user?.branch || ''}
            {profile?.enrollmentNo ? ` · ${profile.enrollmentNo}` : ''}
          </p>
        </div>
        <div style={{ display:'flex', gap:'var(--space-2)', flexWrap:'wrap' }}>
          <button onClick={() => setModal('marksheet')} className="btn btn-primary btn-sm">
            📄 Upload Marksheet
          </button>
          <button onClick={() => setModal('editMeta')} className="btn btn-secondary btn-sm">
            ✏️ Edit Info
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'var(--space-6)', borderBottom:'1px solid var(--border-subtle)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'9px 18px', border:'none', borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`, background:'transparent', fontFamily:"'Geist'", fontWeight:500, fontSize:13.5, color:tab===t.id?'var(--text-accent)':'var(--text-tertiary)', cursor:'pointer', transition:'all var(--t-fast)', marginBottom:-1, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:12 }}>{t.icon}</span>{t.label}
            {t.id==='assignments' && pendingCount > 0 && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, background:'var(--amber-muted)', color:'var(--amber)', border:'1px solid rgba(251,191,36,.25)', borderRadius:99, padding:'1px 6px' }}>{pendingCount}</span>}
            {t.id==='exams' && upcomingExams > 0 && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, background:'var(--accent-muted)', color:'var(--text-accent)', border:'1px solid var(--accent-border)', borderRadius:99, padding:'1px 6px' }}>{upcomingExams}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────── */}
      {tab === 'overview' && (
        <div>
          {/* Daily Vibe */}
          <div style={{ marginBottom:'var(--space-6)' }}>
            <DailyVibe />
          </div>

          {/* Stats row */}
          <div className="bento-grid stagger" style={{ marginBottom:'var(--space-6)' }}>
            {[
              { val: pendingCount,  label:'Pending Assignments', sub: overdueCount > 0 ? `${overdueCount} overdue` : 'on track',   accent: overdueCount>0?'var(--red)':'var(--amber)' },
              { val: upcomingExams, label:'Upcoming Exams',      sub: 'this semester',     accent:'var(--accent)' },
              { val: profile?.semesters?.length||0, label:'Marksheets Uploaded', sub:'semester records', accent:'var(--purple)' },
              { val: todaySlots.length, label:"Today's Classes", sub: todaySlots.length > 0 ? `next: ${todaySlots[0]?.subject}` : 'free day!', accent:'var(--green)' },
            ].map((s,i) => (
              <div key={i} className="col-3 card">
                <div style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:28, letterSpacing:'-0.04em', color:s.accent, lineHeight:1, marginBottom:6 }}>{s.val}</div>
                <div style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:2 }}>{s.label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="bento-grid">
            {/* Today's classes */}
            <div className="col-4">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-4)' }}>
                <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Today's Classes</h2>
                <span style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)', textTransform:'capitalize' }}>{todayDay}</span>
              </div>
              {todaySlots.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                  {todaySlots.map((slot, i) => (
                    <div key={i} style={{ display:'flex', gap:12, padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)', borderLeft:`3px solid var(--accent)` }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)', flexShrink:0, paddingTop:1 }}>{slot.startTime}</div>
                      <div>
                        <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{slot.subject}</p>
                        <p style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)' }}>
                          {slot.room && `${slot.room}`}{slot.teacher && ` · ${slot.teacher}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'var(--space-6)', color:'var(--text-tertiary)' }}>
                  <p style={{ fontSize:24, marginBottom:8 }}>🎉</p>
                  <p style={{ fontFamily:"'Geist'", fontSize:13 }}>No classes today!</p>
                </div>
              )}
            </div>

            {/* Upcoming deadlines */}
            <div className="col-8">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-4)' }}>
                <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Upcoming Deadlines</h2>
                <button onClick={() => setTab('assignments')} style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-accent)', background:'none', border:'none', cursor:'pointer' }}>View all →</button>
              </div>
              {upcoming.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
                  {upcoming.map((item, i) => {
                    const d = daysUntil(item.dueDate || item.date);
                    const isExam = !!item.type && ['midterm','endterm','unit-test','practical','viva','other'].includes(item.type);
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'var(--space-4)', padding:'11px var(--space-5)', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize:16, flexShrink:0 }}>{isExam ? '📋' : '📝'}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:13.5, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</p>
                          <p style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)' }}>{item.subject}</p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexShrink:0 }}>
                          <StatusPill status={item.status}/>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:d.color, fontWeight:600 }}>{d.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'var(--space-8)', border:'1px dashed var(--border-default)', borderRadius:'var(--radius-lg)', color:'var(--text-tertiary)' }}>
                  <p style={{ fontSize:28, marginBottom:8 }}>📅</p>
                  <p style={{ fontFamily:"'Geist'", fontSize:13 }}>No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MARKS ────────────────────────────────────────── */}
      {tab === 'marks' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)' }}>
            <div>
              <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em', marginBottom:2 }}>Semester Results</h2>
              <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>Upload marksheet PDFs to view your results</p>
            </div>
            <button onClick={() => setModal('marksheet')} className="btn btn-primary btn-sm">📄 Upload Marksheet</button>
          </div>

          {profile?.semesters?.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
              {[...profile.semesters].sort((a,b) => b.number - a.number).map(sem => (
                <div key={sem._id || sem.number} className="card" style={{ overflow:'hidden' }}>
                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-4)', paddingBottom:'var(--space-3)', borderBottom:'1px solid var(--border-subtle)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
                      <span style={{ fontSize:20 }}>📄</span>
                      <h3 style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{sem.label || `Semester ${sem.number}`}</h3>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
                      {sem.marksheetUrl && (
                        <a href={sem.marksheetUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-accent)', textDecoration:'none', padding:'4px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--accent-border)', background:'var(--accent-muted)', transition:'all var(--t-fast)' }}
                          onMouseEnter={e => e.currentTarget.style.background='var(--accent)'}
                          onMouseLeave={e => { e.currentTarget.style.background='var(--accent-muted)'; e.currentTarget.style.color='var(--text-accent)'; }}>
                          ↗ Open PDF
                        </a>
                      )}
                      <button onClick={async () => {
                        if (!confirm(`Delete "${sem.label || 'Semester ' + sem.number}" marksheet?`)) return;
                        try {
                          await academicAPI.deleteSemester(sem.number);
                          setProfile(prev => ({ ...prev, semesters: prev.semesters.filter(s => s.number !== sem.number) }));
                        } catch (err) { console.error('Delete failed:', err); }
                      }}
                        style={{ background:'none', border:'1px solid rgba(248,113,113,.2)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'var(--red)', fontSize:12, padding:'4px 10px', fontFamily:"'Geist'", transition:'all var(--t-fast)' }}
                        onMouseEnter={e => { e.currentTarget.style.background='var(--red-muted)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='none'; }}>
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                  {/* PDF Viewer */}
                  {sem.marksheetUrl ? (
                    <div style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--border-strong)', background:'var(--bg-surface)', boxShadow:'var(--shadow-sm)', marginTop:'var(--space-2)' }}>
                      {/* Fake window header */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-subtle)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ display:'flex', gap:'6px' }}>
                            <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#FF5F56' }}/>
                            <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#FFBD2E' }}/>
                            <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#27C93F' }}/>
                          </div>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--text-secondary)' }}>
                            {sem.label ? `${sem.label.replace(/\s+/g, '_').toLowerCase()}_marksheet.pdf` : `sem_${sem.number}_marksheet.pdf`}
                          </span>
                        </div>
                        <a href={sem.marksheetUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"'Geist'", fontSize:'12px', color:'var(--text-accent)', textDecoration:'none', fontWeight:500 }}>
                          Open Original ↗
                        </a>
                      </div>
                      {/* Document container */}
                      <div style={{ padding:'var(--space-6)', background:'var(--bg-base)', display:'flex', justifyContent:'center', overflowX:'auto' }}>
                        <div style={{ width:'100%', maxWidth:'800px', background:'#fff', borderRadius:'8px', boxShadow:'0 10px 30px rgba(0,0,0,0.1)', overflow:'hidden', border:'1px solid rgba(0,0,0,0.1)' }}>
                          <iframe
                            src={`${sem.marksheetUrl}#view=FitH&toolbar=0&navpanes=0`}
                            title={sem.label || `Semester ${sem.number} Marksheet`}
                            style={{ width:'100%', height:'700px', border:'none', display:'block', background:'#fff' }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'var(--space-8)', color:'var(--text-tertiary)', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px dashed var(--border-subtle)' }}>
                      <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                      <p style={{ fontFamily:"'Geist'", fontSize:13 }}>No PDF attached to this semester</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
              <p style={{ fontSize:40, marginBottom:'var(--space-4)' }}>📊</p>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:15, color:'var(--text-primary)', marginBottom:8 }}>No marksheets uploaded yet</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', marginBottom:'var(--space-6)' }}>Upload your marksheet PDFs to view them here, organised by semester</p>
              <button onClick={() => setModal('marksheet')} className="btn btn-primary btn-sm">📄 Upload Marksheet</button>
            </div>
          )}
        </div>
      )}

      {/* ── ASSIGNMENTS ──────────────────────────────────── */}
      {tab === 'assignments' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)' }}>
            <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Assignments</h2>
            <button onClick={() => setModal('addAssignment')} className="btn btn-primary btn-sm">+ Add Assignment</button>
          </div>

          {(profile?.assignments?.length||0) === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
              <p style={{ fontSize:36, marginBottom:'var(--space-4)' }}>📝</p>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', marginBottom:8 }}>No assignments yet</p>
              <button onClick={() => setModal('addAssignment')} className="btn btn-secondary btn-sm">Add your first assignment</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)' }}>
              {['overdue','pending','submitted','graded'].map(status => {
                const group = (profile?.assignments||[]).filter(a => a.status===status);
                if (!group.length) return null;
                return (
                  <div key={status}>
                    <p style={{ fontFamily:"'Geist'", fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-tertiary)', padding:'12px 4px 6px' }}>
                      {status} ({group.length})
                    </p>
                    {group.sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate)).map(a => {
                      const d = daysUntil(a.dueDate);
                      return (
                        <div key={a._id} style={{ display:'flex', alignItems:'flex-start', gap:'var(--space-4)', padding:'13px var(--space-5)', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-1)', transition:'all var(--t-fast)' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-default)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-subtle)'}>
                          {/* Checkbox */}
                          <button onClick={() => handleToggleAssignment(a._id, a.status)}
                            style={{ width:20, height:20, borderRadius:5, border:`2px solid ${a.status==='submitted'||a.status==='graded'?'var(--green)':'var(--border-strong)'}`, background:a.status==='submitted'||a.status==='graded'?'var(--green-muted)':'transparent', flexShrink:0, marginTop:1, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--green)' }}>
                            {(a.status==='submitted'||a.status==='graded') ? '✓' : ''}
                          </button>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexWrap:'wrap', marginBottom:3 }}>
                              <p style={{ fontFamily:"'Geist'", fontWeight:500, fontSize:14, color: a.status==='overdue'?'var(--red)':'var(--text-primary)' }}>{a.title}</p>
                              <div style={{ width:6, height:6, borderRadius:'50%', background:PRIORITY_COLOR[a.priority], flexShrink:0 }}/>
                            </div>
                            <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-tertiary)' }}>
                              {a.subject} · Due {new Date(a.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                              {a.marks != null && ` · ${a.marks}/${a.maxMarks}`}
                            </p>
                            {a.notes && <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)', marginTop:3, fontStyle:'italic' }}>{a.notes}</p>}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexShrink:0 }}>
                            <StatusPill status={a.status}/>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:d.color, fontWeight:600 }}>{d.label}</span>
                            <button onClick={() => handleDeleteAssignment(a._id)}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:14, padding:'2px 6px', borderRadius:4, transition:'color var(--t-fast)' }}
                              onMouseEnter={e => e.target.style.color='var(--red)'}
                              onMouseLeave={e => e.target.style.color='var(--text-tertiary)'}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EXAMS ────────────────────────────────────────── */}
      {tab === 'exams' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)' }}>
            <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Exams & Assessments</h2>
            <button onClick={() => setModal('addExam')} className="btn btn-primary btn-sm">+ Add Exam</button>
          </div>

          {(profile?.exams?.length||0) === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
              <p style={{ fontSize:36, marginBottom:'var(--space-4)' }}>📋</p>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', marginBottom:8 }}>No exams scheduled</p>
              <button onClick={() => setModal('addExam')} className="btn btn-secondary btn-sm">Schedule an exam</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
              {[...profile.exams].sort((a,b) => new Date(a.date)-new Date(b.date)).map(exam => {
                const d = daysUntil(exam.date);
                return (
                  <div key={exam._id} className="card card-sm" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'var(--space-5)', alignItems:'start' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:5, flexWrap:'wrap' }}>
                        <h3 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14.5, color:'var(--text-primary)' }}>{exam.title}</h3>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'2px 8px', borderRadius:4, background:'var(--bg-elevated)', color:'var(--text-secondary)', border:'1px solid var(--border-subtle)' }}>{exam.type}</span>
                      </div>
                      <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>
                        {exam.subject}
                        {exam.venue && ` · ${exam.venue}`}
                        {exam.time && ` · ${exam.time}`}
                      </p>
                      <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)' }}>
                        {new Date(exam.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                      </p>
                      {exam.syllabus && (
                        <p style={{ fontFamily:"'Geist'", fontSize:12, color:'var(--text-secondary)', marginTop:6, padding:'6px 10px', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--border-strong)' }}>
                          {exam.syllabus}
                        </p>
                      )}
                      {exam.marks != null && (
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--amber)', marginTop:4 }}>
                          Score: {exam.marks}/{exam.maxMarks}
                        </p>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'var(--space-2)' }}>
                      <StatusPill status={exam.status}/>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:d.color, fontWeight:700 }}>{d.label}</span>
                      <button onClick={() => handleDeleteExam(exam._id)}
                        className="btn btn-danger btn-xs">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TIMETABLE ────────────────────────────────────── */}
      {tab === 'timetable' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)' }}>
            <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Weekly Timetable</h2>
            <button onClick={() => setModal('addSlot')} className="btn btn-primary btn-sm">+ Add Slot</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'var(--space-3)' }}>
            {DAYS.map(day => {
              const slots = (profile?.timetable||[]).filter(s=>s.day===day).sort((a,b)=>a.startTime.localeCompare(b.startTime));
              const isToday = day === todayDay;
              return (
                <div key={day} className="card card-sm" style={{ borderColor: isToday ? 'var(--accent-border)' : 'var(--border-subtle)', background: isToday ? 'linear-gradient(135deg,var(--bg-surface) 0%,rgba(61,142,240,.04) 100%)' : 'var(--bg-surface)' }}>
                  <p style={{ fontFamily:"'Geist'", fontWeight:700, fontSize:12, color: isToday?'var(--text-accent)':'var(--text-secondary)', marginBottom:'var(--space-3)', textTransform:'capitalize', letterSpacing:'0.02em' }}>
                    {DAY_SHORT[day]}{isToday && ' ·'}
                  </p>
                  {slots.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {slots.map((slot, i) => (
                        <div key={i} style={{ padding:'7px 8px', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', position:'relative' }}
                          onMouseEnter={e => { e.currentTarget.querySelector('.del-slot').style.opacity='1'; }}
                          onMouseLeave={e => { e.currentTarget.querySelector('.del-slot').style.opacity='0'; }}>
                          <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:11.5, color:'var(--text-primary)', marginBottom:2 }}>{slot.subject}</p>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-tertiary)' }}>{slot.startTime}–{slot.endTime}</p>
                          {slot.room && <p style={{ fontFamily:"'Geist'", fontSize:10, color:'var(--text-tertiary)', marginTop:1 }}>{slot.room}</p>}
                          <button className="del-slot" onClick={() => handleDeleteSlot((profile?.timetable||[]).indexOf(slot))}
                            style={{ position:'absolute', top:3, right:4, background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:12, opacity:0, transition:'opacity var(--t-fast)' }}>×</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontFamily:"'Geist'", fontSize:11, color:'var(--text-tertiary)', textAlign:'center', padding:'var(--space-3)' }}>Free</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ATTENDANCE ───────────────────────────────────── */}
      {tab === 'attendance' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--space-6)', flexWrap:'wrap', gap:'var(--space-3)' }}>
            <h2 style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Attendance Tracker</h2>
            <AttendanceAdder onAdd={handleAddAttendanceSubject}/>
          </div>
          {(profile?.attendance?.length||0) === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'var(--space-12)', border:'1px dashed var(--border-default)' }}>
              <p style={{ fontSize:36, marginBottom:'var(--space-4)' }}>✓</p>
              <p style={{ fontFamily:"'Geist'", fontWeight:600, fontSize:14, color:'var(--text-primary)', marginBottom:8 }}>No subjects added yet</p>
              <p style={{ fontFamily:"'Geist'", fontSize:13, color:'var(--text-tertiary)', marginBottom:'var(--space-5)' }}>Add subjects to start tracking attendance</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'var(--space-4)' }}>
              {profile.attendance.map((att, i) => (
                <div key={i} className="card card-sm">
                  <AttBar {...att}/>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--space-2)', marginTop:'var(--space-3)' }}>
                    {[['present','Present',att.present],['total','Total',att.total]].map(([field,label,val]) => (
                      <div key={field}>
                        <label style={{ fontFamily:"'Geist'", fontSize:10, color:'var(--text-tertiary)', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
                        <input type="number" value={val} min="0"
                          onChange={e => handleAttendanceChange(att.subject, field, e.target.value)}
                          className="input" style={{ padding:'6px 10px', fontSize:13, textAlign:'center', fontFamily:'var(--font-mono)' }}/>
                      </div>
                    ))}
                    <div>
                      <label style={{ fontFamily:"'Geist'", fontSize:10, color:'var(--text-tertiary)', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Min%</label>
                      <input type="number" value={att.minRequired||75} min="0" max="100"
                        onChange={e => handleAttendanceChange(att.subject, 'minRequired', e.target.value)}
                        className="input" style={{ padding:'6px 10px', fontSize:13, textAlign:'center', fontFamily:'var(--font-mono)' }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ───────────────────────────────────────── */}
      {modal === 'marksheet' && (
        <Modal title="Upload Marksheet" onClose={() => setModal(null)}>
          <MarksheetUploader onParsed={p => { setProfile(p); showToast('Academic data updated!'); }} onClose={() => setModal(null)}/>
        </Modal>
      )}

      {modal === 'editMeta' && (
        <Modal title="Edit Academic Info" onClose={() => setModal(null)}>
          <form onSubmit={handleSaveMeta} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div style={fieldStyle.row}>
              {[['institution','Institution','MIT World Peace University'],['degree','Degree','B.Tech / MCA'],['branch','Branch','Computer Science'],['enrollmentNo','Enrollment No','2024CS001']].map(([k,l,p]) => (
                <div key={k}><label style={fieldStyle.label}>{l}</label><input className="input" value={metaForm[k]||''} onChange={e=>setMetaForm(f=>({...f,[k]:e.target.value}))} placeholder={p}/></div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
              {[['currentSem','Current Semester',1,12],['totalSems','Total Semesters',2,12]].map(([k,l,min,max]) => (
                <div key={k}><label style={fieldStyle.label}>{l}</label><input type="number" className="input" value={metaForm[k]||''} onChange={e=>setMetaForm(f=>({...f,[k]:parseInt(e.target.value)||1}))} min={min} max={max}/></div>
              ))}
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent:'center', padding:11 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'addAssignment' && (
        <Modal title="Add Assignment" onClose={() => setModal(null)}>
          <form onSubmit={handleAddAssignment} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div><label style={fieldStyle.label}>Title *</label><input className="input" value={assignForm.title} onChange={e=>setAssignForm(f=>({...f,title:e.target.value}))} placeholder="Data Structures Assignment 3" required/></div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Subject *</label><input className="input" value={assignForm.subject} onChange={e=>setAssignForm(f=>({...f,subject:e.target.value}))} placeholder="DBMS" required/></div>
              <div><label style={fieldStyle.label}>Due Date *</label><input type="date" className="input" value={assignForm.dueDate} onChange={e=>setAssignForm(f=>({...f,dueDate:e.target.value}))} required/></div>
            </div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Priority</label>
                <select className="input" value={assignForm.priority} onChange={e=>setAssignForm(f=>({...f,priority:e.target.value}))}>
                  {['low','medium','high'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={fieldStyle.label}>Max Marks</label><input type="number" className="input" value={assignForm.maxMarks} onChange={e=>setAssignForm(f=>({...f,maxMarks:parseInt(e.target.value)||100}))}/></div>
            </div>
            <div><label style={fieldStyle.label}>Notes</label><textarea className="input" value={assignForm.notes} onChange={e=>setAssignForm(f=>({...f,notes:e.target.value}))} style={{ resize:'none', height:72 }} placeholder="Optional notes..."/></div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent:'center', padding:11 }}>{saving?'Adding...':'Add Assignment'}</button>
          </form>
        </Modal>
      )}

      {modal === 'addExam' && (
        <Modal title="Schedule Exam" onClose={() => setModal(null)}>
          <form onSubmit={handleAddExam} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div><label style={fieldStyle.label}>Title *</label><input className="input" value={examForm.title} onChange={e=>setExamForm(f=>({...f,title:e.target.value}))} placeholder="Mid Term Exam" required/></div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Subject *</label><input className="input" value={examForm.subject} onChange={e=>setExamForm(f=>({...f,subject:e.target.value}))} placeholder="Operating Systems" required/></div>
              <div><label style={fieldStyle.label}>Type</label>
                <select className="input" value={examForm.type} onChange={e=>setExamForm(f=>({...f,type:e.target.value}))}>
                  {['midterm','endterm','unit-test','practical','viva','other'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Date *</label><input type="date" className="input" value={examForm.date} onChange={e=>setExamForm(f=>({...f,date:e.target.value}))} required/></div>
              <div><label style={fieldStyle.label}>Time</label><input type="time" className="input" value={examForm.time} onChange={e=>setExamForm(f=>({...f,time:e.target.value}))}/></div>
            </div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Venue</label><input className="input" value={examForm.venue} onChange={e=>setExamForm(f=>({...f,venue:e.target.value}))} placeholder="Hall A, Block 3"/></div>
              <div><label style={fieldStyle.label}>Max Marks</label><input type="number" className="input" value={examForm.maxMarks} onChange={e=>setExamForm(f=>({...f,maxMarks:parseInt(e.target.value)||100}))}/></div>
            </div>
            <div><label style={fieldStyle.label}>Syllabus / Topics</label><textarea className="input" value={examForm.syllabus} onChange={e=>setExamForm(f=>({...f,syllabus:e.target.value}))} style={{ resize:'none', height:80 }} placeholder="Unit 1-3, Chapters 4-7..."/></div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent:'center', padding:11 }}>{saving?'Scheduling...':'Schedule Exam'}</button>
          </form>
        </Modal>
      )}

      {modal === 'addSlot' && (
        <Modal title="Add Timetable Slot" onClose={() => setModal(null)}>
          <form onSubmit={handleAddSlot} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Day</label>
                <select className="input" value={slotForm.day} onChange={e=>setSlotForm(f=>({...f,day:e.target.value}))}>
                  {DAYS.map(d=><option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={fieldStyle.label}>Type</label>
                <select className="input" value={slotForm.type} onChange={e=>setSlotForm(f=>({...f,type:e.target.value}))}>
                  {['lecture','lab','tutorial','other'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Start Time</label><input type="time" className="input" value={slotForm.startTime} onChange={e=>setSlotForm(f=>({...f,startTime:e.target.value}))}/></div>
              <div><label style={fieldStyle.label}>End Time</label><input type="time" className="input" value={slotForm.endTime} onChange={e=>setSlotForm(f=>({...f,endTime:e.target.value}))}/></div>
            </div>
            <div><label style={fieldStyle.label}>Subject *</label><input className="input" value={slotForm.subject} onChange={e=>setSlotForm(f=>({...f,subject:e.target.value}))} placeholder="Data Structures" required/></div>
            <div style={fieldStyle.row}>
              <div><label style={fieldStyle.label}>Teacher</label><input className="input" value={slotForm.teacher} onChange={e=>setSlotForm(f=>({...f,teacher:e.target.value}))} placeholder="Prof. Sharma"/></div>
              <div><label style={fieldStyle.label}>Room</label><input className="input" value={slotForm.room} onChange={e=>setSlotForm(f=>({...f,room:e.target.value}))} placeholder="Lab 201"/></div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent:'center', padding:11 }}>{saving?'Adding...':'Add to Timetable'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── ATTENDANCE ADDER (small inline component) ─────────────────────────────────
function AttendanceAdder({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <form onSubmit={e=>{e.preventDefault();if(val.trim()){onAdd(val.trim());setVal('');}}} style={{ display:'flex', gap:'var(--space-2)' }}>
      <input className="input btn-sm" value={val} onChange={e=>setVal(e.target.value)} placeholder="Add subject..." style={{ width:160, padding:'6px 12px', fontSize:13 }}/>
      <button type="submit" className="btn btn-secondary btn-sm">+ Add</button>
    </form>
  );
}
