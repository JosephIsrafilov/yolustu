from typing import Any

import redis

from app.core.config import settings


class InMemoryRedis:
    def __init__(self) -> None:
        self._store: dict[str, Any] = {}

    def get(self, key: str) -> Any:
        return self._store.get(key)

    def set(
        self,
        key: str,
        value: Any,
        nx: bool = False,
        ex: int | None = None,
    ) -> bool | None:
        # Mirror redis-py: SET NX returns None when the key already exists.
        if nx and key in self._store:
            return None
        del ex  # TTL is irrelevant for the in-process test shim.
        self._store[key] = value
        return True

    def setex(self, key: str, ttl: int, value: Any) -> bool:
        del ttl
        self._store[key] = value
        return True

    def delete(self, *keys: str) -> int:
        deleted = 0
        for key in keys:
            if key in self._store:
                del self._store[key]
                deleted += 1
        return deleted

    def scan_iter(self, match: str | None = None):
        if match is None or match == "*":
            yield from self._store.keys()
            return
        prefix = match[:-1] if match.endswith("*") else match
        for key in self._store:
            if key.startswith(prefix):
                yield key

    @staticmethod
    def ping() -> bool:
        return True


def _uses_in_memory_redis(url: str) -> bool:
    return url.strip().lower() == "memory://"


redis_pool: redis.ConnectionPool | None = None
_memory_redis = InMemoryRedis()

if not _uses_in_memory_redis(settings.REDIS_URL):
    redis_pool = redis.ConnectionPool.from_url(
        settings.REDIS_URL, decode_responses=True
    )


def get_redis():
    if redis_pool is None:
        return _memory_redis
    return redis.Redis(connection_pool=redis_pool)
