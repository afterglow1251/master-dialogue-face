from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    context: list[str] = Field(default_factory=list)


class EmotionScore(BaseModel):
    name: str
    probability: float


class VADValues(BaseModel):
    valence: float = Field(ge=0.0, le=1.0)
    arousal: float = Field(ge=0.0, le=1.0)
    dominance: float = Field(ge=0.0, le=1.0)


class EmotionProbabilities(BaseModel):
    categories: dict[str, float]
    vad: VADValues
    top_emotions: list[EmotionScore]


class AnalyzeResponse(BaseModel):
    text: str
    emotions: EmotionProbabilities
    processing_time_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
