from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.survey import SurveyResponse
from app.models.reminder_log import ReminderLog, StudentLocation
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.timetable import TimetableEntry
from app.core.redis import get_location
from app.utils.week_helpers import get_week_for_date
from datetime import date, datetime, timezone, timedelta
import pandas as pd
import numpy as np


async def get_punctuality_summary(db: AsyncSession):
    result = await db.execute(select(SurveyResponse))
    rows = result.scalars().all()
    if not rows:
        return {"avg_punctuality": None, "avg_missed": None, "total_responses": 0}
    df = pd.DataFrame([{
        "week": r.survey_week,
        "q1": r.q1_punctuality_rating,
        "q2": r.q2_missed_classes,
        "q3": r.q3_reminder_helpful,
        "q5": r.q5_privacy_comfort,
    } for r in rows])
    return {
        "avg_punctuality": round(float(df["q1"].mean()), 2),
        "avg_missed": round(float(df["q2"].mean()), 2),
        "total_responses": len(df),
        "helpful_pct": round(float(df["q3"].mean() * 100), 1),
        "avg_privacy_comfort": round(float(df["q5"].mean()), 2),
    }


async def get_weekly_trend(db: AsyncSession):
    result = await db.execute(select(SurveyResponse).order_by(SurveyResponse.survey_week))
    rows = result.scalars().all()
    if not rows:
        return []
    df = pd.DataFrame([{
        "week": r.survey_week,
        "q1": r.q1_punctuality_rating,
        "q2": r.q2_missed_classes,
    } for r in rows])
    grouped = df.groupby("week").agg(
        avg_punctuality=("q1", "mean"),
        avg_missed=("q2", "mean"),
        response_count=("q1", "count"),
    ).reset_index()

    rl = await db.execute(select(ReminderLog))
    rl_rows = rl.scalars().all()
    reminder_counts = {}
    if rl_rows:
        rdf = pd.DataFrame([{"class_date": r.class_date} for r in rl_rows])
        rdf["week"] = rdf["class_date"].apply(get_week_for_date)
        reminder_counts = rdf.groupby("week").size().to_dict()

    trend = []
    for _, row in grouped.iterrows():
        w = int(row["week"])
        trend.append({
            "week": w,
            "avg_punctuality": round(float(row["avg_punctuality"]), 2),
            "avg_missed": round(float(row["avg_missed"]), 2),
            "response_count": int(row["response_count"]),
            "reminder_count": reminder_counts.get(w, 0),
        })
    return trend


async def get_reminder_effectiveness(db: AsyncSession):
    surveys = await db.execute(select(SurveyResponse))
    s_rows = surveys.scalars().all()
    reminders = await db.execute(
        select(ReminderLog.student_id, func.count(ReminderLog.id).label("cnt"))
        .group_by(ReminderLog.student_id)
    )
    r_rows = reminders.all()

    if not s_rows or not r_rows:
        return {"correlation": None, "interpretation": "Insufficient data"}

    s_map = {}
    for s in s_rows:
        sid = str(s.student_id)
        if sid not in s_map:
            s_map[sid] = []
        s_map[sid].append(s.q1_punctuality_rating)

    r_map = {str(r.student_id): r.cnt for r in r_rows}
    data = []
    for sid, ratings in s_map.items():
        if sid in r_map:
            data.append({"reminder_count": r_map[sid], "avg_q1": np.mean(ratings)})

    if len(data) < 3:
        return {"correlation": None, "interpretation": "Insufficient data"}

    df = pd.DataFrame(data)
    corr = float(df["reminder_count"].corr(df["avg_q1"]))

    if corr > 0.5:
        interpretation = "Strong positive correlation — more reminders associated with higher punctuality ratings"
    elif corr > 0.2:
        interpretation = "Moderate positive correlation — students who received more reminders rated punctuality slightly higher"
    elif corr > -0.2:
        interpretation = "Weak or no correlation — reminder count shows little relationship with punctuality ratings"
    else:
        interpretation = "Negative correlation — unexpected pattern; review data quality"

    return {"correlation": round(corr, 3), "interpretation": interpretation}


async def get_platform_breakdown(db: AsyncSession):
    result = await db.execute(
        select(User.platform, func.count(User.id))
        .where(User.role == "student", User.is_active == True)
        .group_by(User.platform)
    )
    rows = result.all()
    breakdown = {"android": 0, "ios": 0, "unknown": 0}
    for platform, count in rows:
        key = str(platform.value) if platform else "unknown"
        breakdown[key] = count

    rl = await db.execute(
        select(ReminderLog.student_id)
    )
    return breakdown


async def get_geofence_stats(db: AsyncSession):
    today = date.today()
    result = await db.execute(
        select(ReminderLog)
        .where(ReminderLog.class_date == today)
    )
    today_logs = result.scalars().all()
    on_campus = sum(1 for l in today_logs if l.was_on_campus)
    off_campus = sum(1 for l in today_logs if not l.was_on_campus)
    return {
        "reminders_today": len(today_logs),
        "on_campus_reminders": on_campus,
        "off_campus_reminders": off_campus,
    }
