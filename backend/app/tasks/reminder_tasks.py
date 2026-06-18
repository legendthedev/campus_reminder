from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.timetable import TimetableEntry, DayOfWeek
from app.models.course import Course, CourseEnrollment
from app.models.reminder_log import ReminderLog, ReminderType, Notification, NotificationType
from app.models.user import User
from app.core.redis import get_location
from app.services.notification_service import send_push_notification
from app.services.geofence_service import haversine_distance, get_active_geofence
from datetime import datetime, date, time, timezone, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)


async def check_upcoming_classes():
    now = datetime.now()
    if now.weekday() >= 5:
        return
    if not (7 <= now.hour < 20):
        return

    window_start = (now + timedelta(minutes=10)).time()
    window_end = (now + timedelta(minutes=20)).time()
    today_name = now.strftime("%A").lower()
    today_date = now.date()

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(TimetableEntry)
                .options(selectinload(TimetableEntry.course))
                .where(
                    TimetableEntry.day_of_week == today_name,
                    TimetableEntry.start_time >= window_start,
                    TimetableEntry.start_time <= window_end,
                )
            )
            entries = result.scalars().all()

            geofence = await get_active_geofence(db)

            for entry in entries:
                enrolled = await db.execute(
                    select(User)
                    .join(CourseEnrollment, CourseEnrollment.student_id == User.id)
                    .where(
                        CourseEnrollment.course_id == entry.course_id,
                        User.is_active == True,
                    )
                )
                students = enrolled.scalars().all()

                for student in students:
                    existing = await db.execute(
                        select(ReminderLog).where(
                            ReminderLog.student_id == student.id,
                            ReminderLog.timetable_entry_id == entry.id,
                            ReminderLog.class_date == today_date,
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue

                    loc = await get_location(str(student.id))
                    if not loc:
                        result2 = await db.execute(
                            select(
                                __import__('app.models.reminder_log', fromlist=['StudentLocation']).StudentLocation
                            ).where(
                                __import__('app.models.reminder_log', fromlist=['StudentLocation']).StudentLocation.student_id == student.id
                            ).order_by(
                                __import__('app.models.reminder_log', fromlist=['StudentLocation']).StudentLocation.recorded_at.desc()
                            ).limit(1)
                        )
                        loc_row = result2.scalar_one_or_none()
                        if loc_row:
                            age = (datetime.now(timezone.utc) - loc_row.recorded_at.replace(tzinfo=timezone.utc)).total_seconds()
                            if age < 1800:
                                loc = {
                                    "latitude": loc_row.latitude,
                                    "longitude": loc_row.longitude,
                                    "is_on_campus": loc_row.is_on_campus,
                                    "distance_metres": loc_row.distance_metres,
                                }

                    if loc and geofence:
                        is_on_campus = loc["is_on_campus"]
                        distance = loc["distance_metres"]
                        lat = loc["latitude"]
                        lng = loc["longitude"]
                    else:
                        is_on_campus = True
                        distance = 0.0
                        lat = None
                        lng = None

                    course_name = entry.course.course_name
                    room = entry.room_name
                    building = entry.building_name
                    start_str = entry.start_time.strftime("%H:%M")

                    if is_on_campus:
                        reminder_type = ReminderType.on_campus
                        title = "Class reminder"
                        body = f"{course_name} starts at {start_str} — {room}, {building}. You're already on campus!"
                    else:
                        reminder_type = ReminderType.off_campus
                        title = "Class reminder"
                        body = f"{course_name} starts at {start_str} — {room}, {building}. Head to campus now."

                    delivered = False
                    if student.fcm_token:
                        delivered = await send_push_notification(student.fcm_token, title, body)

                    log = ReminderLog(
                        student_id=student.id,
                        timetable_entry_id=entry.id,
                        course_id=entry.course_id,
                        reminder_type=reminder_type,
                        was_on_campus=is_on_campus,
                        student_latitude=lat,
                        student_longitude=lng,
                        distance_metres=distance,
                        fcm_delivered=delivered,
                        class_date=today_date,
                    )
                    db.add(log)

                    notif = Notification(
                        recipient_id=student.id,
                        title=title,
                        body=body,
                        type=NotificationType.class_reminder,
                    )
                    db.add(notif)

            await db.commit()
            logger.info(f"Reminder check completed for {today_name} {window_start}–{window_end}")
        except Exception as e:
            logger.error(f"Reminder task error: {e}", exc_info=True)
            await db.rollback()
            raise
