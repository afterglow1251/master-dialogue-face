"""Unit tests for VAD conversion algorithm.

Tests the weighted average formula:
    V = sum(p_i * V_i) / sum(p_i)
using NRC VAD Lexicon v1 reference values.
"""

import pytest

from app.config import settings
from app.models.schemas import VADValues
from app.services.vad_converter import _vad_mappings, convert_to_vad

# --- Reference NRC VAD Lexicon v1 values for assertions ---
JOY = {"valence": 0.980, "arousal": 0.824, "dominance": 0.794}
SADNESS = {"valence": 0.052, "arousal": 0.288, "dominance": 0.164}
ANGER = {"valence": 0.167, "arousal": 0.865, "dominance": 0.657}
LOVE = {"valence": 1.000, "arousal": 0.519, "dominance": 0.673}
FEAR = {"valence": 0.073, "arousal": 0.840, "dominance": 0.293}
NERVOUSNESS = {"valence": 0.163, "arousal": 0.915, "dominance": 0.241}
SURPRISE = {"valence": 0.875, "arousal": 0.875, "dominance": 0.562}


class TestVadMappingsLoaded:
    """Verify that VAD mappings JSON is loaded correctly."""

    def test_has_27_emotions(self) -> None:
        assert len(_vad_mappings) == 27

    def test_excludes_source_metadata(self) -> None:
        assert "_source" not in _vad_mappings

    def test_each_emotion_has_three_dimensions(self) -> None:
        for emotion, vad in _vad_mappings.items():
            assert set(vad.keys()) == {"valence", "arousal", "dominance"}, (
                f"{emotion} missing VAD dimension"
            )

    def test_all_values_in_unit_range(self) -> None:
        for emotion, vad in _vad_mappings.items():
            for dim, value in vad.items():
                assert 0.0 <= value <= 1.0, (
                    f"{emotion}.{dim} = {value} out of [0, 1]"
                )

    def test_spot_check_joy(self) -> None:
        assert _vad_mappings["joy"] == JOY

    def test_spot_check_sadness(self) -> None:
        assert _vad_mappings["sadness"] == SADNESS


class TestConvertToVadSingleEmotion:
    """Single emotion: result must equal that emotion's exact VAD."""

    def test_joy(self) -> None:
        result = convert_to_vad({"joy": 1.0})
        assert result.valence == pytest.approx(JOY["valence"])
        assert result.arousal == pytest.approx(JOY["arousal"])
        assert result.dominance == pytest.approx(JOY["dominance"])

    def test_sadness(self) -> None:
        result = convert_to_vad({"sadness": 1.0})
        assert result.valence == pytest.approx(SADNESS["valence"])
        assert result.arousal == pytest.approx(SADNESS["arousal"])
        assert result.dominance == pytest.approx(SADNESS["dominance"])

    @pytest.mark.parametrize("prob", [0.01, 0.1, 0.5, 0.99])
    def test_probability_magnitude_does_not_affect_single_emotion(
        self, prob: float
    ) -> None:
        """For a single emotion, any non-zero p gives the same VAD."""
        result = convert_to_vad({"anger": prob})
        assert result.valence == pytest.approx(ANGER["valence"])
        assert result.arousal == pytest.approx(ANGER["arousal"])
        assert result.dominance == pytest.approx(ANGER["dominance"])


class TestConvertToVadWeightedAverage:
    """Verify the weighted average formula with manual calculations."""

    def test_two_emotions_equal_weight(self) -> None:
        """Equal probabilities -> arithmetic mean of the two VAD vectors."""
        result = convert_to_vad({"joy": 0.5, "sadness": 0.5})

        assert result.valence == pytest.approx(
            (JOY["valence"] + SADNESS["valence"]) / 2
        )
        assert result.arousal == pytest.approx(
            (JOY["arousal"] + SADNESS["arousal"]) / 2
        )
        assert result.dominance == pytest.approx(
            (JOY["dominance"] + SADNESS["dominance"]) / 2
        )

    def test_manual_calculation_three_emotions(self) -> None:
        """Hand-calculated weighted average for anger=0.3, joy=0.5, fear=0.2."""
        probs = {"anger": 0.3, "joy": 0.5, "fear": 0.2}
        total = 1.0

        expected_v = (
            0.3 * ANGER["valence"]
            + 0.5 * JOY["valence"]
            + 0.2 * FEAR["valence"]
        ) / total
        expected_a = (
            0.3 * ANGER["arousal"]
            + 0.5 * JOY["arousal"]
            + 0.2 * FEAR["arousal"]
        ) / total
        expected_d = (
            0.3 * ANGER["dominance"]
            + 0.5 * JOY["dominance"]
            + 0.2 * FEAR["dominance"]
        ) / total

        result = convert_to_vad(probs)
        assert result.valence == pytest.approx(expected_v)
        assert result.arousal == pytest.approx(expected_a)
        assert result.dominance == pytest.approx(expected_d)

    def test_dominant_emotion_pulls_result(self) -> None:
        """99% joy + 1% sadness -> result very close to joy."""
        result = convert_to_vad({"joy": 0.99, "sadness": 0.01})
        assert result.valence == pytest.approx(JOY["valence"], abs=0.01)
        assert result.arousal == pytest.approx(JOY["arousal"], abs=0.01)
        assert result.dominance == pytest.approx(JOY["dominance"], abs=0.01)

    def test_all_27_emotions_equal_probability(self) -> None:
        """Equal weight across all 27 -> arithmetic mean of all VAD vectors."""
        probs = {emotion: 1.0 for emotion in _vad_mappings}
        result = convert_to_vad(probs)

        expected_v = sum(v["valence"] for v in _vad_mappings.values()) / 27
        expected_a = sum(v["arousal"] for v in _vad_mappings.values()) / 27
        expected_d = sum(v["dominance"] for v in _vad_mappings.values()) / 27

        assert result.valence == pytest.approx(expected_v)
        assert result.arousal == pytest.approx(expected_a)
        assert result.dominance == pytest.approx(expected_d)


class TestConvertToVadEdgeCases:
    """Edge cases and boundary conditions."""

    def test_empty_dict_returns_default(self) -> None:
        result = convert_to_vad({})
        assert result == VADValues(
            valence=settings.default_valence,
            arousal=settings.default_arousal,
            dominance=settings.default_dominance,
        )

    def test_all_zero_probabilities_returns_default(self) -> None:
        result = convert_to_vad({"joy": 0.0, "sadness": 0.0, "anger": 0.0})
        assert result == VADValues(
            valence=settings.default_valence,
            arousal=settings.default_arousal,
            dominance=settings.default_dominance,
        )

    def test_unknown_emotion_skipped_entirely(self) -> None:
        """Unknown emotion is ignored — not added to numerator or denominator.

        Only emotions present in vad_mappings contribute to the weighted sum.
        """
        result_with_unknown = convert_to_vad({"joy": 0.5, "fake_emotion": 0.5})
        result_pure = convert_to_vad({"joy": 0.5})

        # Both should give exact joy VAD since fake_emotion is skipped
        assert result_pure.valence == pytest.approx(JOY["valence"])
        assert result_with_unknown.valence == pytest.approx(JOY["valence"])
        assert result_with_unknown.valence == pytest.approx(result_pure.valence)

    def test_very_small_probabilities(self) -> None:
        """Tiny probabilities should not cause floating-point issues."""
        result = convert_to_vad({"joy": 1e-10, "sadness": 1e-10})
        assert 0.0 <= result.valence <= 1.0
        assert 0.0 <= result.arousal <= 1.0
        assert 0.0 <= result.dominance <= 1.0

    def test_returns_vad_values_instance(self) -> None:
        result = convert_to_vad({"joy": 0.5})
        assert isinstance(result, VADValues)


class TestConvertToVadSemanticSanity:
    """Sanity checks: positive emotions -> high valence, etc."""

    def test_positive_emotions_high_valence(self) -> None:
        positive = {"joy": 0.8, "love": 0.7, "excitement": 0.6}
        result = convert_to_vad(positive)
        assert result.valence > 0.85

    def test_negative_emotions_low_valence(self) -> None:
        negative = {"sadness": 0.8, "disgust": 0.7, "fear": 0.6}
        result = convert_to_vad(negative)
        assert result.valence < 0.1

    def test_high_arousal_emotions(self) -> None:
        energetic = {"nervousness": 0.8, "anger": 0.7, "surprise": 0.6}
        result = convert_to_vad(energetic)
        assert result.arousal > 0.85

    def test_low_arousal_emotions(self) -> None:
        calm = {"relief": 0.8, "sadness": 0.7}
        result = convert_to_vad(calm)
        assert result.arousal < 0.35

    def test_result_always_within_unit_interval(self) -> None:
        """Any valid mix of emotions must produce VAD in [0, 1]."""
        import random

        random.seed(42)
        emotions = list(_vad_mappings.keys())
        for _ in range(100):
            probs = {e: random.random() for e in emotions}
            result = convert_to_vad(probs)
            assert 0.0 <= result.valence <= 1.0
            assert 0.0 <= result.arousal <= 1.0
            assert 0.0 <= result.dominance <= 1.0
