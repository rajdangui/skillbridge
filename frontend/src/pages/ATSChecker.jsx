import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { atsAPI, opportunityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ScoreArc({ score }) {
  const size = 160;
  const strokeW = 12;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  // Arc goes from -210deg to +30deg (240deg sweep) for gauge effect
  const sweep = 240;
  const arcLen = circ * sweep / 360;
  const offset = arcLen * (1 - score / 100);
  const color = score >= 80 ? 'var(--green)' : score >= 65 ? 'var(--teal)' : score >= 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-210deg)' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--bg-elevated)" strokeWidth={strokeW}
          strokeDasharray={`${circ * sweep / 360} ${circ}`}
          strokeLinecap="round"/>
        {/* Fill */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeW}
          strokeDasharray={`${circ * sweep / 360} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)', transformOrigin: 'center' }}/>
      </svg>
      {/* Center label */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
        <span style={{ fontFamily: "'Geist'", fontWeight: 700, fontSize: 32, letterSpacing: '-0.04em', color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Geist'", fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, max, color }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Geist'", fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>
          {score}<span style={{ color: 'var(--text-tertiary)' }}>/{max}</span>
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }}/>
      </div>
    </div>
  );
}

function SectionCheck({ label, passed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: passed ? 'var(--green-muted)' : 'var(--bg-elevated)', border: `1px solid ${passed ? 'rgba(52,211,153,.2)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)' }}>
      <span style={{ fontSize: 13, color: passed ? 'var(--green)' : 'var(--text-tertiary)' }}>{passed ? '✓' : '○'}</span>
      <span style={{ fontFamily: "'Geist'", fontSize: 13, color: passed ? 'var(--green)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>{label}</span>
    </div>
  );
}

const VERDICT_CONFIG = {
  Excellent: { color: 'var(--green)',  border: 'rgba(52,211,153,.25)',  bg: 'var(--green-muted)',  emoji: '🏆' },
  Good:      { color: 'var(--teal)',   border: 'rgba(45,212,191,.25)',  bg: 'var(--teal-muted)',   emoji: '👍' },
  Fair:      { color: 'var(--amber)',  border: 'rgba(251,191,36,.25)',  bg: 'var(--amber-muted)',  emoji: '⚠️' },
  'Needs Work': { color: 'var(--red)', border: 'rgba(248,113,113,.25)', bg: 'var(--red-muted)',    emoji: '🔧' },
};

export default function ATSChecker() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [resumeText, setResumeText] = useState('');
  const [opportunityId, setOpportunityId] = useState(searchParams.get('opportunity') || '');
  const [opps, setOpps] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    opportunityAPI.getAll({ limit: 50 })
      .then(r => setOpps(r.data.opportunities || []))
      .catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (resumeText.trim().length < 50) { setError('Paste your resume text first (min 50 characters)'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await atsAPI.analyze({ resumeText: resumeText.trim(), opportunityId: opportunityId || undefined });
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verdict = result ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['Fair'] : null;

  return (
    <div className="page page-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <p className="label" style={{ marginBottom: 8 }}>Free Tool</p>
        <h1 style={{ fontFamily: "'Geist'", fontWeight: 700, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 4 }}>
          Resume ATS Checker
        </h1>
        <p style={{ fontFamily: "'Geist'", fontSize: 13, color: 'var(--text-tertiary)' }}>
          See how your resume scores against Applicant Tracking Systems — no sign-up needed
        </p>
      </div>

      {/* How it works bar */}
      <div className="card card-sm" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', borderColor: 'var(--border-default)' }}>
        {[
          { n: '01', t: 'Paste your resume', d: 'Copy all text from your PDF/Word doc' },
          { n: '02', t: 'Pick a target role', d: 'Optional — for keyword matching' },
          { n: '03', t: 'Get your score', d: 'Instant ATS score + fix checklist' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 180 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-accent)', fontWeight: 600 }}>{s.n}</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Geist'", fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.t}</p>
              <p style={{ fontFamily: "'Geist'", fontSize: 11, color: 'var(--text-tertiary)' }}>{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bento-grid">
        {/* Input panel — 5 cols */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Resume text input */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <p className="label">Your Resume</p>
              {user?.resume && (
                <a href={user.resume} target="_blank" rel="noreferrer"
                  style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--text-accent)', textDecoration: 'none' }}>
                  View uploaded ↗
                </a>
              )}
            </div>
            <textarea
              value={resumeText}
              onChange={e => { setResumeText(e.target.value); setCharCount(e.target.value.length); setError(''); }}
              className="input"
              style={{ resize: 'vertical', minHeight: 280, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.6 }}
              placeholder={`Paste your full resume text here...\n\nTip: Open your PDF, select all (Ctrl+A), copy, and paste here.\n\nExample:\nJohn Doe\njohn@email.com | github.com/johndoe\n\nEDUCATION\nB.Tech Computer Science — MIT Pune (2021–2025)\n\nSKILLS\nReact, Node.js, Python, MongoDB, Docker\n\nPROJECTS\n- E-commerce platform built with React + Node.js...`}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: charCount < 50 ? 'var(--red)' : 'var(--text-tertiary)' }}>
                {charCount} chars {charCount < 50 ? `(need ${50 - charCount} more)` : ''}
              </span>
              {charCount > 0 && (
                <button onClick={() => { setResumeText(''); setCharCount(0); }} style={{ fontFamily: "'Geist'", fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear ×
                </button>
              )}
            </div>
          </div>

          {/* Target role selector */}
          <div className="card">
            <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Target Role <span style={{ color: 'var(--text-tertiary)', textTransform: 'none', fontSize: 11 }}>(optional — improves keyword matching)</span></p>
            <select
              value={opportunityId}
              onChange={e => setOpportunityId(e.target.value)}
              className="input"
              style={{ fontFamily: "'Geist'" }}>
              <option value="">General ATS check (no target role)</option>
              {opps.map(o => <option key={o._id} value={o._id}>{o.title} — {o.company}</option>)}
            </select>
            {!opportunityId && (
              <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                Without a target role, we skip keyword matching and focus on formatting.
              </p>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-muted)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 'var(--radius-md)', fontFamily: "'Geist'", fontSize: 13, color: 'var(--red)' }}>
              ⚠ {error}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading || charCount < 50} className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
            {loading
              ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite', display: 'inline-block' }}/> Analyzing...</>
              : result ? '↻ Re-analyze' : '🔍 Check ATS Score'}
          </button>

          {/* Tips card */}
          {!result && !loading && (
            <div className="card card-accent card-sm">
              <p className="label" style={{ marginBottom: 'var(--space-3)', color: 'var(--text-accent)' }}>What gets checked</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Section detection (7 sections)', 'Keyword match against job requirements', 'Word count & resume length', 'Action verbs count', 'Quantified achievements', 'Email & contact info', 'ATS-breaking special characters'].map((t, i) => (
                  <li key={i} style={{ fontFamily: "'Geist'", fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--text-accent)', flexShrink: 0 }}>·</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Results panel — 7 cols */}
        <div className="col-7">
          {/* Empty state */}
          {!result && !loading && (
            <div className="card" style={{ minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
              <div style={{ fontSize: 52, marginBottom: 'var(--space-5)' }}>📄</div>
              <p style={{ fontFamily: "'Geist'", fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>Paste your resume to get started</p>
              <p style={{ fontFamily: "'Geist'", fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 300, lineHeight: 1.6 }}>
                Your ATS score, section checklist, keyword gaps, and improvement tips will appear here.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="card" style={{ minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent-muted)', borderTopColor: 'var(--accent)', animation: 'spin .8s linear infinite', marginBottom: 'var(--space-5)' }}/>
              <p style={{ fontFamily: "'Geist'", fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>Scanning your resume...</p>
              <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>Checking sections, keywords, and formatting</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

              {/* Score hero card */}
              <div className="card" style={{ border: `1px solid ${verdict.border}`, background: `linear-gradient(135deg, var(--bg-surface) 0%, ${verdict.color}08 100%)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
                  <ScoreArc score={result.totalScore} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: verdict.bg, border: `1px solid ${verdict.border}`, marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontSize: 14 }}>{verdict.emoji}</span>
                      <span style={{ fontFamily: "'Geist'", fontWeight: 600, fontSize: 13, color: verdict.color }}>{result.verdict}</span>
                    </div>
                    <p style={{ fontFamily: "'Geist'", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>{result.targetRole}</p>
                    <p style={{ fontFamily: "'Geist'", fontSize: 13, color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
                      {result.wordCount} words · {result.actionVerbsFound} action verbs · {result.hasQuantifiedAchievements ? 'Has' : 'No'} quantified achievements
                    </p>
                    {/* Sub-score bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <ScoreBar label="Section Coverage" score={result.sectionScore} max={40} color={result.sectionScore >= 30 ? 'var(--green)' : result.sectionScore >= 20 ? 'var(--amber)' : 'var(--red)'}/>
                      <ScoreBar label="Keyword Match" score={result.keywordScore} max={30} color={result.keywordScore >= 20 ? 'var(--green)' : result.keywordScore >= 10 ? 'var(--amber)' : 'var(--red)'}/>
                      <ScoreBar label="Format Quality" score={result.formatScore} max={30} color={result.formatScore >= 22 ? 'var(--green)' : result.formatScore >= 15 ? 'var(--amber)' : 'var(--red)'}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two columns: sections + keywords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {/* Section checklist */}
                <div className="card">
                  <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Section Checklist</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(result.sections || {}).map(([k, v]) => (
                      <SectionCheck key={k} label={k} passed={v}/>
                    ))}
                  </div>
                </div>

                {/* Keyword analysis */}
                <div className="card">
                  <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Keyword Analysis</p>
                  {result.keywordMatches?.length > 0 ? (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>✓ Found ({result.keywordMatches.length})</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {result.keywordMatches.map(k => (
                          <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', background: 'var(--green-muted)', color: 'var(--green)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 'var(--radius-sm)' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                      {opportunityId ? 'No keywords matched' : 'Select a target role to see keyword matching'}
                    </p>
                  )}
                  {result.keywordMissing?.length > 0 && (
                    <div>
                      <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>✗ Missing ({result.keywordMissing.length})</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {result.keywordMissing.map(k => (
                          <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', background: 'var(--red-muted)', color: 'var(--red)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 'var(--radius-sm)' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!opportunityId && !result.keywordMatches?.length && !result.keywordMissing?.length && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
                      <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>Select a target role above to see keyword matching</p>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn-secondary btn-xs">Select a Role ↑</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Issues */}
              {result.issues?.length > 0 && (
                <div className="card" style={{ border: '1px solid rgba(248,113,113,.2)' }}>
                  <p className="label" style={{ marginBottom: 'var(--space-4)', color: 'var(--red)' }}>Issues to Fix ({result.issues.length})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {result.issues.map((issue, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 12px', background: 'var(--red-muted)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248,113,113,.15)' }}>
                        <span style={{ color: 'var(--red)', flexShrink: 0, fontSize: 13 }}>✗</span>
                        <span style={{ fontFamily: "'Geist'", fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {(result.aiSuggestions || result.tips)?.length > 0 && (
                <div className="card" style={{ border: '1px solid var(--accent-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <p className="label" style={{ color: 'var(--text-accent)' }}>
                      {result.hasAI ? '✨ AI Improvement Tips' : '💡 Improvement Tips'}
                    </p>
                    {result.hasAI && <span className="badge badge-blue">AI-Powered</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {(result.aiSuggestions || result.tips).map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--accent-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-accent)', flexShrink: 0, paddingTop: 1 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontFamily: "'Geist'", fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <p style={{ fontFamily: "'Geist'", fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {result.totalScore >= 70 ? 'Looking good — ready to apply?' : 'Fix issues and re-check before applying'}
                  </p>
                  <p style={{ fontFamily: "'Geist'", fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Upload your updated resume to your profile
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Link to="/profile/edit" className="btn btn-secondary btn-sm">Update Profile →</Link>
                  {opportunityId && <Link to={`/opportunities/${opportunityId}`} className="btn btn-primary btn-sm">Apply Now</Link>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
