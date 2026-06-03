import redis.asyncio as aioredis
from app.core.config import settings
import json
from typing import Optional

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def set_location(student_id: str, data: dict, ttl: int = 600):
    r = await get_redis()
    await r.setex(f"location:{student_id}", ttl, json.dumps(data))


async def get_location(student_id: str) -> Optional[dict]:
    r = await get_redis()
    val = await r.get(f"location:{student_id}")
    return json.loads(val) if val else None


async def set_analytics(week: int, data: dict):
    r = await get_redis()
    await r.set(f"analytics:week:{week}", json.dumps(data))


async def get_analytics(week: int) -> Optional[dict]:
    r = await get_redis()
    val = await r.get(f"analytics:week:{week}")
    return json.loads(val) if val else None


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
