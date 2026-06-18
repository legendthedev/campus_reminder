import pytest
import json
from unittest.mock import patch, AsyncMock, MagicMock

from app.core.redis import (
    get_redis,
    set_location,
    get_location,
    set_analytics,
    get_analytics,
    close_redis,
)


@pytest.fixture(autouse=True)
def reset_redis_client():
    """Reset the global redis client between tests."""
    import app.core.redis as redis_module
    redis_module._redis_client = None
    yield
    redis_module._redis_client = None


class TestGetRedis:
    @pytest.mark.asyncio
    @patch("app.core.redis.aioredis.from_url")
    async def test_creates_client_on_first_call(self, mock_from_url):
        mock_client = AsyncMock()
        mock_from_url.return_value = mock_client
        result = await get_redis()
        assert result == mock_client
        mock_from_url.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.core.redis.aioredis.from_url")
    async def test_reuses_client_on_subsequent_calls(self, mock_from_url):
        mock_client = AsyncMock()
        mock_from_url.return_value = mock_client
        r1 = await get_redis()
        r2 = await get_redis()
        assert r1 is r2
        assert mock_from_url.call_count == 1


class TestSetLocation:
    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_sets_location_with_ttl(self, mock_get_redis):
        mock_r = AsyncMock()
        mock_get_redis.return_value = mock_r

        data = {"latitude": 6.5, "longitude": 3.3, "is_on_campus": True}
        await set_location("student-1", data)

        mock_r.setex.assert_called_once_with(
            "location:student-1", 600, json.dumps(data)
        )

    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_sets_location_custom_ttl(self, mock_get_redis):
        mock_r = AsyncMock()
        mock_get_redis.return_value = mock_r

        data = {"latitude": 6.5, "longitude": 3.3}
        await set_location("s2", data, ttl=300)

        mock_r.setex.assert_called_once_with("location:s2", 300, json.dumps(data))


class TestGetLocation:
    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_returns_dict_when_data_exists(self, mock_get_redis):
        mock_r = AsyncMock()
        stored = {"latitude": 6.5, "longitude": 3.3, "is_on_campus": True}
        mock_r.get.return_value = json.dumps(stored)
        mock_get_redis.return_value = mock_r

        result = await get_location("student-1")
        assert result == stored
        mock_r.get.assert_called_once_with("location:student-1")

    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_returns_none_when_no_data(self, mock_get_redis):
        mock_r = AsyncMock()
        mock_r.get.return_value = None
        mock_get_redis.return_value = mock_r

        result = await get_location("nonexistent")
        assert result is None


class TestSetAnalytics:
    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_stores_analytics_data(self, mock_get_redis):
        mock_r = AsyncMock()
        mock_get_redis.return_value = mock_r

        data = {"week": 3, "trend": []}
        await set_analytics(3, data)

        mock_r.set.assert_called_once_with("analytics:week:3", json.dumps(data))


class TestGetAnalytics:
    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_returns_dict_when_exists(self, mock_get_redis):
        mock_r = AsyncMock()
        stored = {"week": 5, "trend": [{"avg": 3.5}]}
        mock_r.get.return_value = json.dumps(stored)
        mock_get_redis.return_value = mock_r

        result = await get_analytics(5)
        assert result == stored

    @pytest.mark.asyncio
    @patch("app.core.redis.get_redis")
    async def test_returns_none_when_missing(self, mock_get_redis):
        mock_r = AsyncMock()
        mock_r.get.return_value = None
        mock_get_redis.return_value = mock_r

        result = await get_analytics(99)
        assert result is None


class TestCloseRedis:
    @pytest.mark.asyncio
    @patch("app.core.redis.aioredis.from_url")
    async def test_closes_and_resets_client(self, mock_from_url):
        import app.core.redis as redis_module

        mock_client = AsyncMock()
        mock_from_url.return_value = mock_client
        await get_redis()
        assert redis_module._redis_client is not None

        await close_redis()
        mock_client.aclose.assert_called_once()
        assert redis_module._redis_client is None

    @pytest.mark.asyncio
    async def test_close_noop_when_no_client(self):
        import app.core.redis as redis_module
        redis_module._redis_client = None
        await close_redis()  # should not raise
