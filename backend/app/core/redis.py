import redis
from fastapi import HTTPException

from app.core.config import settings

redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis():
    client = redis.Redis(connection_pool=redis_pool)
    try:
        client.ping()
    except redis.RedisError as exc:
        raise HTTPException(
            status_code=503,
            detail="Redis is unavailable. Please try again later.",
        ) from exc
    return client
