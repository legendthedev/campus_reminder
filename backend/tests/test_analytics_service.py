import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date

from app.services.analytics_service import (
    get_punctuality_summary,
    get_weekly_trend,
    get_reminder_effectiveness,
)


def _make_survey_row(week, q1, q2, q3, q5, student_id="s1"):
    row = MagicMock()
    row.survey_week = week
    row.q1_punctuality_rating = q1
    row.q2_missed_classes = q2
    row.q3_reminder_helpful = q3
    row.q5_privacy_comfort = q5
    row.student_id = student_id
    return row


class TestGetPunctualitySummary:
    @pytest.mark.asyncio
    async def test_returns_none_averages_when_no_data(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute.return_value = mock_result

        result = await get_punctuality_summary(db)
        assert result["avg_punctuality"] is None
        assert result["avg_missed"] is None
        assert result["total_responses"] == 0

    @pytest.mark.asyncio
    async def test_computes_averages_correctly(self):
        db = AsyncMock()
        rows = [
            _make_survey_row(1, 4, 1, True, 4),
            _make_survey_row(1, 3, 2, False, 3),
            _make_survey_row(2, 5, 0, True, 5),
        ]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rows
        db.execute.return_value = mock_result

        result = await get_punctuality_summary(db)
        assert result["total_responses"] == 3
        assert result["avg_punctuality"] == 4.0  # (4+3+5)/3
        assert result["avg_missed"] == 1.0  # (1+2+0)/3
        assert result["helpful_pct"] == pytest.approx(66.7, rel=0.01)
        assert result["avg_privacy_comfort"] == 4.0


class TestGetWeeklyTrend:
    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_surveys(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute.return_value = mock_result

        result = await get_weekly_trend(db)
        assert result == []

    @pytest.mark.asyncio
    async def test_groups_by_week(self):
        db = AsyncMock()
        survey_rows = [
            _make_survey_row(1, 4, 1, True, 4),
            _make_survey_row(1, 3, 2, False, 3),
            _make_survey_row(2, 5, 0, True, 5),
        ]
        reminder_rows = []

        mock_survey_result = MagicMock()
        mock_survey_result.scalars.return_value.all.return_value = survey_rows
        mock_reminder_result = MagicMock()
        mock_reminder_result.scalars.return_value.all.return_value = reminder_rows

        db.execute.side_effect = [mock_survey_result, mock_reminder_result]

        result = await get_weekly_trend(db)
        assert len(result) == 2
        assert result[0]["week"] == 1
        assert result[0]["response_count"] == 2
        assert result[0]["avg_punctuality"] == 3.5
        assert result[1]["week"] == 2
        assert result[1]["response_count"] == 1


class TestGetReminderEffectiveness:
    @pytest.mark.asyncio
    async def test_insufficient_data_no_surveys(self):
        db = AsyncMock()
        mock_surveys = MagicMock()
        mock_surveys.scalars.return_value.all.return_value = []
        mock_reminders = MagicMock()
        mock_reminders.all.return_value = []
        db.execute.side_effect = [mock_surveys, mock_reminders]

        result = await get_reminder_effectiveness(db)
        assert result["correlation"] is None
        assert "Insufficient" in result["interpretation"]

    @pytest.mark.asyncio
    async def test_insufficient_data_no_reminders(self):
        db = AsyncMock()
        mock_surveys = MagicMock()
        mock_surveys.scalars.return_value.all.return_value = [
            _make_survey_row(1, 4, 1, True, 4, "s1")
        ]
        mock_reminders = MagicMock()
        mock_reminders.all.return_value = []
        db.execute.side_effect = [mock_surveys, mock_reminders]

        result = await get_reminder_effectiveness(db)
        assert result["correlation"] is None

    @pytest.mark.asyncio
    async def test_computes_correlation_with_enough_data(self):
        db = AsyncMock()
        surveys = [
            _make_survey_row(1, 5, 0, True, 5, "s1"),
            _make_survey_row(2, 4, 1, True, 4, "s2"),
            _make_survey_row(3, 3, 2, False, 3, "s3"),
        ]
        mock_surveys = MagicMock()
        mock_surveys.scalars.return_value.all.return_value = surveys

        reminder_row_1 = MagicMock()
        reminder_row_1.student_id = "s1"
        reminder_row_1.cnt = 10
        reminder_row_2 = MagicMock()
        reminder_row_2.student_id = "s2"
        reminder_row_2.cnt = 5
        reminder_row_3 = MagicMock()
        reminder_row_3.student_id = "s3"
        reminder_row_3.cnt = 2

        mock_reminders = MagicMock()
        mock_reminders.all.return_value = [reminder_row_1, reminder_row_2, reminder_row_3]

        db.execute.side_effect = [mock_surveys, mock_reminders]

        result = await get_reminder_effectiveness(db)
        assert result["correlation"] is not None
        assert isinstance(result["correlation"], float)
        assert -1.0 <= result["correlation"] <= 1.0
        assert result["interpretation"] != ""
