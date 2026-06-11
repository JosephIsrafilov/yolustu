import logging
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_DIR / "uploads"


def normalize_database_url(url: str) -> str:
    normalized = url.strip()
    if normalized.startswith("postgres://"):
        return normalized.replace("postgres://", "postgresql://", 1)
    return normalized


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = (
        "postgresql://yolustu_user:yolustu_password@127.0.0.1:5433/yolustu_db"
    )
    DIRECT_DATABASE_URL: str | None = None
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    PAYMENT_PROVIDER: str = "mock"
    PAYMENT_CURRENCY: str = "AZN"
    PLATFORM_FEE_PERCENT: int = 10
    PAYMENT_SUCCESS_URL: str = ""
    PAYMENT_CANCEL_URL: str = ""
    PAYRIFF_BASE_URL: str = ""
    PAYRIFF_MERCHANT_ID: str = ""
    PAYRIFF_SECRET_KEY: str = ""
    KAPITAL_BASE_URL: str = ""
    KAPITAL_MERCHANT_ID: str = ""
    KAPITAL_SECRET_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    NVIDIA_API_KEY: str = ""
    ENVIRONMENT: str = "development"

    # Cookie policy. When the frontend and backend are served from different
    # sites in production (e.g. app.example.com + api.example.com), browsers
    # require SameSite=None; Secure for the auth cookies to be sent on API
    # calls. Set COOKIE_SAMESITE=none in that deployment.
    COOKIE_SAMESITE: str = "lax"  # lax | strict | none

    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "yolmatessupport@gmail.com"


settings = Settings()  # type: ignore[call-arg]
settings.DATABASE_URL = normalize_database_url(settings.DATABASE_URL)
if settings.DIRECT_DATABASE_URL:
    settings.DIRECT_DATABASE_URL = normalize_database_url(settings.DIRECT_DATABASE_URL)

if (
    settings.ENVIRONMENT == "production"
    and settings.SECRET_KEY == "yolustu-super-secret-key"
):
    raise ValueError(
        "CRITICAL: Default SECRET_KEY is used in production. Please change it."
    )
elif settings.SECRET_KEY == "yolustu-super-secret-key":
    logging.warning("SECURITY WARNING: Default SECRET_KEY is being used.")
