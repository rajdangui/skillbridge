import { useState } from 'react';
export default function SearchBar({ onSearch, placeholder='Search...', defaultValue='', style }) {
  const [q, setQ] = useState(defaultValue);
  return (
    <form onSubmit={e=>{e.preventDefault();onSearch(q);}} style={{ display:'flex', gap:8, ...style }}>
      <div style={{ position:'relative', flex:1 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)', pointerEvents:'none' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder={placeholder}
          className="input" style={{ paddingLeft:36 }}/>
      </div>
      <button type="submit" className="btn btn-primary" style={{ flexShrink:0 }}>Search</button>
    </form>
  );
}
