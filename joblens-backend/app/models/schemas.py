"""
app/models/schemas.py
All Pydantic request & response schemas for the analysis endpoints.
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Request ───────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    """
    Sent when the user pastes resume text + JD text directly.
    For PDF upload, the router extracts text first and then calls the same logic.
    """
    resume_text: str = Field(..., min_length=50, description="Plain text of the resume")
    jd_text: str     = Field(..., min_length=50, description="Plain text of the job description")


# ── Sub-models (used inside the response) ────────────────────────────────────

class SkillMatch(BaseModel):
    skill: str
    found_in_resume: bool
    weight: float = Field(description="Relative importance in JD (0–1)")


class BulletSuggestion(BaseModel):
    original: str
    improved: str
    reason: str


class KeywordHeatmapEntry(BaseModel):
    word: str
    relevance: float = Field(description="0 = irrelevant, 1 = highly relevant to JD")


class ScoreBreakdown(BaseModel):
    keyword_score:   float = Field(description="0–100, based on keyword overlap")
    semantic_score:  float = Field(description="0–100, based on sentence-transformer similarity")
    seniority_score: float = Field(description="0–100, based on seniority/title alignment")


# ── Main Response ─────────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    scan_id: str

    # Core result
    fit_score:       float         = Field(description="Overall fit score 0–100")
    fit_band:        str           = Field(description="'strong' | 'moderate' | 'weak'")
    score_breakdown: ScoreBreakdown

    # Skill gap
    matched_skills:  List[SkillMatch]
    missing_skills:  List[SkillMatch]

    # Keyword heatmap (top 30 JD keywords with resume presence flag)
    keyword_heatmap: List[KeywordHeatmapEntry]

    # Rewrite suggestions (top 3 weakest resume bullets)
    rewrite_suggestions: List[BulletSuggestion]

    # Meta
    processing_time_ms: int
