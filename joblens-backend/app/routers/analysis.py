"""
app/routers/analysis.py

Endpoints:
  POST /api/v1/analyse/text   — analyse resume + JD as plain text
  POST /api/v1/analyse/upload — upload resume PDF + JD text
  GET  /api/v1/scans/{scan_id} — retrieve a saved scan from MongoDB
"""
from __future__ import annotations
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.services.nlp_service import NLPService
from app.utils.pdf_parser import extract_text_from_pdf
from app.db import get_scans_collection

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Analysis"])

MAX_PDF_SIZE_MB = 5


# ── Dependency: grab NLPService from app state ────────────────────────────────
def get_nlp(request: Request) -> NLPService:
    return request.app.state.nlp


# ── POST /analyse/text ────────────────────────────────────────────────────────
@router.post(
    "/analyse/text",
    response_model=AnalysisResponse,
    summary="Analyse resume & JD as plain text",
)
async def analyse_text(
    body: AnalysisRequest,
    nlp: NLPService = Depends(get_nlp),
) -> AnalysisResponse:
    """
    Accept plain text resume + JD, run the full NLP pipeline,
    persist the result to MongoDB, and return the analysis.
    """
    result = nlp.analyse(body.resume_text, body.jd_text)
    await _save_scan(result)
    return result


# ── POST /analyse/upload ──────────────────────────────────────────────────────
@router.post(
    "/analyse/upload",
    response_model=AnalysisResponse,
    summary="Upload resume PDF + paste JD text",
)
async def analyse_upload(
    resume_pdf: Annotated[UploadFile, File(description="Resume as PDF")],
    jd_text:    Annotated[str,        Form(description="Job description text")],
    nlp: NLPService = Depends(get_nlp),
) -> AnalysisResponse:
    """
    Accept a PDF resume (uploaded file) + plain-text JD.
    Extracts text from PDF, then runs the same pipeline as /analyse/text.
    """
    # Validate file type
    if resume_pdf.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Validate file size
    file_bytes = await resume_pdf.read()
    if len(file_bytes) > MAX_PDF_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"PDF must be under {MAX_PDF_SIZE_MB} MB.")

    # Extract text
    try:
        resume_text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise HTTPException(status_code=422, detail="Could not extract text from PDF. Is it a valid, non-scanned PDF?")

    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Extracted resume text is too short. Try a text-based PDF.")

    result = nlp.analyse(resume_text, jd_text)
    await _save_scan(result)
    return result


# ── GET /scans/{scan_id} ──────────────────────────────────────────────────────
@router.get(
    "/scans/{scan_id}",
    response_model=AnalysisResponse,
    summary="Retrieve a saved scan by ID",
)
async def get_scan(scan_id: str) -> AnalysisResponse:
    collection = await get_scans_collection()
    doc = await collection.find_one({"scan_id": scan_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found.")
    return AnalysisResponse(**doc)


# ── Helper ────────────────────────────────────────────────────────────────────
async def _save_scan(result: AnalysisResponse) -> None:
    """Persist scan result to MongoDB. Non-blocking — swallows errors."""
    try:
        collection = await get_scans_collection()
        await collection.insert_one(result.model_dump())
    except Exception as e:
        logger.warning(f"Could not save scan to MongoDB: {e}")
