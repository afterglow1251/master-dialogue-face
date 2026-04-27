import time

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    PreTrainedModel,
    PreTrainedTokenizerBase,
)

from app.config import settings
from app.models.schemas import (
    AnalyzeResponse,
    EmotionProbabilities,
    EmotionScore,
)
from app.services.vad_converter import convert_to_vad


class EmotionAnalyzer:
    def __init__(self) -> None:
        self._model: PreTrainedModel | None = None
        self._tokenizer: PreTrainedTokenizerBase | None = None
        self._device: torch.device = torch.device(settings.device)
        self._id2label: dict[int, str] = {}

    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._tokenizer is not None

    def load_model(self) -> None:
        self._tokenizer = AutoTokenizer.from_pretrained(settings.model_name)
        self._model = AutoModelForSequenceClassification.from_pretrained(
            settings.model_name
        )
        self._model.to(self._device)
        self._model.eval()
        self._id2label = self._model.config.id2label

    def _build_input_text(self, text: str, context: list[str]) -> str:
        if not context:
            return text
        sep = self._tokenizer.sep_token or "</s>"
        context_str = f" {sep} ".join(context)
        return f"{text} {sep} {context_str}"

    def analyze(self, text: str, context: list[str] | None = None) -> AnalyzeResponse:
        if self._model is None or self._tokenizer is None:
            raise RuntimeError("Model is not loaded. Call load_model() first.")

        start_time = time.perf_counter()

        input_text = self._build_input_text(text, context or [])

        inputs = self._tokenizer(
            input_text,
            return_tensors="pt",
            truncation=True,
            max_length=settings.max_length,
            padding=True,
        )
        inputs = inputs.to(self._device)

        with torch.no_grad():
            outputs = self._model(**inputs)
            logits = outputs.logits
            probabilities = torch.sigmoid(logits).squeeze(0).cpu().tolist()

        no_neutral_probs: dict[str, float] = {
            self._id2label[i]: prob
            for i, prob in enumerate(probabilities)
            if self._id2label[i] != "neutral"
        }

        sorted_emotions = sorted(
            no_neutral_probs.items(), key=lambda x: x[1], reverse=True
        )
        top_emotions = [
            EmotionScore(name=name, probability=prob)
            for name, prob in sorted_emotions[:settings.top_k_emotions]
        ]

        vad = convert_to_vad(no_neutral_probs)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return AnalyzeResponse(
            text=text,
            emotions=EmotionProbabilities(
                categories=no_neutral_probs,
                vad=vad,
                top_emotions=top_emotions,
            ),
            processing_time_ms=round(elapsed_ms, 2),
        )


emotion_analyzer = EmotionAnalyzer()
