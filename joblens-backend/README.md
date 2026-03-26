# JobLens Backend

AI-powered resume & job-fit analyser — FastAPI + NLP backend.

---

## Architecture

```
joblens-backend/
├── main.py                      # FastAPI app factory + lifespan
├── requirements.txt
├── .env.example                 # Copy to .env and fill in values
├── app/
│   ├── routers/
│   │   ├── analysis.py          # POST /analyse/text  |  POST /analyse/upload
│   │   └── health.py            # GET /health
│   ├── services/
│   │   ├── nlp_service.py       # ★ Core NLP pipeline (TF-IDF + SBERT)
│   │   └── llm_service.py       # Optional: Claude API for AI rewrites
│   ├── models/
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── utils/
│   │   └── pdf_parser.py        # PyMuPDF PDF → plain text
│   └── db.py                    # Async MongoDB (Motor)
└── tests/
    └── test_nlp_service.py      # Unit tests (no network, SBERT mocked)
```

---

## NLP Pipeline (how the fit score works)

```
Resume text + JD text
        │
        ▼
  1. Clean & Tokenise  ──── NLTK (lowercase, remove stopwords, lemmatize)
        │
        ▼
  2. Extract JD Keywords ── TF-IDF (top 40 unigrams/bigrams)
        │                    + known tech skill vocabulary
        ▼
  3. Keyword Score ─────── Weighted intersection (found in resume?)      → 0–100
        │
        ▼
  4. Semantic Score ──────  Sentence-Transformers (all-MiniLM-L6-v2)     → 0–100
        │                   Chunk resume → cosine similarity vs JD
        ▼
  5. Seniority Score ────── Regex detect level in both texts             → 0–100
        │
        ▼
  6. Fit Score ──────────── 40% keyword + 40% semantic + 20% seniority   → 0–100
        │
        ▼
  7. Keyword Heatmap ─────── Top 30 JD keywords + relevance per word
        │
        ▼
  8. Rewrite Suggestions ─── Rank resume bullets by sim to JD → improve weakest 3
```

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo>
cd joblens-backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set MONGO_URI and optionally ANTHROPIC_API_KEY
```

### 3. Run MongoDB (Docker)

```bash
docker run -d -p 27017:27017 --name joblens-mongo mongo:7
```

### 4. Start the server

```bash
python main.py
# or
uvicorn main:app --reload
```

Server runs on **http://localhost:8000**

Interactive API docs: **http://localhost:8000/docs**

---

## API Reference

### `POST /api/v1/analyse/text`
```json
{
  "resume_text": "...",
  "jd_text": "..."
}
```

### `POST /api/v1/analyse/upload`
Form data:
- `resume_pdf` — PDF file
- `jd_text` — plain text string

### `GET /api/v1/scans/{scan_id}`
Returns a previously saved scan.

### Sample Response
```json
{
  "scan_id": "uuid-here",
  "fit_score": 73.4,
  "fit_band": "strong",
  "score_breakdown": {
    "keyword_score": 78.2,
    "semantic_score": 71.5,
    "seniority_score": 80.0
  },
  "matched_skills": [
    { "skill": "python", "found_in_resume": true, "weight": 0.08 }
  ],
  "missing_skills": [
    { "skill": "model validation", "found_in_resume": false, "weight": 0.06 }
  ],
  "keyword_heatmap": [...],
  "rewrite_suggestions": [
    {
      "original": "Worked on the backend system.",
      "improved": "Delivered backend system improvements, reducing latency by ~X%.",
      "reason": "Added quantified outcome; started with strong action verb"
    }
  ],
  "processing_time_ms": 312
}
```

---

## Run Tests

```bash
pytest tests/ -v
```

Tests mock the SBERT model — no network or GPU required.

---

## Upgrading Bullet Rewrites to AI-Powered

1. Add `ANTHROPIC_API_KEY=your_key` to `.env`
2. In `nlp_service.py`, replace `_improve_bullet(...)` calls with:
   ```python
   from app.services.llm_service import LLMService
   llm = LLMService()
   improved, reason = await llm.rewrite_bullet(bullet, jd_text)
   ```

---

## Deployment (Render.com — Free Tier)

```yaml
# render.yaml
services:
  - type: web
    name: joblens-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGO_URI
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
```
