"""
JobLens Backend — main.py
Entry point. Mounts all routers and configures middleware.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analysis, health
from app.services.nlp_service import NLPService
from app.db import connect_db, close_db


# ── Lifespan: startup / shutdown ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up the sentence-transformer model once at startup
    # (first load downloads ~80 MB; subsequent runs use cache)
    app.state.nlp = NLPService()
    await app.state.nlp.warm_up()
    await connect_db()
    yield
    await close_db()


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="JobLens API",
        description="AI-powered resume & job-fit analyser",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://joblens.vercel.app"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(analysis.router, prefix="/api/v1")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
