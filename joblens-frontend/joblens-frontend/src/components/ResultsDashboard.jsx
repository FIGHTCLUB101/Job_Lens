// src/components/ResultsDashboard.jsx
import React from 'react';
import ScoreRing from './ScoreRing';
import SkillGap from './SkillGap';
import KeywordHeatmap from './KeywordHeatmap';
import RewriteSuggestions from './RewriteSuggestions';

function Panel({ title, subtitle, children, style = {} }) {
  return (
    <div className="card" style={style}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ResultsDashboard({ result }) {
  const { fit_score, fit_band, score_breakdown, matched_skills, missing_skills,
          keyword_heatmap, rewrite_suggestions, processing_time_ms, scan_id } = result;

  return (
    <div style={{ animation: 'fade-in 0.5s ease both' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 0 20px',
      }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Analysis Complete</h2>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Scan ID: <span style={{ color: 'var(--text-secondary)' }}>{scan_id.slice(0, 12)}…</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              ⚡ {processing_time_ms}ms
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatBadge label="Matched" value={matched_skills.length} color="var(--green)" />
          <StatBadge label="Missing"  value={missing_skills.length}  color="var(--red)" />
          <StatBadge label="Rewrites" value={rewrite_suggestions.length} color="var(--amber)" />
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 20 }}>
        {/* Score ring */}
        <Panel
          title="Fit Score"
          subtitle="Keyword + Semantic + Seniority"
        >
          <ScoreRing
            score={fit_score}
            band={fit_band}
            breakdown={score_breakdown}
          />
        </Panel>

        {/* Skill gap */}
        <Panel
          title="Skill Analysis"
          subtitle={`${matched_skills.length} matched · ${missing_skills.length} missing from JD`}
        >
          <SkillGap matched={matched_skills} missing={missing_skills} />
        </Panel>
      </div>

      {/* Heatmap */}
      <Panel
        title="Keyword Heatmap"
        subtitle="Top JD keywords — brightness = relevance to your resume"
        style={{ marginBottom: 20 }}
      >
        <KeywordHeatmap items={keyword_heatmap} />
      </Panel>

      {/* Rewrites */}
      <Panel
        title="Rewrite Suggestions"
        subtitle={`Top ${rewrite_suggestions.length} weakest bullets — AI-powered improvements`}
      >
        <RewriteSuggestions suggestions={rewrite_suggestions} />
      </Panel>

      {/* Score interpretation guide */}
      <div style={{
        marginTop: 20,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: '18px 24px',
        display: 'flex', gap: 28, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
          Score guide:
        </span>
        {[
          { range: '70–100', label: 'Strong fit — apply now', color: 'var(--green)' },
          { range: '45–69',  label: 'Moderate — close the gaps first', color: 'var(--amber)' },
          { range: '0–44',   label: 'Weak — significant rework needed', color: 'var(--red)' },
        ].map(g => (
          <div key={g.range} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ color: g.color }}>{g.range}</span> — {g.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 18px', gap: 2, minWidth: 70,
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color }}>
        {value}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}
