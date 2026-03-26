from fastapi import APIRouter, Request

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Health check")
async def health(request: Request):
    sbert_loaded = request.app.state.nlp.sbert is not None
    return {
        "status": "ok",
        "sbert_model": request.app.state.nlp.model_name,
        "sbert_loaded": sbert_loaded,
    }
