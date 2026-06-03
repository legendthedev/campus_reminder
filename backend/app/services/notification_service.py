from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.reminder_log import Notification, NotificationType
from app.models.user import User
from pyfcm import FCMNotification
from app.core.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)


def get_fcm():
    if not settings.FCM_SERVER_KEY or settings.FCM_SERVER_KEY == "your-firebase-server-key-here":
        return None
    return FCMNotification(api_key=settings.FCM_SERVER_KEY)


async def send_push_notification(fcm_token: str, title: str, body: str) -> bool:
    push_service = get_fcm()
    if not push_service or not fcm_token:
        logger.warning("FCM not configured or no token — skipping push")
        return False
    try:
        result = push_service.notify_single_device(
            registration_id=fcm_token,
            message_title=title,
            message_body=body,
        )
        return result.get("success") == 1
    except Exception as e:
        logger.error(f"FCM error: {e}")
        return False


async def save_notification(
    db: AsyncSession,
    recipient_id: uuid.UUID,
    title: str,
    body: str,
    notif_type: NotificationType,
):
    notif = Notification(
        recipient_id=recipient_id,
        title=title,
        body=body,
        type=notif_type,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def broadcast_notification(db: AsyncSession, title: str, body: str, target: str = "all"):
    from app.models.course import CourseEnrollment
    if target == "all":
        result = await db.execute(select(User).where(User.is_active == True, User.role == "student"))
        students = result.scalars().all()
    else:
        try:
            course_id = uuid.UUID(target)
            result = await db.execute(
                select(User).join(CourseEnrollment, CourseEnrollment.student_id == User.id)
                .where(CourseEnrollment.course_id == course_id)
            )
            students = result.scalars().all()
        except Exception:
            students = []

    sent = 0
    for student in students:
        await save_notification(db, student.id, title, body, NotificationType.announcement)
        if student.fcm_token:
            delivered = await send_push_notification(student.fcm_token, title, body)
            sent += 1
    return sent
