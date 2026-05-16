import redis
from core.config import settings


redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis():
    """Returns a Redis client instance from the pool."""
    return redis.Redis(connection_pool=redis_pool)
