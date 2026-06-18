from sqlalchemy.ext.asyncio import AsyncSession
from app.tasks.survey_tasks import send_weekly_survey_invite
from app.utils.week_helpers import get_current_week_number
from app.services.analytics_service import get_weekly_trend, get_reminder_effectiveness, get_platform_breakdown
from app.core.redis import set_analytics
from app.utils.task_runner import run_with_session
import logging

logger = logging.getLogger(__name__)

# Re-export so existing callers still work
__all__ = ["send_weekly_survey_invite", "generate_weekly_analytics"]


async def generate_weekly_analytics():
    week = get_current_week_number()

    async def _generate(db: AsyncSession):
        trend = await get_weekly_trend(db)
        effectiveness = await get_reminder_effectiveness(db)
        platforms = await get_platform_breakdown(db)
        summary = {
            "week": week,
            "trend": trend,
            "effectiveness": effectiveness,
            "platforms": platforms,
        }
        await set_analytics(week, summary)
        logger.info(f"Analytics generated for week {week}")

    await run_with_session("Analytics generation", _generate)
