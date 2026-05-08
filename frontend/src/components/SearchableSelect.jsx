import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder = 'Search role...', emptyLabel = 'Choose a role...', style }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Input Display */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input"
          placeholder={isOpen ? 'Type to search...' : (displayValue || placeholder)}
          value={isOpen ? search : displayValue}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            setSearch(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          style={{ width: '100%', cursor: 'pointer', paddingRight: 32 }}
        />
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 10, pointerEvents: 'none', transition: 'transform 0.2s' }}>
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {/* Dropdown Options Box */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 999,
          boxShadow: 'var(--shadow-lg)'
        }}>
          {emptyLabel && (
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontFamily: "'Geist'",
                fontSize: 13,
                cursor: 'pointer',
                color: !value ? 'var(--text-accent)' : 'var(--text-secondary)',
                background: !value ? 'var(--accent-muted)' : 'transparent',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background var(--t-fast)'
              }}
              onMouseEnter={e => { if (value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (value) e.currentTarget.style.background = 'transparent'; }}
            >
              ✨ {emptyLabel}
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map(o => (
              <div
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontFamily: "'Geist'",
                  fontSize: 13,
                  cursor: 'pointer',
                  color: value === o.value ? 'var(--text-accent)' : 'var(--text-primary)',
                  background: value === o.value ? 'var(--accent-muted)' : 'transparent',
                  transition: 'background var(--t-fast)'
                }}
                onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = 'transparent'; }}
              >
                {o.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '12px', fontFamily: "'Geist'", fontSize: 12.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
              No options match "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
