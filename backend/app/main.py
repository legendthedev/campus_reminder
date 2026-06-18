import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_tables
from app.core.scheduler import scheduler, setup_scheduler
from app.core.redis import close_redis
from app.api.routes.auth import router as auth_router
from app.api.routes.students import router as students_router
from app.api.routes.all_routes import (
    courses_router, timetable_router, geofence_router,
    reminders_router, notifications_router,
    survey_router, analytics_router,
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Campus Reminder System...")
    await create_tables()
    await seed_database()
    setup_scheduler()
    scheduler.start()
    logger.info("APScheduler started")
    yield
    scheduler.shutdown()
    await close_redis()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Campus Reminder System API",
    description="Mobile and Ubiquitous Computing — GPS-based campus class reminder system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(courses_router)
app.include_router(timetable_router)
app.include_router(geofence_router)
app.include_router(reminders_router)
app.include_router(notifications_router)
app.include_router(survey_router)
app.include_router(analytics_router)


@app.get("/")
async def root():
    return {"message": "Campus Reminder System API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}


async def seed_database():
    from app.core.database import AsyncSessionLocal
    from app.models.user import User, UserRole, Platform
    from app.models.course import Course, CourseEnrollment
    from app.models.timetable import TimetableEntry, DayOfWeek
    from app.models.campus_geofence import CampusGeofence
    from app.models.reminder_log import ReminderLog, ReminderType
    from app.models.survey import SurveyResponse, LocationPreference
    from app.core.security import get_password_hash
    from sqlalchemy import select, func
    from datetime import datetime, date, time, timedelta
    import uuid
    import random

    try:
      async with AsyncSessionLocal() as db:
        count_result = await db.execute(select(func.count(User.id)))
        if count_result.scalar() > 0:
            return
        logger.info("Seeding database...")

        lecturer1 = User(full_name="Dr. Adebayo Okafor", email="adebayo@university.edu",
                         password_hash=get_password_hash("lecturer123"), role=UserRole.lecturer)
        lecturer2 = User(full_name="Dr. Ngozi Eze", email="ngozi@university.edu",
                         password_hash=get_password_hash("lecturer123"), role=UserRole.lecturer)
        admin = User(full_name="Admin User", email="admin@university.edu",
                     password_hash=get_password_hash("admin123"), role=UserRole.admin)

        students_data = [
            ("Chidi Nwosu",   "chidi@student.edu",  "STU001", Platform.android),
            ("Amaka Obi",     "amaka@student.edu",   "STU002", Platform.ios),
            ("Emeka Chukwu",  "emeka@student.edu",   "STU003", Platform.android),
            ("Fatima Bello",  "fatima@student.edu",  "STU004", Platform.ios),
            ("Tunde Adeleke", "tunde@student.edu",   "STU005", Platform.android),
        ]
        students = []
        for name, email, sid, plat in students_data:
            s = User(full_name=name, email=email,
                     password_hash=get_password_hash("student123"),
                     role=UserRole.student, student_id=sid, platform=plat)
            students.append(s)

        for obj in [lecturer1, lecturer2, admin] + students:
            db.add(obj)
        await db.flush()

        cs401 = Course(course_code="CS401", course_name="Mobile Computing",    lecturer_id=lecturer1.id)
        cs302 = Course(course_code="CS302", course_name="Database Systems",    lecturer_id=lecturer2.id)
        cs205 = Course(course_code="CS205", course_name="Web Development",     lecturer_id=lecturer1.id)
        for c in [cs401, cs302, cs205]:
            db.add(c)
        await db.flush()

        enrollments = (
            [(s.id, cs401.id) for s in students] +
            [(students[i].id, cs302.id) for i in range(3)] +
            [(students[i].id, cs205.id) for i in range(2, 5)]
        )
        for sid, cid in enrollments:
            db.add(CourseEnrollment(student_id=sid, course_id=cid))

        from app.models.timetable import DayOfWeek
        entries = [
            TimetableEntry(course_id=cs401.id, day_of_week=DayOfWeek.monday,
                           start_time=time(10, 0), end_time=time(12, 0),
                           room_name="Lab 101", building_name="CS Block"),
            TimetableEntry(course_id=cs401.id, day_of_week=DayOfWeek.wednesday,
                           start_time=time(10, 0), end_time=time(12, 0),
                           room_name="Lab 101", building_name="CS Block"),
            TimetableEntry(course_id=cs302.id, day_of_week=DayOfWeek.tuesday,
                           start_time=time(14, 0), end_time=time(16, 0),
                           room_name="Room 102", building_name="CS Block"),
            TimetableEntry(course_id=cs302.id, day_of_week=DayOfWeek.thursday,
                           start_time=time(14, 0), end_time=time(16, 0),
                           room_name="Room 102", building_name="CS Block"),
            TimetableEntry(course_id=cs205.id, day_of_week=DayOfWeek.friday,
                           start_time=time(9, 0), end_time=time(12, 0),
                           room_name="Room 103", building_name="CS Block"),
        ]
        for e in entries:
            db.add(e)

        geofence = CampusGeofence(
            name="Main Campus",
            centre_latitude=settings.CAMPUS_GEOFENCE_LAT,
            centre_longitude=settings.CAMPUS_GEOFENCE_LNG,
            radius_metres=settings.CAMPUS_GEOFENCE_RADIUS,
            is_active=True,
        )
        db.add(geofence)
        await db.flush()

        from app.core.config import settings as cfg
        study_start = date.fromisoformat(cfg.STUDY_START_DATE)
        day_map = {DayOfWeek.monday: 0, DayOfWeek.tuesday: 1, DayOfWeek.wednesday: 2,
                   DayOfWeek.thursday: 3, DayOfWeek.friday: 4}
        course_student_map = {
            cs401.id: students,
            cs302.id: students[:3],
            cs205.id: students[2:5],
        }

        for week_num in range(3):
            for entry in entries:
                day_offset = day_map[entry.day_of_week]
                class_date = study_start + timedelta(days=week_num * 7 + day_offset)
                for student in course_student_map.get(entry.course_id, []):
                    on_campus = random.random() < 0.7
                    distance = random.uniform(0, 80) if on_campus else random.uniform(150, 800)
                    db.add(ReminderLog(
                        student_id=student.id,
                        timetable_entry_id=entry.id,
                        course_id=entry.course_id,
                        reminder_type=ReminderType.on_campus if on_campus else ReminderType.off_campus,
                        was_on_campus=on_campus,
                        student_latitude=cfg.CAMPUS_GEOFENCE_LAT + random.uniform(-0.001, 0.001),
                        student_longitude=cfg.CAMPUS_GEOFENCE_LNG + random.uniform(-0.001, 0.001),
                        distance_metres=round(distance, 1),
                        fcm_delivered=random.random() < 0.95,
                        class_date=class_date,
                    ))

            week_start_date = study_start + timedelta(weeks=week_num)
            for idx, student in enumerate(students):
                q6_map = {(1, 1): "The reminders are very helpful, especially on campus.",
                          (2, 3): "I prefer not to be tracked when far from campus."}
                q6 = q6_map.get((week_num + 1, idx))
                db.add(SurveyResponse(
                    student_id=student.id,
                    survey_week=week_num + 1,
                    week_start_date=week_start_date,
                    q1_punctuality_rating=random.randint(3, 5),
                    q2_missed_classes=random.randint(0, 2),
                    q3_reminder_helpful=random.random() < 0.8,
                    q4_location_preference=random.choices(
                        [LocationPreference.on_campus_only,
                         LocationPreference.always,
                         LocationPreference.never],
                        weights=[0.6, 0.3, 0.1])[0],
                    q5_privacy_comfort=random.randint(3, 5),
                    q6_open_feedback=q6,
                ))

        await db.commit()
        logger.info("Database seeded successfully")
    except Exception as e:
        logger.error(f"Database seeding failed: {e}", exc_info=True)
        raise
