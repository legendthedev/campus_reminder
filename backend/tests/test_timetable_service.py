import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import time

from app.services.timetable_service import (
    get_all_timetable,
    get_today_timetable,
    get_student_timetable,
    create_timetable_entry,
    update_timetable_entry,
    delete_timetable_entry,
)


def _make_entry(entry_id=None, day="monday", course_name="CS101"):
    entry = MagicMock()
    entry.id = entry_id or uuid.uuid4()
    entry.day_of_week = day
    entry.start_time = time(9, 0)
    entry.end_time = time(11, 0)
    entry.room_name = "LT1"
    entry.building_name = "Main Block"
    entry.course = MagicMock(course_name=course_name)
    return entry


class TestGetAllTimetable:
    @pytest.mark.asyncio
    async def test_returns_all_entries(self):
        db = AsyncMock()
        entries = [_make_entry(), _make_entry(day="tuesday")]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = entries
        db.execute.return_value = mock_result

        result = await get_all_timetable(db)
        assert len(result) == 2
        db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_entries(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute.return_value = mock_result

        result = await get_all_timetable(db)
        assert result == []


class TestGetTodayTimetable:
    @pytest.mark.asyncio
    async def test_returns_today_entries(self):
        db = AsyncMock()
        entries = [_make_entry()]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = entries
        db.execute.return_value = mock_result

        result = await get_today_timetable(db)
        assert len(result) == 1
        db.execute.assert_called_once()


class TestGetStudentTimetable:
    @pytest.mark.asyncio
    async def test_returns_student_entries(self):
        db = AsyncMock()
        student_id = uuid.uuid4()
        entries = [_make_entry()]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = entries
        db.execute.return_value = mock_result

        result = await get_student_timetable(db, student_id)
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_returns_empty_for_unenrolled_student(self):
        db = AsyncMock()
        student_id = uuid.uuid4()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute.return_value = mock_result

        result = await get_student_timetable(db, student_id)
        assert result == []


class TestCreateTimetableEntry:
    @pytest.mark.asyncio
    async def test_creates_entry_and_commits(self):
        db = AsyncMock()
        data = MagicMock()
        data.model_dump.return_value = {
            "course_id": uuid.uuid4(),
            "day_of_week": "monday",
            "start_time": time(9, 0),
            "end_time": time(11, 0),
            "room_name": "LT1",
            "building_name": "Main Block",
        }

        result = await create_timetable_entry(db, data)
        db.add.assert_called_once()
        db.commit.assert_called_once()
        db.refresh.assert_called_once()


class TestUpdateTimetableEntry:
    @pytest.mark.asyncio
    async def test_updates_existing_entry(self):
        db = AsyncMock()
        entry_id = uuid.uuid4()
        existing = MagicMock()
        existing.id = entry_id

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing
        db.execute.return_value = mock_result

        update_data = MagicMock()
        update_data.model_dump.return_value = {"room_name": "LT2"}

        result = await update_timetable_entry(db, entry_id, update_data)
        assert result is not None
        db.commit.assert_called_once()
        db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_none_when_entry_not_found(self):
        db = AsyncMock()
        entry_id = uuid.uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute.return_value = mock_result

        update_data = MagicMock()
        update_data.model_dump.return_value = {"room_name": "LT2"}

        result = await update_timetable_entry(db, entry_id, update_data)
        assert result is None
        db.commit.assert_not_called()


class TestDeleteTimetableEntry:
    @pytest.mark.asyncio
    async def test_deletes_existing_entry(self):
        db = AsyncMock()
        entry_id = uuid.uuid4()
        existing = MagicMock()
        existing.id = entry_id

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing
        db.execute.return_value = mock_result

        result = await delete_timetable_entry(db, entry_id)
        assert result == existing
        db.delete.assert_called_once_with(existing)
        db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_none_when_entry_not_found(self):
        db = AsyncMock()
        entry_id = uuid.uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute.return_value = mock_result

        result = await delete_timetable_entry(db, entry_id)
        assert result is None
        db.delete.assert_not_called()
