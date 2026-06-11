import os
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

pool_size = int(os.getenv("DB_POOL_SIZE", 5))
max_overflow = int(os.getenv("DB_MAX_OVERFLOW", 10))
pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", 30))

engine_kwargs: dict = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if _is_sqlite_url(database_url):
    # SQLite (tests/local) uses a single shared connection across threads.
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update(
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
    )
    # Supabase (and any pooled remote Postgres) silently drops idle
    # connections. Without a connect timeout a dead socket makes login hang;
    # without TCP keepalives a checked-out connection can stall mid-request.
    # pool_pre_ping above catches dead connections on checkout; these settings
    # bound the failure window for connections that die while in use.
    engine_kwargs["connect_args"] = {
        "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", 10)),
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
