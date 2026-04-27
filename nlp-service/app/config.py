from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_name: str = "SamLowe/roberta-base-go_emotions"
    device: str = "cpu"
    max_length: int = 512
    top_k_emotions: int = 5
    nlp_port: int = 8000
    cors_origins: list[str] = ["*"]

    # Default VAD for zero-probability input (neutral resting state)
    default_valence: float = 0.5
    default_arousal: float = 0.3
    default_dominance: float = 0.5

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
