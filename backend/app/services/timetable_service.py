from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.timetable import TimetableEntry, DayOfWeek
from app.models.course import Course, CourseEnrollment
from app.schemas.course import TimetableCreate, TimetableUpdate
from app.utils.db_helpers import create_and_refresh, apply_updates
from datetime import datetime, date
import uuid


async def get_all_timetable(db: AsyncSession):
    result = await db.execute(
        select(TimetableEntry).options(selectinload(TimetableEntry.course))
    )
    return result.scalars().all()


async def get_today_timetable(db: AsyncSession):
    today = datetime.now().strftime("%A").lower()
    result = await db.execute(
        select(TimetableEntry)
        .options(selectinload(TimetableEntry.course))
        .where(TimetableEntry.day_of_week == today)
    )
    return result.scalars().all()


async def get_student_timetable(db: AsyncSession, student_id: uuid.UUID):
    result = await db.execute(
        select(TimetableEntry)
        .join(Course, Course.id == TimetableEntry.course_id)
        .join(CourseEnrollment, CourseEnrollment.course_id == Course.id)
        .options(selectinload(TimetableEntry.course))
        .where(CourseEnrollment.student_id == student_id)
    )
    return result.scalars().all()


async def create_timetable_entry(db: AsyncSession, data: TimetableCreate):
    entry = TimetableEntry(**data.model_dump())
    return await create_and_refresh(db, entry)


async def update_timetable_entry(db: AsyncSession, entry_id: uuid.UUID, data: TimetableUpdate):
    result = await db.execute(select(TimetableEntry).where(TimetableEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        return None
    apply_updates(entry, data)
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_timetable_entry(db: AsyncSession, entry_id: uuid.UUID):
    result = await db.execute(select(TimetableEntry).where(TimetableEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry:
        await db.delete(entry)
        await db.commit()
    return entry
