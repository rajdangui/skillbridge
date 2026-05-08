import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder = 'Search role...', emptyLabel = 'Choose a role...', style }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    } else {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(o =>
    o.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'var(--bg-surface)',
          padding: '10px 14px',
          fontFamily: "'Geist'",
          fontSize: 14,
          userSelect: 'none',
          borderColor: isOpen ? 'var(--accent-border)' : 'var(--border-default)',
          boxShadow: isOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none'
        }}
      >
        <span style={{ color: displayValue ? 'var(--text-primary)' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue || placeholder}
        </span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', pointerEvents: 'none' }}>
          ▼
        </span>
      </div>

      {/* Dropdown Box */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '300px',
          overflow: 'hidden'
        }}>
          {/* Search Box inside dropdown */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)', fontSize: 13 }}>🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type to search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px 6px 30px',
                  fontFamily: "'Geist'",
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') setIsOpen(false);
                }}
              />
            </div>
          </div>

          {/* Options list scroll area */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
            {emptyLabel && !search && (
              <div
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
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
                    padding: '10px 14px',
                    fontFamily: "'Geist'",
                    fontSize: 13,
                    cursor: 'pointer',
                    color: value === o.value ? 'var(--text-accent)' : 'var(--text-primary)',
                    background: value === o.value ? 'var(--accent-muted)' : 'transparent',
                    transition: 'background var(--t-fast)',
                    borderBottom: '1px solid rgba(255,255,255,0.01)'
                  }}
                  onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {o.label}
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', fontFamily: "'Geist'", fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                No options match "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
