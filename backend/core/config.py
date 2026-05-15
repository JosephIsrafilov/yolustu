from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://yolustu_user:yolustu_password@localhost:5432/yolustu_db"
    SECRET_KEY: str = "yolustu-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    class Config:
        env_file = ".env"

settings = Settings()
