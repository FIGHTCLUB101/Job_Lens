// src/components/KeywordHeatmap.jsx
import React from 'react';

function relevanceToStyle(rel) {
  if (rel >= 0.75) return { bg: 'rgba(245,166,35,0.25)', border: 'rgba(245,166,35,0.45)', color: '#f5c842', size: 13 };
  if (rel >= 0.55) return { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.25)', color: '#e0a820', size: 12 };
  if (rel >= 0.35) return { bg: 'rgba(74,158,255,0.10)', border: 'rgba(74,158,255,0.20)', color: '#6aabf5', size: 12 };
  return              { bg: 'rgba(138,151,176,0.07)', border: 'rgba(138,151,176,0.15)', color: '#6a7590', size: 11 };
}

export default function KeywordHeatmap({ items }) {
  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'High relevance', bg: 'rgba(245,166,35,0.25)', border: 'rgba(245,166,35,0.45)', color: '#f5c842' },
          { label: 'Medium',         bg: 'rgba(74,158,255,0.10)', border: 'rgba(74,158,255,0.20)', color: '#6aabf5' },
          { label: 'Low',            bg: 'rgba(138,151,176,0.07)',border: 'rgba(138,151,176,0.15)',color: '#6a7590' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: l.bg, border: `1px solid ${l.border}`,
            }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item, i) => {
          const s = relevanceToStyle(item.relevance);
          return (
            <div
              key={item.word}
              className="heatmap-chip"
              title={`Relevance: ${(item.relevance * 100).toFixed(0)}%`}
              style={{
                background: s.bg,
                borderColor: s.border,
                color: s.color,
                fontSize: s.size,
                animation: `fade-in 0.3s ease both`,
                animationDelay: `${i * 0.03}s`,
              }}
            >
              {item.word}
            </div>
          );
        })}
      </div>
    </div>
  );
}
