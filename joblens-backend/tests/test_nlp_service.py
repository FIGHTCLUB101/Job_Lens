"""
tests/test_nlp_service.py
Unit tests for the NLP pipeline.
Run with: pytest tests/ -v
"""
import pytest
from unittest.mock import patch, MagicMock
import numpy as np

from app.services.nlp_service import NLPService

# ── Fixtures ──────────────────────────────────────────────────────────────────

SAMPLE_RESUME = """
Software Development Intern – Info Edge (India) Ltd
- Architected a 3-tier session recording platform featuring a scalable MongoDB pipeline
  ingesting over 50,000 DOM events per minute.
- Optimised network performance by batching user interaction data, reducing API calls by 95%.
- Built ML models for classification using Python, Scikit-learn, and PyTorch.
- Led a cross-functional team of 5 engineers to deliver features on time.

Skills: Python, FastAPI, React, Machine Learning, SQL, Git, Agile
Education: B.Tech Computer Science, JIIT Noida, 2022–2026
"""

SAMPLE_JD = """
Analyst – Data Science
American Express, Model Risk Management Group

We are looking for a Data Scientist with 0–4 years experience.
Requirements:
- Strong Python and SQL skills
- Experience with Machine Learning models (supervised and unsupervised)
- Knowledge of model validation and risk management
- Experience with PyTorch, TensorFlow, or Scikit-learn
- Strong communication and stakeholder management skills
- Agile/Scrum experience preferred
"""


@pytest.fixture
def nlp():
    service = NLPService()
    # Mock SBERT to avoid downloading the model in CI
    mock_sbert = MagicMock()
    mock_sbert.encode.return_value = np.array([[0.5] * 384])
    service.sbert = mock_sbert
    return service


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_clean_removes_stopwords(nlp):
    result = nlp._clean("This is a test sentence with some stopwords")
    assert "is" not in result.split()
    assert "a" not in result.split()
    assert "test" in result or "thi" in result  # lemmatized


def test_extract_keywords_returns_list(nlp):
    jd_clean = nlp._clean(SAMPLE_JD)
    keywords = nlp._extract_keywords(jd_clean, top_n=20)
    assert isinstance(keywords, list)
    assert len(keywords) > 0
    assert all(isinstance(k, tuple) and len(k) == 2 for k in keywords)


def test_keyword_score_range(nlp):
    resume_clean = nlp._clean(SAMPLE_RESUME)
    jd_clean     = nlp._clean(SAMPLE_JD)
    keywords     = nlp._extract_keywords(jd_clean)
    score, matches = nlp._keyword_score(resume_clean, keywords)
    assert 0.0 <= score <= 100.0
    assert len(matches) > 0


def test_seniority_detection(nlp):
    assert nlp._detect_seniority("Looking for a senior engineer") == 4
    assert nlp._detect_seniority("Junior analyst position") == 1
    assert nlp._detect_seniority("Intern at a startup") == 0
    assert nlp._detect_seniority("No seniority signals here at all") is None


def test_seniority_score_exact_match(nlp):
    # Same level → 100
    with patch.object(nlp, "_detect_seniority", side_effect=[2, 2]):
        assert nlp._seniority_score("x", "y") == 100.0


def test_seniority_score_one_level_off(nlp):
    with patch.object(nlp, "_detect_seniority", side_effect=[2, 3]):
        assert nlp._seniority_score("x", "y") == 80.0


def test_fit_band():
    assert NLPService._band(75) == "strong"
    assert NLPService._band(60) == "moderate"
    assert NLPService._band(40) == "weak"
    assert NLPService._band(70) == "strong"
    assert NLPService._band(45) == "moderate"


def test_extract_bullets(nlp):
    text = """
- Built a machine learning pipeline with 98% accuracy.
• Reduced API calls by 95% through batching.
– Led a cross-functional team of 5 engineers.
Random non-bullet line.
"""
    bullets = nlp._extract_bullets(text)
    assert len(bullets) == 3
    assert all(not b.startswith("-") for b in bullets)


def test_analyse_returns_response(nlp):
    # Mock SBERT encode to return consistent arrays
    n_bullets = len(nlp._extract_bullets(SAMPLE_RESUME))
    # encode is called: 1 (JD semantic) + chunks (resume semantic) + 1 (JD rewrite) + bullets
    nlp.sbert.encode.side_effect = lambda texts: np.random.rand(len(texts), 384)

    result = nlp.analyse(SAMPLE_RESUME, SAMPLE_JD)

    assert 0 <= result.fit_score <= 100
    assert result.fit_band in ("strong", "moderate", "weak")
    assert result.scan_id != ""
    assert isinstance(result.matched_skills, list)
    assert isinstance(result.missing_skills, list)
    assert isinstance(result.rewrite_suggestions, list)
    assert result.processing_time_ms >= 0


def test_improve_bullet_adds_metric(nlp):
    bullet = "Worked on the backend system."
    improved, reason = nlp._improve_bullet(bullet, SAMPLE_JD, sim_score=0.2)
    assert "%" in improved or "X" in improved
    assert len(reason) > 0
