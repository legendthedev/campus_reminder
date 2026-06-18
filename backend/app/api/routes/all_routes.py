from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, require_lecturer_or_admin, require_admin
from app.models.course import Course, CourseEnrollment
from app.models.user import User
from app.models.reminder_log import ReminderLog, Notification, NotificationType
from app.models.campus_geofence import CampusGeofence
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseOut, EnrollRequest,
    TimetableCreate, TimetableUpdate, TimetableOut,
    GeofenceCreate, GeofenceUpdate, GeofenceOut,
    CheckPositionRequest, CheckPositionResponse,
    SurveySubmit, SurveyOut,
    NotificationBroadcast, NotificationOut,
)
from app.services.timetable_service import (
    get_all_timetable, get_today_timetable,
    create_timetable_entry, update_timetable_entry, delete_timetable_entry,
)
from app.services.geofence_service import check_position, get_active_geofence
from app.services.notification_service import save_notification, broadcast_notification
from app.services.survey_service import (
    submit_survey, get_all_surveys, get_student_surveys,
    check_submitted,
)
from app.utils.week_helpers import get_current_week_number, get_week_start_date
from app.services.analytics_service import (
    get_punctuality_summary, get_weekly_trend, get_reminder_effectiveness,
    get_geofence_stats, get_platform_breakdown,
)
from app.utils.db_helpers import get_or_404, apply_updates, create_and_refresh
from typing import List
import uuid
from datetime import date

# ─── COURSES ────────────────────────────────────────────────────────────────

courses_router = APIRouter(prefix="/api/courses", tags=["courses"])


@courses_router.get("", response_model=List[CourseOut])
async def list_courses(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Course))
    return result.scalars().all()


@courses_router.post("", response_model=CourseOut)
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    course = Course(**data.model_dump())
    return await create_and_refresh(db, course)


@courses_router.get("/{course_id}", response_model=CourseOut)
async def get_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_or_404(db, Course, course_id, "Course not found")


@courses_router.put("/{course_id}", response_model=CourseOut)
async def update_course(course_id: uuid.UUID, data: CourseUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    c = await get_or_404(db, Course, course_id, "Course not found")
    apply_updates(c, data)
    await db.commit()
    await db.refresh(c)
    return c


@courses_router.delete("/{course_id}")
async def delete_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    c = await get_or_404(db, Course, course_id, "Course not found")
    await db.delete(c)
    await db.commit()
    return {"message": "Deleted"}


@courses_router.post("/{course_id}/enroll")
async def enroll_student(course_id: uuid.UUID, data: EnrollRequest, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    enroll = CourseEnrollment(student_id=data.student_id, course_id=course_id)
    db.add(enroll)
    await db.commit()
    return {"message": "Enrolled"}


@courses_router.delete("/{course_id}/enroll/{student_id}")
async def unenroll_student(course_id: uuid.UUID, student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    result = await db.execute(select(CourseEnrollment).where(CourseEnrollment.course_id == course_id, CourseEnrollment.student_id == student_id))
    e = result.scalar_one_or_none()
    if e:
        await db.delete(e)
        await db.commit()
    return {"message": "Unenrolled"}


@courses_router.get("/{course_id}/students")
async def course_students(course_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(User).join(CourseEnrollment, CourseEnrollment.student_id == User.id)
        .where(CourseEnrollment.course_id == course_id)
    )
    return result.scalars().all()


# ─── TIMETABLE ─────────────────────────────────────────────────────────────

timetable_router = APIRouter(prefix="/api/timetable", tags=["timetable"])


@timetable_router.get("")
async def list_timetable(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_all_timetable(db)


@timetable_router.get("/today")
async def today_timetable(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_today_timetable(db)


@timetable_router.get("/week")
async def week_timetable(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_all_timetable(db)


@timetable_router.post("")
async def add_timetable(data: TimetableCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await create_timetable_entry(db, data)


@timetable_router.get("/{entry_id}")
async def get_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    from app.models.timetable import TimetableEntry
    return await get_or_404(db, TimetableEntry, entry_id, "Entry not found")


@timetable_router.put("/{entry_id}")
async def update_entry(entry_id: uuid.UUID, data: TimetableUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    e = await update_timetable_entry(db, entry_id, data)
    if not e:
        raise HTTPException(404, "Entry not found")
    return e


@timetable_router.delete("/{entry_id}")
async def delete_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    e = await delete_timetable_entry(db, entry_id)
    if not e:
        raise HTTPException(404, "Entry not found")
    return {"message": "Deleted"}


# ─── GEOFENCE ───────────────────────────────────────────────────────────────

geofence_router = APIRouter(prefix="/api/geofence", tags=["geofence"])


@geofence_router.get("", response_model=List[GeofenceOut])
async def list_geofences(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(CampusGeofence))
    return result.scalars().all()


@geofence_router.post("", response_model=GeofenceOut)
async def create_geofence(data: GeofenceCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    g = CampusGeofence(**data.model_dump())
    return await create_and_refresh(db, g)


@geofence_router.put("/{geofence_id}", response_model=GeofenceOut)
async def update_geofence(geofence_id: uuid.UUID, data: GeofenceUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    g = await get_or_404(db, CampusGeofence, geofence_id, "Geofence not found")
    apply_updates(g, data)
    await db.commit()
    await db.refresh(g)
    return g


@geofence_router.post("/check-position", response_model=CheckPositionResponse)
async def check_pos(data: CheckPositionRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await check_position(db, str(current_user.id), data.latitude, data.longitude, data.platform)
    return result


@geofence_router.get("/on-campus-now")
async def on_campus_now(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    from app.models.reminder_log import StudentLocation
    from datetime import datetime, timezone, timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
    result = await db.execute(
        select(StudentLocation).where(
            StudentLocation.is_on_campus == True,
            StudentLocation.recorded_at >= cutoff,
        )
    )
    return result.scalars().all()


# ─── REMINDERS ──────────────────────────────────────────────────────────────

reminders_router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@reminders_router.get("/logs")
async def all_logs(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    result = await db.execute(select(ReminderLog).order_by(ReminderLog.sent_at.desc()).limit(500))
    return result.scalars().all()


@reminders_router.get("/logs/{student_id}")
async def student_logs(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.student_id == student_id).order_by(ReminderLog.sent_at.desc()))
    return result.scalars().all()


@reminders_router.get("/logs/course/{course_id}")
async def course_logs(course_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.course_id == course_id).order_by(ReminderLog.sent_at.desc()))
    return result.scalars().all()


@reminders_router.post("/trigger-manual")
async def trigger_manual(timetable_entry_id: uuid.UUID, class_date: date, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    from app.tasks.reminder_tasks import check_upcoming_classes
    await check_upcoming_classes()
    return {"message": "Manual reminder check triggered"}


# ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@notifications_router.get("")
async def list_notifications(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(Notification)
        .where(Notification.recipient_id == current_user.id)
        .order_by(Notification.sent_at.desc())
    )
    return result.scalars().all()


@notifications_router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.recipient_id == current_user.id, Notification.is_read == False)
    )
    return {"count": result.scalar()}


@notifications_router.post("/broadcast")
async def broadcast(data: NotificationBroadcast, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    sent = await broadcast_notification(db, data.title, data.body, data.target)
    return {"message": f"Broadcast sent to {sent} students"}


@notifications_router.put("/{notification_id}/read")
async def mark_read(notification_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    n = result.scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"message": "Marked as read"}


@notifications_router.post("/mark-all-read")
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.recipient_id == current_user.id, Notification.is_read == False)
    )
    for n in result.scalars().all():
        n.is_read = True
    await db.commit()
    return {"message": "All marked as read"}


@notifications_router.post("/update-fcm-token")
async def update_fcm(data: dict, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    current_user.fcm_token = data.get("fcm_token")
    current_user.platform = data.get("platform")
    await db.commit()
    return {"message": "FCM token updated"}


# ─── SURVEY ─────────────────────────────────────────────────────────────────

survey_router = APIRouter(prefix="/api/survey", tags=["survey"])


@survey_router.post("/submit", response_model=SurveyOut)
async def submit(data: SurveySubmit, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await submit_survey(db, current_user.id, data)


@survey_router.get("/responses")
async def all_responses(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_all_surveys(db)


@survey_router.get("/responses/{student_id}")
async def student_responses(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_student_surveys(db, student_id)


@survey_router.get("/current-week")
async def current_week(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    week = get_current_week_number()
    week_start = get_week_start_date(week)
    from datetime import timedelta
    week_end = week_start + timedelta(days=6)
    has_submitted = await check_submitted(db, current_user.id, week)
    return {"week_number": week, "week_start_date": week_start, "week_end_date": week_end, "has_submitted": has_submitted}


@survey_router.get("/check-submitted/{week_number}")
async def check_week(week_number: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return {"submitted": await check_submitted(db, current_user.id, week_number)}


# ─── ANALYTICS ──────────────────────────────────────────────────────────────

analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@analytics_router.get("/punctuality-summary")
async def punctuality(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_punctuality_summary(db)


@analytics_router.get("/reminder-effectiveness")
async def effectiveness(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_reminder_effectiveness(db)


@analytics_router.get("/survey-summary")
async def survey_summary(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_punctuality_summary(db)


@analytics_router.get("/geofence-stats")
async def geofence_stats(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_geofence_stats(db)


@analytics_router.get("/weekly-trend")
async def weekly_trend(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_weekly_trend(db)


@analytics_router.get("/platform-breakdown")
async def platform_breakdown(db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    return await get_platform_breakdown(db)
