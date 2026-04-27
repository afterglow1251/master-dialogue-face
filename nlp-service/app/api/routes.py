import asyncio

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from app.services.emotion_analyzer import emotion_analyzer

router = APIRouter(prefix="/api/v1")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_emotions(request: AnalyzeRequest) -> AnalyzeResponse:
    if not emotion_analyzer.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded yet")

    return await asyncio.to_thread(
        emotion_analyzer.analyze, text=request.text, context=request.context
    )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok" if emotion_analyzer.is_loaded else "loading",
        model_loaded=emotion_analyzer.is_loaded,
        device=settings.device,
    )
