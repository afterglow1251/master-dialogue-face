import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.vad_converter import load_vad_mappings


@pytest.fixture(autouse=True)
def _vad_mappings() -> None:
    """Load VAD mappings before every test that needs them."""
    load_vad_mappings()


@pytest.fixture(scope="module")
def client() -> TestClient:
    """FastAPI TestClient with full lifespan (loads model + VAD mappings)."""
    with TestClient(app) as c:
        yield c
