// src/components/RewriteSuggestions.jsx
import React, { useState } from 'react';

export default function RewriteSuggestions({ suggestions }) {
  const [open, setOpen] = useState(0);

  if (!suggestions?.length) return (
    <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
      No suggestions — your bullets are already strong!
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {suggestions.map((s, i) => (
        <div
          key={i}
          style={{
            background: open === i ? 'var(--bg-hover)' : 'transparent',
            border: `1px solid ${open === i ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 10,
            overflow: 'hidden',
            transition: 'all 0.2s',
            animation: `fade-in 0.4s ease both`,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          {/* Header */}
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            style={{
              width: '100%', background: 'none', border: 'none',
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)',
              color: '#ff6b5b', fontFamily: 'var(--font-mono)', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginTop: 1,
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span className="diff-original">
                  {s.original.length > 90 ? s.original.slice(0, 90) + '…' : s.original}
                </span>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>
              {open === i ? '▴' : '▾'}
            </span>
          </button>

          {/* Expanded */}
          {open === i && (
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
              {/* Improved */}
              <div style={{ marginTop: 16, marginBottom: 12 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                  color: 'var(--green)', marginBottom: 8, textTransform: 'uppercase',
                }}>✦ Improved</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
                  color: 'var(--green)',
                  background: 'rgba(46,204,113,0.06)',
                  border: '1px solid rgba(46,204,113,0.15)',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  {s.improved}
                </div>
              </div>

              {/* Why */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'rgba(245,166,35,0.06)',
                border: '1px solid rgba(245,166,35,0.15)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  {s.reason}
                </span>
              </div>

              {/* Copy button */}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-ghost"
                  onClick={() => navigator.clipboard?.writeText(s.improved)}
                >
                  Copy ↗
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
