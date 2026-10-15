"""Application Settings and Configuration.

Loads environment variables from .env or defaults, configures CORS,
database URL, upload directories, and ML model locations.
"""

from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    APP_NAME: str = "Food Quality Classification API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./food_quality.db"

    # ML & Storage Paths
    MODELS_DIR: str = str(PROJECT_ROOT / "ml" / "models")
    UPLOAD_DIR: str = str(BACKEND_DIR / "uploads")
    DEFAULT_MODEL: str = "best"

    # Upload Constraints
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: Union[str, List[str]] = ["jpg", "jpeg", "png", "webp", "bmp"]
    PERSIST_PREDICTION_IMAGES: bool = True

    # Authentication & Security
    # Default is for local development only. Production must configure JWT_SECRET_KEY via environment variable.
    JWT_SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    RESET_TOKEN_EXPIRE_MINUTES: int = 30     # 30 minutes

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("JWT_SECRET_KEY", mode="after")
    @classmethod
    def validate_jwt_secret_key(cls, v: str) -> str:
        key = v.strip() if v else ""
        if len(key) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters long for secure HS256 signing."
            )
        return key

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        import json
        if isinstance(v, str):
            clean = v.strip()
            if clean.startswith("[") and clean.endswith("]"):
                try:
                    parsed = json.loads(clean)
                    return [str(i).strip().rstrip("/") for i in parsed if str(i).strip()]
                except Exception:
                    pass
            return [i.strip().rstrip("/") for i in clean.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip().rstrip("/") for i in v if str(i).strip()]
        return list(v)

    @field_validator("ALLOWED_EXTENSIONS", mode="after")
    @classmethod
    def assemble_allowed_extensions(cls, v: Union[str, List[str]]) -> List[str]:
        import json
        if isinstance(v, str):
            clean = v.strip()
            if clean.startswith("[") and clean.endswith("]"):
                try:
                    return json.loads(clean)
                except Exception:
                    pass
            return [i.strip().lstrip(".") for i in clean.split(",") if i.strip()]
        elif isinstance(v, list):
            return [i.strip().lstrip(".") for i in v]
        return list(v)

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def models_path(self) -> Path:
        p = Path(self.MODELS_DIR)
        return p if p.is_absolute() else (BACKEND_DIR / p).resolve()

    @property
    def uploads_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        return p if p.is_absolute() else (BACKEND_DIR / p).resolve()


settings = Settings()
