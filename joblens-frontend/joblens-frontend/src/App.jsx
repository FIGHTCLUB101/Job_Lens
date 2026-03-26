// src/App.jsx
import React, { useState } from 'react';
import './index.css';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultsDashboard from './components/ResultsDashboard';
import { analyseText, analyseUpload, getMockResult } from './api/client';

// Loading states shown while analysing
const LOADING_STEPS = [
  'Extracting keywords from JD…',
  'Computing TF-IDF vectors…',
  'Running semantic similarity…',
  'Scoring seniority alignment…',
  'Generating rewrite suggestions…',
  'Finalising report…',
];

export default function App() {
  const [phase, setPhase]         = useState('input');   // 'input' | 'loading' | 'results'
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [loadStep, setLoadStep]   = useState(0);

  const handleSubmit = async ({ mode, resumeText, jdText, pdfFile }) => {
    setError(null);
    setPhase('loading');
    setLoadStep(0);

    // Animate loading steps
    const stepTimer = setInterval(() => {
      setLoadStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 500);

    try {
      let data;
      if (mode === 'mock') {
        await new Promise(r => setTimeout(r, 2800)); // simulate delay
        data = getMockResult();
      } else if (mode === 'pdf') {
        data = await analyseUpload(pdfFile, jdText);
      } else {
        data = await analyseText(resumeText, jdText);
      }
      setResult(data);
      setPhase('results');
    } catch (err) {
      console.error(err);
      // If backend not running, fall back to mock data automatically
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        const data = getMockResult();
        setResult(data);
        setPhase('results');
      } else {
        setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        setPhase('input');
      }
    } finally {
      clearInterval(stepTimer);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPhase('input');
  };

  return (
    <div className="app-shell">
      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 70%)',
          top: '-100px', right: '-100px',
        }}/>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,158,255,0.04) 0%, transparent 70%)',
          bottom: '10%', left: '-100px',
        }}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header onReset={handleReset} hasResults={phase === 'results'} />

        <main className="main-content">
          {phase === 'input' && (
            <>
              {error && (
                <div style={{
                  marginTop: 24,
                  background: 'rgba(231,76,60,0.08)',
                  border: '1px solid rgba(231,76,60,0.25)',
                  borderRadius: 10, padding: '12px 18px',
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff6b5b',
                }}>
                  ⚠ {error}
                </div>
              )}
              <InputForm onSubmit={handleSubmit} loading={false} />
            </>
          )}

          {phase === 'loading' && (
            <LoadingScreen step={loadStep} />
          )}

          {phase === 'results' && result && (
            <ResultsDashboard result={result} />
          )}
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '18px 24px',
          textAlign: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            JobLens · Built by Chetan Singh · NLP pipeline: TF-IDF + Sentence-Transformers
          </span>
        </footer>
      </div>
    </div>
  );
}

function LoadingScreen({ step }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32, animation: 'fade-in 0.3s ease both',
    }}>
      {/* Animated scanner */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '2px solid var(--border)',
          position: 'absolute',
        }}/>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '2px solid var(--amber)',
          borderTopColor: 'transparent',
          position: 'absolute',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          ⚡
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
        {LOADING_STEPS.map((s, i) => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: i <= step ? 1 : 0.25,
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: i < step ? 'var(--green)' : i === step ? 'var(--amber)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: i < step ? '#fff' : i === step ? '#0a0d14' : 'transparent',
              transition: 'background 0.3s',
            }}>
              {i < step ? '✓' : ''}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: i === step ? 'var(--amber)' : i < step ? 'var(--text-secondary)' : 'var(--text-muted)',
            }}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


