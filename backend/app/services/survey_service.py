from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.survey import SurveyResponse
from app.schemas.course import SurveySubmit
from app.utils.week_helpers import get_current_week_number, get_week_start_date
from app.utils.db_helpers import create_and_refresh
import uuid


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
    return await create_and_refresh(db, response)


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
