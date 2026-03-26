// src/api/client.js
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const client = axios.create({ baseURL: BASE, timeout: 30000 });

// ── Text analysis ─────────────────────────────────────────────────────────────
export async function analyseText(resumeText, jdText) {
  const { data } = await client.post('/analyse/text', {
    resume_text: resumeText,
    jd_text: jdText,
  });
  return data;
}

// ── PDF upload + JD text ──────────────────────────────────────────────────────
export async function analyseUpload(pdfFile, jdText) {
  const form = new FormData();
  form.append('resume_pdf', pdfFile);
  form.append('jd_text', jdText);
  const { data } = await client.post('/analyse/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Mock response (used when backend not running) ─────────────────────────────
export function getMockResult() {
  return {
    scan_id: 'mock-001',
    fit_score: 73.4,
    fit_band: 'strong',
    score_breakdown: {
      keyword_score: 78.2,
      semantic_score: 71.5,
      seniority_score: 80.0,
    },
    matched_skills: [
      { skill: 'python',         found_in_resume: true,  weight: 0.09 },
      { skill: 'machine learning',found_in_resume: true,  weight: 0.08 },
      { skill: 'scikit-learn',   found_in_resume: true,  weight: 0.07 },
      { skill: 'sql',            found_in_resume: true,  weight: 0.06 },
      { skill: 'pytorch',        found_in_resume: true,  weight: 0.06 },
      { skill: 'agile',          found_in_resume: true,  weight: 0.05 },
      { skill: 'cross-functional',found_in_resume: true, weight: 0.04 },
      { skill: 'data analysis',  found_in_resume: true,  weight: 0.04 },
    ],
    missing_skills: [
      { skill: 'model validation',  found_in_resume: false, weight: 0.08 },
      { skill: 'risk management',   found_in_resume: false, weight: 0.07 },
      { skill: 'tensorflow',        found_in_resume: false, weight: 0.05 },
      { skill: 'stakeholder management', found_in_resume: false, weight: 0.05 },
      { skill: 'gradient boosting', found_in_resume: false, weight: 0.04 },
    ],
    keyword_heatmap: [
      { word: 'python',           relevance: 0.95 },
      { word: 'machine learning', relevance: 0.92 },
      { word: 'model validation', relevance: 0.88 },
      { word: 'risk management',  relevance: 0.84 },
      { word: 'sql',              relevance: 0.78 },
      { word: 'pytorch',          relevance: 0.74 },
      { word: 'data analysis',    relevance: 0.70 },
      { word: 'deep learning',    relevance: 0.68 },
      { word: 'tensorflow',       relevance: 0.65 },
      { word: 'stakeholder',      relevance: 0.60 },
      { word: 'agile',            relevance: 0.55 },
      { word: 'nlp',              relevance: 0.50 },
      { word: 'scikit-learn',     relevance: 0.48 },
      { word: 'cross-functional', relevance: 0.44 },
      { word: 'gradient boosting',relevance: 0.40 },
      { word: 'reinforcement',    relevance: 0.35 },
      { word: 'communication',    relevance: 0.30 },
      { word: 'leadership',       relevance: 0.28 },
    ],
    rewrite_suggestions: [
      {
        original: 'Worked on the backend system for session recording.',
        improved: 'Architected a 3-tier session recording platform ingesting 50K+ DOM events/min, reducing API overhead by 95%.',
        reason: 'Added quantified outcome and strong action verb; increased semantic alignment with "scalable systems" in JD.',
      },
      {
        original: 'Built machine learning models for classification tasks.',
        improved: 'Developed and validated ML classification models (XGBoost: 94.1%, Random Forest: 87.9%) benchmarked across 4 algorithms to identify production-ready solution.',
        reason: 'Added model validation framing — directly matches "model risk" and "validation" keywords in JD.',
      },
      {
        original: 'Collaborated with cross-functional teams.',
        improved: 'Led cross-functional collaboration across 3 engineering teams, managing 20+ PRs and delivering features within 2-week sprint cycles.',
        reason: 'Added specificity (teams, PRs, sprint cadence) and removed vague phrasing.',
      },
    ],
    processing_time_ms: 312,
  };
}
