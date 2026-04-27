"""Unit tests for Pydantic schema validation."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EmotionProbabilities,
    EmotionScore,
    HealthResponse,
    VADValues,
)


class TestVADValues:
    """Validate VAD value boundaries (NRC v1: 0-1 scale)."""

    def test_valid_mid_range(self) -> None:
        vad = VADValues(valence=0.5, arousal=0.5, dominance=0.5)
        assert vad.valence == 0.5

    def test_valid_zeros(self) -> None:
        vad = VADValues(valence=0.0, arousal=0.0, dominance=0.0)
        assert vad.valence == 0.0

    def test_valid_ones(self) -> None:
        vad = VADValues(valence=1.0, arousal=1.0, dominance=1.0)
        assert vad.valence == 1.0

    def test_negative_valence_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VADValues(valence=-0.1, arousal=0.5, dominance=0.5)

    def test_valence_above_one_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VADValues(valence=1.01, arousal=0.5, dominance=0.5)

    def test_negative_arousal_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VADValues(valence=0.5, arousal=-0.01, dominance=0.5)

    def test_arousal_above_one_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VADValues(valence=0.5, arousal=1.1, dominance=0.5)

    def test_negative_dominance_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VADValues(valence=0.5, arousal=0.5, dominance=-0.5)

    def test_dominance_above_one_rejected(self) -> None:
        with pytest.raises(ValidationError):
            VADValues(valence=0.5, arousal=0.5, dominance=1.001)


class TestAnalyzeRequest:
    """Validate request input constraints."""

    def test_valid_simple_text(self) -> None:
        req = AnalyzeRequest(text="Hello world")
        assert req.text == "Hello world"
        assert req.context == []

    def test_valid_with_context(self) -> None:
        req = AnalyzeRequest(text="Great!", context=["We won"])
        assert req.context == ["We won"]

    def test_empty_text_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AnalyzeRequest(text="")

    def test_whitespace_only_text_accepted(self) -> None:
        """Single space satisfies min_length=1 (it's a character count)."""
        req = AnalyzeRequest(text=" ")
        assert req.text == " "

    def test_text_at_max_length(self) -> None:
        text = "a" * 5000
        req = AnalyzeRequest(text=text)
        assert len(req.text) == 5000

    def test_text_exceeds_max_length_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AnalyzeRequest(text="a" * 5001)

    def test_missing_text_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AnalyzeRequest()  # type: ignore[call-arg]

    def test_context_defaults_to_empty_list(self) -> None:
        req = AnalyzeRequest(text="hi")
        assert req.context == []

    def test_multiple_context_entries(self) -> None:
        ctx = ["First message", "Second message", "Third message"]
        req = AnalyzeRequest(text="Reply", context=ctx)
        assert len(req.context) == 3


class TestEmotionScore:
    def test_valid(self) -> None:
        score = EmotionScore(name="joy", probability=0.95)
        assert score.name == "joy"
        assert score.probability == 0.95

    def test_zero_probability(self) -> None:
        score = EmotionScore(name="grief", probability=0.0)
        assert score.probability == 0.0


class TestEmotionProbabilities:
    def test_valid_structure(self) -> None:
        ep = EmotionProbabilities(
            categories={"joy": 0.9, "sadness": 0.1},
            vad=VADValues(valence=0.8, arousal=0.7, dominance=0.6),
            top_emotions=[EmotionScore(name="joy", probability=0.9)],
        )
        assert ep.categories["joy"] == 0.9
        assert len(ep.top_emotions) == 1


class TestAnalyzeResponse:
    def test_valid_structure(self) -> None:
        resp = AnalyzeResponse(
            text="Hello",
            emotions=EmotionProbabilities(
                categories={"joy": 0.9},
                vad=VADValues(valence=0.8, arousal=0.7, dominance=0.6),
                top_emotions=[EmotionScore(name="joy", probability=0.9)],
            ),
            processing_time_ms=12.34,
        )
        assert resp.text == "Hello"
        assert resp.processing_time_ms == 12.34


class TestHealthResponse:
    def test_loaded(self) -> None:
        h = HealthResponse(status="ok", model_loaded=True, device="cpu")
        assert h.model_loaded is True

    def test_loading(self) -> None:
        h = HealthResponse(status="loading", model_loaded=False, device="cpu")
        assert h.model_loaded is False
