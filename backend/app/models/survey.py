import uuid
import enum
from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, Date
from sqlalchemy import Enum as SAEnum, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class LocationPreference(str, enum.Enum):
    on_campus_only = "on_campus_only"
    always = "always"
    never = "never"


class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    __table_args__ = (
        UniqueConstraint("student_id", "survey_week", name="uq_student_survey_week"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    survey_week = Column(Integer, nullable=False)
    week_start_date = Column(Date, nullable=False)
    q1_punctuality_rating = Column(Integer, nullable=False)
    q2_missed_classes = Column(Integer, nullable=False)
    q3_reminder_helpful = Column(Boolean, nullable=False)
    q4_location_preference = Column(SAEnum(LocationPreference, name="locationpreference"), nullable=False)
    q5_privacy_comfort = Column(Integer, nullable=False)
    q6_open_feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="survey_responses")
