from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql://yolustu_user:yolustu_password@127.0.0.1:5432/yolustu_db"
    SECRET_KEY: str = "yolustu-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    REDIS_URL: str = "redis://127.0.0.1:6379/0"


settings = Settings()
