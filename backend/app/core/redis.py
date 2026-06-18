import redis.asyncio as aioredis
from redis.exceptions import RedisError
from app.core.config import settings
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def set_location(student_id: str, data: dict, ttl: int = 600):
    try:
        r = await get_redis()
        await r.setex(f"location:{student_id}", ttl, json.dumps(data))
    except RedisError as e:
        logger.error(f"Redis set_location failed for student {student_id}: {e}")


async def get_location(student_id: str) -> Optional[dict]:
    try:
        r = await get_redis()
        val = await r.get(f"location:{student_id}")
        return json.loads(val) if val else None
    except RedisError as e:
        logger.error(f"Redis get_location failed for student {student_id}: {e}")
        return None


async def set_analytics(week: int, data: dict):
    try:
        r = await get_redis()
        await r.set(f"analytics:week:{week}", json.dumps(data))
    except RedisError as e:
        logger.error(f"Redis set_analytics failed for week {week}: {e}")


async def get_analytics(week: int) -> Optional[dict]:
    try:
        r = await get_redis()
        val = await r.get(f"analytics:week:{week}")
        return json.loads(val) if val else None
    except RedisError as e:
        logger.error(f"Redis get_analytics failed for week {week}: {e}")
        return None


async def close_redis():
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.aclose()
        except RedisError as e:
            logger.error(f"Redis close failed: {e}")
        finally:
            _redis_client = None
