"""
app/services/llm_service.py

Optional LLM-powered bullet rewrite suggestions.
Falls back gracefully if ANTHROPIC_API_KEY is not set.

Swap `_improve_bullet` in nlp_service.py with `LLMService.rewrite_bullet`
once you have an API key.
"""
from __future__ import annotations
import os
import logging
import httpx

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a professional resume coach helping students improve their resumes for specific job descriptions.
When given a weak resume bullet and a job description, rewrite the bullet to:
1. Start with a strong action verb
2. Include a quantified outcome (use placeholder like ~X% if no real number exists)
3. Incorporate 1-2 relevant keywords from the JD naturally
4. Stay under 25 words
5. Sound genuine, not generic

Respond with JSON only:
{"improved": "<rewritten bullet>", "reason": "<one sentence explaining the key change>"}"""


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.model   = os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001")
        self.enabled = bool(self.api_key)
        if not self.enabled:
            logger.info("LLMService: No API key found — rule-based fallback will be used.")

    async def rewrite_bullet(self, bullet: str, jd_text: str) -> tuple[str, str]:
        """
        Call Claude to rewrite a weak resume bullet.
        Returns (improved_bullet, reason).
        Falls back to the original bullet if LLM is unavailable.
        """
        if not self.enabled:
            return bullet, "LLM not configured — set ANTHROPIC_API_KEY to enable AI suggestions."

        prompt = f"""Job Description (excerpt):
{jd_text[:800]}

Weak resume bullet:
{bullet}

Rewrite this bullet to better match the JD."""

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 256,
                        "system": SYSTEM_PROMPT,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                response.raise_for_status()
                data    = response.json()
                content = data["content"][0]["text"]

                import json
                parsed = json.loads(content)
                return parsed["improved"], parsed["reason"]

        except Exception as e:
            logger.warning(f"LLM rewrite failed: {e}. Using original bullet.")
            return bullet, "Could not generate AI suggestion — check LLM configuration."
