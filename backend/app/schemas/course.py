from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime, time, date
from app.models.timetable import DayOfWeek
from app.models.survey import LocationPreference


# Course schemas
class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    lecturer_id: UUID


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    lecturer_id: Optional[UUID] = None


class CourseOut(BaseModel):
    id: UUID
    course_code: str
    course_name: str
    lecturer_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class EnrollRequest(BaseModel):
    student_id: UUID


# Timetable schemas
class TimetableCreate(BaseModel):
    course_id: UUID
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room_name: str
    building_name: str


class TimetableUpdate(BaseModel):
    day_of_week: Optional[DayOfWeek] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_name: Optional[str] = None
    building_name: Optional[str] = None


class TimetableOut(BaseModel):
    id: UUID
    course_id: UUID
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room_name: str
    building_name: str
    created_at: datetime

    class Config:
        from_attributes = True


# Geofence schemas
class GeofenceCreate(BaseModel):
    name: str
    centre_latitude: float
    centre_longitude: float
    radius_metres: int = 500


class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    centre_latitude: Optional[float] = None
    centre_longitude: Optional[float] = None
    radius_metres: Optional[int] = None
    is_active: Optional[bool] = None


class GeofenceOut(BaseModel):
    id: UUID
    name: str
    centre_latitude: float
    centre_longitude: float
    radius_metres: int
    is_active: bool

    class Config:
        from_attributes = True


class CheckPositionRequest(BaseModel):
    latitude: float
    longitude: float
    platform: Optional[str] = None


class CheckPositionResponse(BaseModel):
    is_on_campus: bool
    distance_metres: float
    campus_name: str
    radius_metres: int


# Survey schemas
class SurveySubmit(BaseModel):
    q1_punctuality_rating: int = Field(ge=1, le=5)
    q2_missed_classes: int = Field(ge=0, le=50)
    q3_reminder_helpful: bool
    q4_location_preference: LocationPreference
    q5_privacy_comfort: int = Field(ge=1, le=5)
    q6_open_feedback: Optional[str] = Field(default=None, max_length=2000)


class SurveyOut(BaseModel):
    id: UUID
    student_id: UUID
    survey_week: int
    week_start_date: date
    q1_punctuality_rating: int
    q2_missed_classes: int
    q3_reminder_helpful: bool
    q4_location_preference: LocationPreference
    q5_privacy_comfort: int
    q6_open_feedback: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


# Notification schemas
class NotificationBroadcast(BaseModel):
    title: str
    body: str
    target: str = "all"


class NotificationOut(BaseModel):
    id: UUID
    recipient_id: UUID
    title: str
    body: str
    type: str
    is_read: bool
    sent_at: datetime

    class Config:
        from_attributes = True


# Analytics schemas
class WeeklyTrend(BaseModel):
    week: int
    avg_punctuality: float
    avg_missed: float
    reminder_count: int
    response_count: int


class AnalyticsSummary(BaseModel):
    total_students: int
    total_courses: int
    reminders_today: int
    students_on_campus: int
    avg_punctuality_this_week: Optional[float]
    survey_response_rate: Optional[float]
    android_users: int
    ios_users: int
