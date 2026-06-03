from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, require_lecturer_or_admin
from app.models.user import User, UserRole
from app.models.reminder_log import ReminderLog
from app.schemas.user import UserOut, UserUpdate
from app.services.survey_service import get_student_surveys
from app.services.timetable_service import get_student_timetable
from app.core.redis import get_location
from typing import List
import uuid

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=List[UserOut])
async def list_students(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_lecturer_or_admin),
):
    result = await db.execute(select(User).where(User.role == UserRole.student))
    return result.scalars().all()


@router.get("/{student_id}", response_model=UserOut)
async def get_student(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}", response_model=UserOut)
async def update_student(student_id: uuid.UUID, data: UserUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(student, k, v)
    await db.commit()
    await db.refresh(student)
    return student


@router.delete("/{student_id}")
async def delete_student(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(require_lecturer_or_admin)):
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = False
    await db.commit()
    return {"message": "Student deactivated"}


@router.get("/{student_id}/timetable")
async def student_timetable(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_student_timetable(db, student_id)


@router.get("/{student_id}/reminder-history")
async def student_reminders(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.student_id == student_id).order_by(ReminderLog.sent_at.desc()))
    return result.scalars().all()


@router.get("/{student_id}/survey-responses")
async def student_surveys(student_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await get_student_surveys(db, student_id)


@router.get("/{student_id}/location")
async def student_location(student_id: uuid.UUID, current_user=Depends(require_lecturer_or_admin)):
    loc = await get_location(str(student_id))
    return loc or {"message": "No recent location data"}
