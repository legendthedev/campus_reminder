from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.survey import SurveyResponse
from app.schemas.course import SurveySubmit
from app.core.config import settings
from datetime import date, timedelta
import uuid


def get_current_week_number() -> int:
    study_start = date.fromisoformat(settings.STUDY_START_DATE)
    today = date.today()
    delta = today - study_start
    return max(1, delta.days // 7 + 1)


def get_week_start_date(week_number: int) -> date:
    study_start = date.fromisoformat(settings.STUDY_START_DATE)
    return study_start + timedelta(weeks=week_number - 1)


async def submit_survey(db: AsyncSession, student_id: uuid.UUID, data: SurveySubmit):
    week = get_current_week_number()
    existing = await db.execute(
        select(SurveyResponse).where(
            SurveyResponse.student_id == student_id,
            SurveyResponse.survey_week == week,
        )
    )
    if existing.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Already submitted survey for this week")

    week_start = get_week_start_date(week)
    response = SurveyResponse(
        student_id=student_id,
        survey_week=week,
        week_start_date=week_start,
        **data.model_dump(),
    )
    db.add(response)
    await db.commit()
    await db.refresh(response)
    return response


async def get_student_surveys(db: AsyncSession, student_id: uuid.UUID):
    result = await db.execute(
        select(SurveyResponse)
        .where(SurveyResponse.student_id == student_id)
        .order_by(SurveyResponse.survey_week)
    )
    return result.scalars().all()


async def get_all_surveys(db: AsyncSession):
    result = await db.execute(select(SurveyResponse).order_by(SurveyResponse.survey_week))
    return result.scalars().all()


async def check_submitted(db: AsyncSession, student_id: uuid.UUID, week: int) -> bool:
    result = await db.execute(
        select(SurveyResponse).where(
            SurveyResponse.student_id == student_id,
            SurveyResponse.survey_week == week,
        )
    )
    return result.scalar_one_or_none() is not None
