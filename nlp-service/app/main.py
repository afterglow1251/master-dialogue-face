from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.services.emotion_analyzer import emotion_analyzer
from app.services.vad_converter import load_vad_mappings


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    load_vad_mappings()
    emotion_analyzer.load_model()
    yield


app = FastAPI(
    title="Emotion Analysis Service",
    description="NLP microservice for analyzing emotional context of dialogue",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
