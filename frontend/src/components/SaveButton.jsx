import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savedAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function SaveButton({ opportunityId, initialSaved=false, onToggle, className }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const handleClick = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try { await savedAPI.toggle(opportunityId); setSaved(v=>!v); onToggle?.(!saved); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };
  return (
    <button onClick={handleClick} disabled={loading} title={saved?'Remove bookmark':'Bookmark'}
      className="btn btn-icon"
      style={{ border:'1px solid', borderColor:saved?'var(--accent-border)':'var(--border-default)', background:saved?'var(--accent-muted)':'var(--bg-elevated)', color:saved?'var(--text-accent)':'var(--text-secondary)' }}
      >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={saved?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    </button>
  );
}
