// src/components/SkillGap.jsx
import React, { useState } from 'react';

export default function SkillGap({ matched, missing }) {
  const [tab, setTab] = useState('missing');
  const items = tab === 'missing' ? missing : matched;
  const maxWeight = Math.max(...[...matched, ...missing].map(s => s.weight), 0.01);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'missing', label: `Missing Skills`, count: missing.length, color: 'var(--red)' },
          { id: 'matched', label: `Matched Skills`, count: matched.length, color: 'var(--green)' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
              border: tab === t.id ? `1px solid ${t.color}` : '1px solid var(--border)',
              background: tab === t.id ? `${t.color}15` : 'transparent',
              color: tab === t.id ? t.color : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {t.label}
            <span style={{
              background: tab === t.id ? t.color : 'var(--border)',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              borderRadius: 100, padding: '1px 7px', fontSize: 10, fontWeight: 700,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((skill, i) => (
          <div
            key={skill.skill}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              animation: `slide-in-right 0.3s ease both`,
              animationDelay: `${i * 0.04}s`,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
              background: tab === 'missing' ? 'var(--red-dim)' : 'var(--green-dim)',
              border: `1px solid ${tab === 'missing' ? 'rgba(231,76,60,0.2)' : 'rgba(46,204,113,0.2)'}`,
            }}>
              {tab === 'missing' ? '✕' : '✓'}
            </div>

            {/* Skill name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: tab === 'missing' ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                }}>
                  {skill.skill}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8,
                }}>
                  {(skill.weight * 100).toFixed(0)}% weight
                </span>
              </div>
              <div className="progress-track" style={{ height: 4 }}>
                <div className="progress-fill" style={{
                  width: `${(skill.weight / maxWeight) * 100}%`,
                  background: tab === 'missing' ? 'var(--red)' : 'var(--green)',
                  opacity: 0.7,
                }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13,
        }}>
          {tab === 'missing' ? '🎉 No missing skills detected!' : 'No matched skills detected.'}
        </div>
      )}
    </div>
  );
}
