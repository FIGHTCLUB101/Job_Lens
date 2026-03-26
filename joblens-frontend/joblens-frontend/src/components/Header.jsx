// src/components/Header.jsx
import React from 'react';

export default function Header({ onReset, hasResults }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      background: 'rgba(10,13,20,0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--amber)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 16,
            color: '#0a0d14',
          }}>J</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>
            Job<span style={{ color: 'var(--amber)' }}>Lens</span>
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '2px 7px',
            borderRadius: 4,
            marginLeft: 4,
          }}>v1.0</span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}>AI Resume Analyser</span>
          {hasResults && (
            <button className="btn-ghost" onClick={onReset}>
              ← New Scan
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
