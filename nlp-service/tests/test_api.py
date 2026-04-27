"""Integration tests for the /api/v1 endpoints.

These tests load the real ML model and run full inference.
Mark: @pytest.mark.integration — skip with `pytest -m "not integration"`.
"""

import pytest
from fastapi.testclient import TestClient

from app.services.vad_converter import _vad_mappings

pytestmark = pytest.mark.integration

ANALYZE_URL = "/api/v1/analyze"
HEALTH_URL = "/api/v1/health"


# -- Health endpoint ----------------------------------------------------------


class TestHealthEndpoint:
    def test_returns_200(self, client: TestClient) -> None:
        resp = client.get(HEALTH_URL)
        assert resp.status_code == 200

    def test_model_loaded(self, client: TestClient) -> None:
        data = client.get(HEALTH_URL).json()
        assert data["status"] == "ok"
        assert data["model_loaded"] is True
        assert data["device"] == "cpu"


# -- Analyze endpoint: input validation --------------------------------------


class TestAnalyzeInputValidation:
    def test_empty_text_returns_422(self, client: TestClient) -> None:
        resp = client.post(ANALYZE_URL, json={"text": ""})
        assert resp.status_code == 422

    def test_missing_text_returns_422(self, client: TestClient) -> None:
        resp = client.post(ANALYZE_URL, json={})
        assert resp.status_code == 422

    def test_missing_body_returns_422(self, client: TestClient) -> None:
        resp = client.post(ANALYZE_URL)
        assert resp.status_code == 422


# -- Analyze endpoint: response structure ------------------------------------


class TestAnalyzeResponseStructure:
    @pytest.fixture()
    def response_data(self, client: TestClient) -> dict:
        resp = client.post(ANALYZE_URL, json={"text": "I feel great today"})
        assert resp.status_code == 200
        return resp.json()

    def test_top_level_fields(self, response_data: dict) -> None:
        assert response_data["text"] == "I feel great today"
        assert isinstance(response_data["processing_time_ms"], float)
        assert "emotions" in response_data

    def test_emotions_has_expected_keys(self, response_data: dict) -> None:
        emotions = response_data["emotions"]
        assert "categories" in emotions
        assert "vad" in emotions
        assert "top_emotions" in emotions

    def test_categories_has_27_emotions(self, response_data: dict) -> None:
        categories = response_data["emotions"]["categories"]
        assert len(categories) == 27

    def test_neutral_excluded_from_categories(self, response_data: dict) -> None:
        categories = response_data["emotions"]["categories"]
        assert "neutral" not in categories

    def test_categories_match_vad_mapping_keys(self, response_data: dict) -> None:
        categories = response_data["emotions"]["categories"]
        assert set(categories.keys()) == set(_vad_mappings.keys())

    def test_vad_has_three_dimensions(self, response_data: dict) -> None:
        vad = response_data["emotions"]["vad"]
        assert set(vad.keys()) == {"valence", "arousal", "dominance"}

    def test_top_emotions_max_5(self, response_data: dict) -> None:
        top = response_data["emotions"]["top_emotions"]
        assert len(top) <= 5

    def test_top_emotions_have_name_and_probability(self, response_data: dict) -> None:
        for entry in response_data["emotions"]["top_emotions"]:
            assert "name" in entry
            assert "probability" in entry


# -- Analyze endpoint: value ranges ------------------------------------------


class TestAnalyzeValueRanges:
    @pytest.fixture()
    def response_data(self, client: TestClient) -> dict:
        resp = client.post(ANALYZE_URL, json={"text": "This is a test"})
        return resp.json()

    def test_probabilities_in_unit_interval(self, response_data: dict) -> None:
        for emotion, prob in response_data["emotions"]["categories"].items():
            assert 0.0 <= prob <= 1.0, f"{emotion} = {prob} out of [0, 1]"

    def test_vad_valence_in_unit_interval(self, response_data: dict) -> None:
        v = response_data["emotions"]["vad"]["valence"]
        assert 0.0 <= v <= 1.0

    def test_vad_arousal_in_unit_interval(self, response_data: dict) -> None:
        a = response_data["emotions"]["vad"]["arousal"]
        assert 0.0 <= a <= 1.0

    def test_vad_dominance_in_unit_interval(self, response_data: dict) -> None:
        d = response_data["emotions"]["vad"]["dominance"]
        assert 0.0 <= d <= 1.0

    def test_top_emotions_sorted_descending(self, response_data: dict) -> None:
        probs = [
            e["probability"]
            for e in response_data["emotions"]["top_emotions"]
        ]
        assert probs == sorted(probs, reverse=True)

    def test_processing_time_positive(self, response_data: dict) -> None:
        assert response_data["processing_time_ms"] > 0


# -- Analyze endpoint: semantic correctness ----------------------------------


class TestAnalyzeSemanticCorrectness:
    def test_happy_text_top_emotion_is_positive(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={"text": "I am incredibly happy and excited about this!"},
        )
        top_name = resp.json()["emotions"]["top_emotions"][0]["name"]
        assert top_name in {"joy", "excitement", "optimism", "admiration", "amusement"}

    def test_happy_text_high_valence(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={"text": "I am incredibly happy and excited about this!"},
        )
        valence = resp.json()["emotions"]["vad"]["valence"]
        assert valence > 0.7

    def test_angry_text_has_anger_in_top(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={"text": "I am absolutely furious and enraged right now!"},
        )
        top_names = [
            e["name"] for e in resp.json()["emotions"]["top_emotions"]
        ]
        assert "anger" in top_names

    def test_sad_text_low_valence(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={"text": "I feel so sad and hopeless, everything is terrible."},
        )
        valence = resp.json()["emotions"]["vad"]["valence"]
        assert valence < 0.4

    def test_fearful_text_high_arousal(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={"text": "I'm terrified, something terrible is about to happen!"},
        )
        arousal = resp.json()["emotions"]["vad"]["arousal"]
        assert arousal > 0.5


# -- Analyze endpoint: context support ---------------------------------------


class TestAnalyzeWithContext:
    def test_context_accepted(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={
                "text": "Thank you!",
                "context": ["I helped you fix the bug"],
            },
        )
        assert resp.status_code == 200

    def test_multiple_context_turns(self, client: TestClient) -> None:
        resp = client.post(
            ANALYZE_URL,
            json={
                "text": "That makes me happy",
                "context": [
                    "How was your day?",
                    "It was wonderful, I got promoted!",
                ],
            },
        )
        assert resp.status_code == 200
        assert len(resp.json()["emotions"]["categories"]) == 27

    def test_empty_context_same_as_no_context(self, client: TestClient) -> None:
        text = "I feel neutral about this"

        resp_no_ctx = client.post(ANALYZE_URL, json={"text": text})
        resp_empty_ctx = client.post(
            ANALYZE_URL, json={"text": text, "context": []}
        )

        cats_no = resp_no_ctx.json()["emotions"]["categories"]
        cats_empty = resp_empty_ctx.json()["emotions"]["categories"]
        assert cats_no == cats_empty
