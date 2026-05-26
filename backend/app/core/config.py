import logging
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_DIR / "uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = (
        "postgresql://yolustu_user:yolustu_password@127.0.0.1:5433/yolustu_db"
    )
    SECRET_KEY: str = "yolustu-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    NVIDIA_API_KEY: str = ""
    ENVIRONMENT: str = "development"


settings = Settings()

if (
    settings.ENVIRONMENT == "production"
    and settings.SECRET_KEY == "yolustu-super-secret-key"
):
    raise ValueError(
        "CRITICAL: Default SECRET_KEY is used in production. Please change it."
    )
elif settings.SECRET_KEY == "yolustu-super-secret-key":
    logging.warning("SECURITY WARNING: Default SECRET_KEY is being used.")
