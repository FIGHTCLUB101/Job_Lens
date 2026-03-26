// src/components/ScoreRing.jsx
import React, { useEffect, useState } from 'react';

const BAND_COLORS = {
  strong:   '#2ecc71',
  moderate: '#f5a623',
  weak:     '#e74c3c',
};
const BAND_LABELS = {
  strong:   'STRONG FIT',
  moderate: 'MODERATE FIT',
  weak:     'WEAK FIT',
};

export default function ScoreRing({ score, band, breakdown }) {
  const [displayed, setDisplayed] = useState(0);

  // Animate counter
  useEffect(() => {
    let start = 0;
    const end  = Math.round(score);
    const dur  = 1200;
    const step = dur / end;
    const timer = setInterval(() => {
      start += 1;
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [score]);

  const color = BAND_COLORS[band] || '#f5a623';
  const SIZE = 180;
  const STROKE = 10;
  const R = (SIZE - STROKE) / 2;
  const CIRCUM = 2 * Math.PI * R;
  const offset = CIRCUM - (score / 100) * CIRCUM;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            fill="none" stroke="var(--bg-hover)" strokeWidth={STROKE}
          />
          {/* Fill */}
          <circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUM}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        {/* Center number */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 42,
            color,
            lineHeight: 1,
            animation: 'count-up 0.6s ease both',
          }}>{displayed}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
          }}>/ 100</span>
        </div>
      </div>

      {/* Band label */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.1em',
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        padding: '6px 18px',
        borderRadius: 100,
      }}>
        {BAND_LABELS[band]}
      </div>

      {/* Sub-scores */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Keywords',  key: 'keyword_score',   color: '#4a9eff' },
          { label: 'Semantic',  key: 'semantic_score',  color: '#a855f7' },
          { label: 'Seniority', key: 'seniority_score', color: '#f5a623' },
        ].map(({ label, key, color: c }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c, fontWeight: 700 }}>
                {breakdown[key].toFixed(0)}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${breakdown[key]}%`, background: c }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
