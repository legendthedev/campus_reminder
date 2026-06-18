from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.reminder_log import Notification, NotificationType
from app.services.notification_service import send_push_notification
from app.utils.week_helpers import get_current_week_number
from app.utils.task_runner import run_with_session
import logging

logger = logging.getLogger(__name__)


async def send_weekly_survey_invite():
    week = get_current_week_number()

    async def _send(db: AsyncSession):
        result = await db.execute(
            select(User).where(User.role == "student", User.is_active == True)
        )
        students = result.scalars().all()
        for student in students:
            title = "Weekly survey ready"
            body = "How was your attendance this week? Takes 2 minutes. Your feedback matters."
            notif = Notification(
                recipient_id=student.id,
                title=title,
                body=body,
                type=NotificationType.survey_invite,
            )
            db.add(notif)
            if student.fcm_token:
                await send_push_notification(student.fcm_token, title, body)
        logger.info(f"Survey invites sent for week {week}")

    await run_with_session("Survey invite", _send)
