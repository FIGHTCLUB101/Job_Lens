"""
app/services/nlp_service.py

The core NLP pipeline for JobLens.

Pipeline overview:
  1. Text cleaning & tokenisation   (NLTK)
  2. Keyword extraction from JD     (TF-IDF)
  3. Keyword overlap score          (set intersection, weighted by TF-IDF score)
  4. Semantic similarity score      (Sentence-Transformers cosine similarity)
  5. Seniority alignment score      (rule-based regex matching)
  6. Composite fit score            (weighted average, weights from .env)
  7. Bullet weakness detection      (per-bullet semantic similarity vs JD)
  8. Rewrite suggestions            (LLM call if key present, else rule-based)
"""

from __future__ import annotations

import os
import re
import time
import uuid
import logging
from typing import List, Tuple

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Sentence-Transformers — imported lazily to keep startup fast on machines
# without a GPU. The model (~80 MB) is downloaded once and cached in
# ~/.cache/torch/sentence_transformers/
from sentence_transformers import SentenceTransformer

from app.models.schemas import (
    AnalysisResponse, ScoreBreakdown,
    SkillMatch, BulletSuggestion, KeywordHeatmapEntry,
)

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

SENIORITY_LEVELS = {
    "intern":       0,
    "junior":       1,
    "associate":    2,
    "analyst":      2,
    "mid":          3,
    "senior":       4,
    "lead":         5,
    "principal":    6,
    "staff":        6,
    "manager":      7,
    "director":     8,
    "vp":           9,
    "head":         9,
    "cto":          10,
    "ceo":          10,
}

# Skills vocabulary — augment this list for your target domains
TECH_SKILLS_VOCAB = [
    "python", "java", "javascript", "typescript", "c++", "sql", "nosql",
    "react", "node", "fastapi", "django", "flask", "spring",
    "machine learning", "deep learning", "nlp", "computer vision",
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd",
    "product management", "roadmap", "user research", "a/b testing",
    "agile", "scrum", "stakeholder management", "data analysis",
    "communication", "leadership", "cross-functional",
]


# ── Main Service Class ────────────────────────────────────────────────────────

class NLPService:
    """
    Stateful service that holds the loaded SBERT model.
    Instantiated once at app startup via lifespan hook.
    """

    def __init__(self):
        self.model_name = os.getenv("SBERT_MODEL", "all-MiniLM-L6-v2")
        self.sbert: SentenceTransformer | None = None
        self.lemmatizer = WordNetLemmatizer()
        self.w_keyword   = float(os.getenv("WEIGHT_KEYWORD",   "0.40"))
        self.w_semantic  = float(os.getenv("WEIGHT_SEMANTIC",  "0.40"))
        self.w_seniority = float(os.getenv("WEIGHT_SENIORITY", "0.20"))

        # Download NLTK data silently on first use
        for resource in ["stopwords", "wordnet", "punkt", "punkt_tab"]:
            try:
                nltk.data.find(f"corpora/{resource}" if resource != "punkt" else f"tokenizers/{resource}")
            except LookupError:
                nltk.download(resource, quiet=True)

        self._stop_words = set(stopwords.words("english"))

    async def warm_up(self):
        """Load the SBERT model. Called once at startup."""
        logger.info(f"Loading SBERT model: {self.model_name} …")
        self.sbert = SentenceTransformer(self.model_name)
        logger.info("SBERT model ready.")

    # ── Public entry point ────────────────────────────────────────────────────

    def analyse(self, resume_text: str, jd_text: str) -> AnalysisResponse:
        """
        Run the full analysis pipeline and return a structured response.
        """
        t_start = time.time()
        scan_id = str(uuid.uuid4())

        # 1. Clean & tokenise
        resume_clean = self._clean(resume_text)
        jd_clean     = self._clean(jd_text)

        # 2. Extract JD keywords via TF-IDF
        jd_keywords: List[Tuple[str, float]] = self._extract_keywords(jd_clean, top_n=40)

        # 3. Keyword overlap score
        keyword_score, skill_matches = self._keyword_score(resume_clean, jd_keywords)

        # 4. Semantic similarity score
        semantic_score = self._semantic_score(resume_text, jd_text)

        # 5. Seniority alignment
        seniority_score = self._seniority_score(resume_text, jd_text)

        # 6. Composite fit score
        fit_score = (
            self.w_keyword   * keyword_score  +
            self.w_semantic  * semantic_score +
            self.w_seniority * seniority_score
        )
        fit_score = round(min(max(fit_score, 0), 100), 1)

        # 7. Keyword heatmap
        heatmap = self._build_heatmap(resume_clean, jd_keywords[:30])

        # 8. Bullet weakness + rewrite suggestions
        suggestions = self._rewrite_suggestions(resume_text, jd_text, top_n=3)

        elapsed_ms = int((time.time() - t_start) * 1000)

        return AnalysisResponse(
            scan_id=scan_id,
            fit_score=fit_score,
            fit_band=self._band(fit_score),
            score_breakdown=ScoreBreakdown(
                keyword_score=round(keyword_score, 1),
                semantic_score=round(semantic_score, 1),
                seniority_score=round(seniority_score, 1),
            ),
            matched_skills=[s for s in skill_matches if s.found_in_resume],
            missing_skills=[s for s in skill_matches if not s.found_in_resume],
            keyword_heatmap=heatmap,
            rewrite_suggestions=suggestions,
            processing_time_ms=elapsed_ms,
        )

    # ── Step 1: Text cleaning ─────────────────────────────────────────────────

    def _clean(self, text: str) -> str:
        """Lowercase, remove punctuation, stop-words, lemmatize."""
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        tokens = text.split()
        tokens = [self.lemmatizer.lemmatize(t) for t in tokens if t not in self._stop_words and len(t) > 2]
        return " ".join(tokens)

    # ── Step 2: Keyword extraction ────────────────────────────────────────────

    def _extract_keywords(self, jd_clean: str, top_n: int = 40) -> List[Tuple[str, float]]:
        """
        Use TF-IDF (single-document mode) to rank tokens in the JD.
        Also include any explicit tech skills from our vocabulary.
        """
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=200)
        try:
            tfidf_matrix = vectorizer.fit_transform([jd_clean])
        except ValueError:
            return []

        feature_names = vectorizer.get_feature_names_out()
        scores        = tfidf_matrix.toarray()[0]
        ranked        = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)

        # Merge with known skill vocab (give them a floor weight)
        vocab_hits = {
            skill: 0.3
            for skill in TECH_SKILLS_VOCAB
            if skill in jd_clean
        }

        combined: dict[str, float] = {}
        for word, score in ranked[:top_n]:
            combined[word] = score
        for skill, score in vocab_hits.items():
            if skill not in combined:
                combined[skill] = score

        return sorted(combined.items(), key=lambda x: x[1], reverse=True)[:top_n]

    # ── Step 3: Keyword overlap ───────────────────────────────────────────────

    def _keyword_score(
        self, resume_clean: str, jd_keywords: List[Tuple[str, float]]
    ) -> Tuple[float, List[SkillMatch]]:
        """
        Weighted keyword match: sum of TF-IDF weights for keywords
        found in resume / sum of all JD keyword weights → 0–100.
        """
        if not jd_keywords:
            return 50.0, []

        total_weight  = sum(w for _, w in jd_keywords)
        matched_weight = 0.0
        skill_matches: List[SkillMatch] = []

        for keyword, weight in jd_keywords:
            found = keyword in resume_clean
            if found:
                matched_weight += weight
            skill_matches.append(SkillMatch(
                skill=keyword,
                found_in_resume=found,
                weight=round(weight / total_weight, 3),
            ))

        score = (matched_weight / total_weight) * 100 if total_weight > 0 else 0.0
        return min(score, 100.0), skill_matches

    # ── Step 4: Semantic similarity ───────────────────────────────────────────

    def _semantic_score(self, resume_text: str, jd_text: str) -> float:
        """
        Encode both texts as SBERT embeddings and compute cosine similarity.
        Returns a 0–100 score.

        We split the resume into chunks (one per ~300 chars) and take the
        max similarity across chunks — this avoids diluting the signal with
        unrelated resume sections.
        """
        if self.sbert is None:
            logger.warning("SBERT not loaded — returning 50.0 for semantic score")
            return 50.0

        # Chunk the resume so long resumes don't get averaged out
        chunks = self._chunk_text(resume_text, max_chars=400)
        if not chunks:
            return 0.0

        jd_embedding     = self.sbert.encode([jd_text])
        chunk_embeddings = self.sbert.encode(chunks)

        similarities = cosine_similarity(chunk_embeddings, jd_embedding).flatten()
        best_sim     = float(np.max(similarities))

        # cosine sim is 0–1; scale to 0–100
        return round(best_sim * 100, 2)

    def _chunk_text(self, text: str, max_chars: int = 400) -> List[str]:
        """Split text into ~max_chars chunks at sentence boundaries."""
        sentences = re.split(r"(?<=[.!?\n])\s+", text.strip())
        chunks, current = [], ""
        for sent in sentences:
            if len(current) + len(sent) < max_chars:
                current += " " + sent
            else:
                if current.strip():
                    chunks.append(current.strip())
                current = sent
        if current.strip():
            chunks.append(current.strip())
        return chunks or [text[:max_chars]]

    # ── Step 5: Seniority alignment ───────────────────────────────────────────

    def _seniority_score(self, resume_text: str, jd_text: str) -> float:
        """
        Extract seniority signals from both texts.
        Penalise over-qualification and under-qualification symmetrically.
        Returns 0–100.
        """
        resume_level = self._detect_seniority(resume_text)
        jd_level     = self._detect_seniority(jd_text)

        # No signal detected → neutral score
        if resume_level is None or jd_level is None:
            return 75.0

        diff = abs(resume_level - jd_level)
        # 0 diff → 100, 1 diff → 80, 2 diff → 55, 3+ diff → 30
        score_map = {0: 100.0, 1: 80.0, 2: 55.0}
        return score_map.get(diff, 30.0)

    def _detect_seniority(self, text: str) -> int | None:
        text_lower = text.lower()
        for label, level in sorted(SENIORITY_LEVELS.items(), key=lambda x: -x[1]):
            if re.search(rf"\b{re.escape(label)}\b", text_lower):
                return level
        return None

    # ── Step 6: Fit band ─────────────────────────────────────────────────────

    @staticmethod
    def _band(score: float) -> str:
        if score >= 70:
            return "strong"
        elif score >= 45:
            return "moderate"
        return "weak"

    # ── Step 7: Keyword heatmap ───────────────────────────────────────────────

    def _build_heatmap(
        self, resume_clean: str, jd_keywords: List[Tuple[str, float]]
    ) -> List[KeywordHeatmapEntry]:
        max_w = max((w for _, w in jd_keywords), default=1.0)
        return [
            KeywordHeatmapEntry(
                word=kw,
                relevance=round((w / max_w) * (1.0 if kw in resume_clean else 0.4), 3),
            )
            for kw, w in jd_keywords
        ]

    # ── Step 8: Rewrite suggestions ───────────────────────────────────────────

    def _rewrite_suggestions(
        self, resume_text: str, jd_text: str, top_n: int = 3
    ) -> List[BulletSuggestion]:
        """
        1. Extract resume bullet points (lines starting with - or •).
        2. Rank by semantic similarity to JD (lowest = weakest).
        3. Generate an improved version for each weak bullet.
        """
        bullets = self._extract_bullets(resume_text)
        if not bullets or self.sbert is None:
            return []

        jd_emb      = self.sbert.encode([jd_text])
        bullet_embs = self.sbert.encode(bullets)
        sims        = cosine_similarity(bullet_embs, jd_emb).flatten()

        # Pick the weakest bullets (lowest similarity)
        weak_indices = np.argsort(sims)[:top_n]

        suggestions = []
        for idx in weak_indices:
            original = bullets[idx]
            improved, reason = self._improve_bullet(original, jd_text, float(sims[idx]))
            suggestions.append(BulletSuggestion(
                original=original,
                improved=improved,
                reason=reason,
            ))
        return suggestions

    def _extract_bullets(self, resume_text: str) -> List[str]:
        """Return non-empty lines that look like bullet points."""
        bullets = []
        for line in resume_text.splitlines():
            line = line.strip()
            # Match lines starting with a bullet character or a dash
            if re.match(r"^[-•*–\u2022]\s+.{20,}", line):
                clean = re.sub(r"^[-•*–\u2022]\s+", "", line)
                bullets.append(clean)
        return bullets

    def _improve_bullet(
        self, bullet: str, jd_text: str, sim_score: float
    ) -> Tuple[str, str]:
        """
        Rule-based bullet improvement.
        In production, swap this for an LLM call (see llm_service.py).

        Strategy:
        - If no quantified result → add a placeholder metric
        - If no action verb → prepend a strong verb
        - If passive voice → convert to active
        """
        improved = bullet
        reason_parts = []

        # Check for metrics
        has_metric = bool(re.search(r"\d+[%x$kmb]|\d+ (users|teams|people|hours|days)", bullet, re.I))
        if not has_metric:
            improved  = improved.rstrip(".") + ", improving team efficiency by ~X%."
            reason_parts.append("Added quantified outcome — recruiters scan for numbers first")

        # Check for strong action verb at start
        strong_verbs = [
            "built", "developed", "led", "designed", "implemented",
            "architected", "shipped", "launched", "drove", "reduced",
            "increased", "optimised", "automated", "created", "delivered",
        ]
        first_word = improved.split()[0].lower().rstrip(",")
        if first_word not in strong_verbs:
            improved  = "Delivered " + improved[0].lower() + improved[1:]
            reason_parts.append("Started with a strong action verb for scannability")

        # Surface JD alignment hint
        if sim_score < 0.35:
            reason_parts.append(
                "Low semantic alignment with JD — consider adding role-relevant keywords from the job description"
            )

        reason = "; ".join(reason_parts) if reason_parts else "Minor phrasing improvements for clarity"
        return improved, reason
