// src/components/InputForm.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function InputForm({ onSubmit, loading }) {
  const [mode, setMode]           = useState('text'); // 'text' | 'pdf'
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText]       = useState('');
  const [pdfFile, setPdfFile]     = useState(null);

  const onDrop = useCallback(files => {
    if (files[0]) setPdfFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const canSubmit = jdText.trim().length > 50 &&
    (mode === 'text' ? resumeText.trim().length > 50 : pdfFile !== null);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ mode, resumeText, jdText, pdfFile });
  };

  return (
    <div style={{ animation: 'fade-in 0.5s ease both' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '56px 0 40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--amber-glow)', border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 100, padding: '6px 16px', marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)' }}>
            POWERED BY NLP + SENTENCE TRANSFORMERS
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.1, marginBottom: 16 }}>
          Know your fit<br />
          <span style={{ color: 'var(--amber)' }}>before you apply.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
          Paste your resume and a job description. Get an instant fit score, skill gap analysis, and AI-powered rewrite suggestions.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
        {['text', 'pdf'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              border: mode === m ? '1px solid var(--amber)' : '1px solid var(--border)',
              background: mode === m ? 'var(--amber-glow)' : 'transparent',
              color: mode === m ? 'var(--amber)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {m === 'text' ? '📝 Paste Text' : '📄 Upload PDF'}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Resume input */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Resume
            </span>
            {mode === 'text' && resumeText && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {resumeText.length} chars
              </span>
            )}
          </div>

          {mode === 'text' ? (
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your full resume here..."
              style={{
                width: '100%', height: 320,
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12,
                lineHeight: 1.7, padding: '16px 20px', resize: 'none',
              }}
            />
          ) : (
            <div
              {...getRootProps()}
              style={{
                height: 320,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', gap: 12,
                background: isDragActive ? 'rgba(245,166,35,0.05)' : 'transparent',
                border: isDragActive ? '2px dashed var(--amber)' : '2px dashed transparent',
                transition: 'all 0.2s',
                padding: 24,
              }}
            >
              <input {...getInputProps()} />
              {pdfFile ? (
                <>
                  <div style={{ fontSize: 36 }}>📄</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)' }}>
                    {pdfFile.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {(pdfFile.size / 1024).toFixed(1)} KB — click to replace
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40 }}>⬆️</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                    Drop your PDF here
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    or click to browse — max 5MB
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* JD input */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Job Description
            </span>
            {jdText && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {jdText.length} chars
              </span>
            )}
          </div>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            style={{
              width: '100%', height: 320,
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12,
              lineHeight: 1.7, padding: '16px 20px', resize: 'none',
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
        <button
          className="btn-primary"
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
          style={{ minWidth: 200, position: 'relative' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <Spinner /> Analysing…
            </span>
          ) : '⚡ Analyse Fit'}
        </button>
      </div>

      {/* Demo button */}
      {!loading && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            className="btn-ghost"
            onClick={() => onSubmit({ mode: 'mock' })}
          >
            Try with demo data →
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(10,13,20,0.3)',
      borderTopColor: '#0a0d14',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }}/>
  );
}
