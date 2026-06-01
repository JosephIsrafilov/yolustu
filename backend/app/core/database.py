from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import normalize_database_url, settings


def _is_sqlite_url(url: str) -> bool:
    return url.startswith("sqlite:")


def _is_remote_postgres_url(url: str) -> bool:
    parsed = urlparse(url)
    if not parsed.scheme.startswith("postgresql"):
        return False

    host = (parsed.hostname or "").lower()
    if host in {"", "localhost", "127.0.0.1", "::1", "db"}:
        return False
    return True


def _has_sslmode_query(url: str) -> bool:
    parsed = urlparse(url)
    return any(key.lower() == "sslmode" for key, _ in parse_qsl(parsed.query))


def _with_sslmode_require(url: str) -> str:
    parsed = urlparse(url)
    query_params = parse_qsl(parsed.query, keep_blank_values=True)
    query_params.append(("sslmode", "require"))
    return urlunparse(parsed._replace(query=urlencode(query_params)))


database_url = normalize_database_url(settings.DATABASE_URL)
if _is_remote_postgres_url(database_url) and not _has_sslmode_query(database_url):
    database_url = _with_sslmode_require(database_url)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
