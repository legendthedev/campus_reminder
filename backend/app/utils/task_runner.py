from app.core.database import AsyncSessionLocal
import logging

logger = logging.getLogger(__name__)


async def run_with_session(task_name: str, func):
    async with AsyncSessionLocal() as db:
        try:
            await func(db)
            await db.commit()
        except Exception as e:
            logger.error(f"{task_name} error: {e}")
            await db.rollback()
