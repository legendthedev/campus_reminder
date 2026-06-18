from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.reminder_log import Notification, NotificationType
from app.services.notification_service import send_push_notification
from app.services.survey_service import get_current_week_number
import logging

logger = logging.getLogger(__name__)


async def send_weekly_survey_invite():
    week = get_current_week_number()
    async with AsyncSessionLocal() as db:
        try:
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
            await db.commit()
            logger.info(f"Survey invites sent for week {week}")
        except Exception as e:
            logger.error(f"Survey task error: {e}", exc_info=True)
            await db.rollback()
            raise
