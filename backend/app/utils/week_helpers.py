from datetime import date, timedelta
from app.core.config import settings


def get_current_week_number() -> int:
    study_start = date.fromisoformat(settings.STUDY_START_DATE)
    today = date.today()
    delta = today - study_start
    return max(1, delta.days // 7 + 1)


def get_week_start_date(week_number: int) -> date:
    study_start = date.fromisoformat(settings.STUDY_START_DATE)
    return study_start + timedelta(weeks=week_number - 1)


def get_week_for_date(d: date) -> int:
    study_start = date.fromisoformat(settings.STUDY_START_DATE)
    return max(1, (d - study_start).days // 7 + 1)
