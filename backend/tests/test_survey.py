from app.services.survey_service import get_current_week_number, get_week_start_date
from datetime import date


def test_week_number_is_positive():
    week = get_current_week_number()
    assert week >= 1


def test_week_start_date_is_date():
    start = get_week_start_date(1)
    assert isinstance(start, date)


def test_week_progression():
    w1 = get_week_start_date(1)
    w2 = get_week_start_date(2)
    assert (w2 - w1).days == 7
