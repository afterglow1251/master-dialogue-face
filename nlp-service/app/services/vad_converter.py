import json
from pathlib import Path

from app.config import settings
from app.models.schemas import VADValues

_VAD_MAPPINGS_PATH = Path(__file__).parent.parent / "data" / "vad_mappings.json"

_vad_mappings: dict[str, dict[str, float]] = {}


def load_vad_mappings() -> None:
    with open(_VAD_MAPPINGS_PATH) as f:
        raw = json.load(f)
    _vad_mappings.clear()
    _vad_mappings.update({k: v for k, v in raw.items() if not k.startswith("_")})


def convert_to_vad(probabilities: dict[str, float]) -> VADValues:
    """Convert categorical emotion probabilities to VAD space.

    Formula:
        V = sum(p_i * V_i) / sum(p_i)
        A = sum(p_i * A_i) / sum(p_i)
        D = sum(p_i * D_i) / sum(p_i)

    where p_i is the probability of emotion i (excluding neutral),
    and V_i, A_i, D_i are VAD values from the NRC VAD Lexicon v1 (0-1 scale).

    Reference:
        Mohammad, S.M. (2018). Obtaining Reliable Human Ratings of Valence,
        Arousal, and Dominance for 20,000 English Words. ACL 2018.
    """
    valence = arousal = dominance = total = 0.0

    for emotion, p in probabilities.items():
        if emotion in _vad_mappings:
            vad = _vad_mappings[emotion]
            total += p
            valence += p * vad["valence"]  
            arousal += p * vad["arousal"]  
            dominance += p * vad["dominance"]  

    if total == 0:
        return VADValues(
            valence=settings.default_valence,
            arousal=settings.default_arousal,
            dominance=settings.default_dominance,
        )

    valence /= total 
    arousal /= total 
    dominance /= total 

    return VADValues(valence=valence, arousal=arousal, dominance=dominance)
