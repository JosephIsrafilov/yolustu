"""Redis caching utilities for read-heavy endpoints."""

import json
import logging
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, cast

from fastapi import Request
from redis import Redis

from app.core.redis import get_redis

logger = logging.getLogger(__name__)

T = TypeVar("T")


def generate_cache_key(prefix: str, **kwargs: Any) -> str:
    """Generate a cache key from prefix and parameters.

    Args:
        prefix: Cache key prefix (e.g., 'ride', 'user', 'vehicle')
        **kwargs: Key-value pairs to include in the cache key

    Returns:
        A formatted cache key string
    """
    # Filter out None values and sort for consistency
    params = {k: v for k, v in sorted(kwargs.items()) if v is not None}
    param_str = ":".join(f"{k}={v}" for k, v in params.items())
    return f"{prefix}:{param_str}" if param_str else prefix


def cache_response(
    prefix: str,
    ttl: int = 300,
    key_builder: Optional[Callable[..., str]] = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator to cache endpoint responses in Redis.

    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds (default: 300 = 5 minutes)
        key_builder: Optional custom function to build cache key from function args

    Returns:
        Decorated function with caching

    Example:
        @cache_response(prefix="ride", ttl=600)
        def get_ride(ride_id: UUID, db: Session):
            return service.get_ride(ride_id)
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            # Skip Request objects when building cache key
            cache_kwargs = {
                k: str(v)
                for k, v in kwargs.items()
                if not isinstance(v, (Request, type(None)))
            }

            # Use custom key builder if provided, otherwise use default
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                cache_key = generate_cache_key(prefix, **cache_kwargs)

            try:
                redis_client = get_redis()

                # Try to get from cache
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit: {cache_key}")
                    return json.loads(cached_data)

                # Cache miss - execute function
                logger.debug(f"Cache miss: {cache_key}")
                result = func(*args, **kwargs)

                # Store in cache
                redis_client.setex(cache_key, ttl, json.dumps(result, default=str))

                return result

            except Exception as e:
                # If Redis fails, log and continue without caching
                logger.warning(f"Cache error for {cache_key}: {e}")
                return func(*args, **kwargs)

        return cast(Callable[..., T], wrapper)

    return decorator


def invalidate_cache(redis: Redis, pattern: str) -> int:
    """Invalidate cache entries matching a pattern.

    Args:
        redis: Redis client instance
        pattern: Pattern to match keys (e.g., 'ride:*', 'user:123:*')

    Returns:
        Number of keys deleted
    """
    try:
        keys = list(redis.scan_iter(match=pattern))
        if keys:
            deleted = redis.delete(*keys)
            logger.info(f"Invalidated {deleted} cache keys matching '{pattern}'")
            return int(deleted)  # type: ignore[arg-type]
        return 0
    except Exception as e:
        logger.error(f"Failed to invalidate cache pattern '{pattern}': {e}")
        return 0


def invalidate_cache_keys(redis: Redis, keys: list[str]) -> int:
    """Invalidate specific cache keys.

    Args:
        redis: Redis client instance
        keys: List of cache keys to delete

    Returns:
        Number of keys deleted
    """
    try:
        if keys:
            deleted = redis.delete(*keys)
            logger.info(f"Invalidated {deleted} specific cache keys")
            return int(deleted)  # type: ignore[arg-type]
        return 0
    except Exception as e:
        logger.error(f"Failed to invalidate cache keys: {e}")
        return 0


class CacheManager:
    """Centralized cache management for domain entities."""

    def __init__(self, redis: Redis):
        self.redis = redis

    def invalidate_ride(self, ride_id: str) -> None:
        """Invalidate all cache entries related to a ride."""
        patterns = [
            f"ride:ride_id={ride_id}",
            "rides:search:*",
            "rides:my:*",
        ]
        for pattern in patterns:
            invalidate_cache(self.redis, pattern)

    def invalidate_user(self, user_id: str) -> None:
        """Invalidate all cache entries related to a user."""
        patterns = [
            f"user:user_id={user_id}",
            f"user:me:user_id={user_id}",
        ]
        for pattern in patterns:
            invalidate_cache(self.redis, pattern)

    def invalidate_vehicle(self, vehicle_id: str) -> None:
        """Invalidate all cache entries related to a vehicle."""
        patterns = [
            f"vehicle:vehicle_id={vehicle_id}",
            "vehicles:my:*",
        ]
        for pattern in patterns:
            invalidate_cache(self.redis, pattern)

    def invalidate_booking(self, booking_id: str) -> None:
        """Invalidate all cache entries related to a booking."""
        patterns = [
            "bookings:my:*",
            "bookings:requests:*",
        ]
        for pattern in patterns:
            invalidate_cache(self.redis, pattern)

    def invalidate_review(self, user_id: str) -> None:
        """Invalidate all cache entries related to reviews."""
        patterns = [
            f"reviews:user={user_id}",
        ]
        for pattern in patterns:
            invalidate_cache(self.redis, pattern)
