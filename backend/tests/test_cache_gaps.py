import json
from unittest.mock import patch, MagicMock
from redis import Redis
from fastapi import Request

from app.core.cache import (
    generate_cache_key,
    cache_response,
    invalidate_cache,
    invalidate_cache_keys,
    CacheManager,
)


def test_generate_cache_key():
    key = generate_cache_key("prefix", b=2, a=1, c=None)
    assert key == "prefix:a=1:b=2"

    key2 = generate_cache_key("prefix", c=None)
    assert key2 == "prefix"


def test_cache_response_decorator_hit():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.get.return_value = json.dumps({"result": "cached"})

    with patch("app.core.cache.get_redis", return_value=mock_redis):

        @cache_response(prefix="testprefix", ttl=100)
        def dummy_function(param):
            return {"result": "fresh"}

        res = dummy_function(param="hello")
        assert res == {"result": "cached"}
        mock_redis.get.assert_called_once_with("testprefix:param=hello")
        mock_redis.setex.assert_not_called()


def test_cache_response_decorator_miss():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.get.return_value = None

    with patch("app.core.cache.get_redis", return_value=mock_redis):

        @cache_response(prefix="testprefix", ttl=100)
        def dummy_function(param):
            return {"result": "fresh"}

        res = dummy_function(param="hello")
        assert res == {"result": "fresh"}
        mock_redis.get.assert_called_once_with("testprefix:param=hello")
        mock_redis.setex.assert_called_once_with(
            "testprefix:param=hello", 100, json.dumps({"result": "fresh"})
        )


def test_cache_response_decorator_custom_key_builder():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.get.return_value = None

    def my_builder(param):
        return f"customkey:{param}"

    with patch("app.core.cache.get_redis", return_value=mock_redis):

        @cache_response(prefix="testprefix", key_builder=my_builder)
        def dummy_function(param):
            return 42

        res = dummy_function(param="val")
        assert res == 42
        mock_redis.get.assert_called_once_with("customkey:val")


def test_cache_response_decorator_ignores_request_and_none():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.get.return_value = None

    mock_req = MagicMock(spec=Request)

    with patch("app.core.cache.get_redis", return_value=mock_redis):

        @cache_response(prefix="testprefix")
        def dummy_function(req, param, other=None):
            return "done"

        dummy_function(req=mock_req, param="val", other=None)
        mock_redis.get.assert_called_once_with("testprefix:param=val")


def test_cache_response_decorator_exception_fallback():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.get.side_effect = Exception("Redis connection failed")

    with patch("app.core.cache.get_redis", return_value=mock_redis):

        @cache_response(prefix="testprefix")
        def dummy_function():
            return "ok"

        res = dummy_function()
        assert res == "ok"


def test_invalidate_cache_success():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.scan_iter.return_value = ["key1", "key2"]
    mock_redis.delete.return_value = 2

    deleted = invalidate_cache(mock_redis, "pattern:*")
    assert deleted == 2
    mock_redis.scan_iter.assert_called_once_with(match="pattern:*")
    mock_redis.delete.assert_called_once_with("key1", "key2")


def test_invalidate_cache_empty():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.scan_iter.return_value = []

    deleted = invalidate_cache(mock_redis, "pattern:*")
    assert deleted == 0
    mock_redis.delete.assert_not_called()


def test_invalidate_cache_error():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.scan_iter.side_effect = Exception("scan error")

    deleted = invalidate_cache(mock_redis, "pattern:*")
    assert deleted == 0


def test_invalidate_cache_keys_success():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.delete.return_value = 3

    deleted = invalidate_cache_keys(mock_redis, ["k1", "k2", "k3"])
    assert deleted == 3
    mock_redis.delete.assert_called_once_with("k1", "k2", "k3")


def test_invalidate_cache_keys_empty():
    mock_redis = MagicMock(spec=Redis)

    deleted = invalidate_cache_keys(mock_redis, [])
    assert deleted == 0
    mock_redis.delete.assert_not_called()


def test_invalidate_cache_keys_error():
    mock_redis = MagicMock(spec=Redis)
    mock_redis.delete.side_effect = Exception("delete error")

    deleted = invalidate_cache_keys(mock_redis, ["k1"])
    assert deleted == 0


def test_cache_manager_invalidations():
    mock_redis = MagicMock(spec=Redis)
    manager = CacheManager(mock_redis)

    with patch("app.core.cache.invalidate_cache") as mock_inv:
        manager.invalidate_ride("r123")
        assert mock_inv.call_count == 3

        manager.invalidate_user("u456")
        assert mock_inv.call_count == 5

        manager.invalidate_vehicle("v789")
        assert mock_inv.call_count == 7

        manager.invalidate_booking("b000")
        assert mock_inv.call_count == 9

        manager.invalidate_review("rev111")
        assert mock_inv.call_count == 10
