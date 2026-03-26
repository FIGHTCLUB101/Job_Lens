# JobLens Frontend

Dark-mode React dashboard for the JobLens AI resume analyser.

## Stack
- React 18 + Create React App
- `react-dropzone` — PDF drag-and-drop upload
- `recharts` — available for future charts
- CSS custom properties (no Tailwind, no extra deps)

## Structure

```
src/
├── App.jsx                    # Root — phase machine (input → loading → results)
├── index.css                  # Design tokens, global styles, keyframes
├── api/
│   └── client.js              # axios wrapper + getMockResult()
└── components/
    ├── Header.jsx             # Sticky nav with logo
    ├── InputForm.jsx          # Paste text or drag-and-drop PDF + JD input
    ├── ResultsDashboard.jsx   # Assembles all result panels
    ├── ScoreRing.jsx          # Animated SVG score ring + sub-score bars
    ├── SkillGap.jsx           # Matched / missing skills with progress bars
    ├── KeywordHeatmap.jsx     # Relevance-coloured keyword chips
    └── RewriteSuggestions.jsx # Accordion with before/after bullet rewrites
```

## Quick Start

```bash
cd joblens-frontend
npm install
npm start          # http://localhost:3000
```

The app auto-falls back to **mock data** if the backend is not running,
so you can develop the UI independently.

## Connect to Backend

```bash
# In .env (create from .env.example)
REACT_APP_API_URL=http://localhost:8000/api/v1
```

Then start the backend:
```bash
cd ../joblens-backend
python main.py
```

## Deploy to Vercel

```bash
npm run build
# Push to GitHub → import to Vercel
# Set REACT_APP_API_URL env var in Vercel project settings
```
