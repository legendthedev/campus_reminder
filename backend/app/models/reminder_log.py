import uuid
import enum
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, Date, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReminderType(str, enum.Enum):
    on_campus = "on_campus"
    off_campus = "off_campus"


class NotificationType(str, enum.Enum):
    class_reminder = "class_reminder"
    announcement = "announcement"
    survey_invite = "survey_invite"


class StudentLocation(Base):
    __tablename__ = "student_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_on_campus = Column(Boolean, nullable=False)
    distance_metres = Column(Float, nullable=False)
    platform = Column(String, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="locations")


class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    timetable_entry_id = Column(UUID(as_uuid=True), ForeignKey("timetable_entries.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    reminder_type = Column(Enum(ReminderType), nullable=False)
    was_on_campus = Column(Boolean, nullable=False)
    student_latitude = Column(Float, nullable=True)
    student_longitude = Column(Float, nullable=True)
    distance_metres = Column(Float, nullable=True)
    fcm_delivered = Column(Boolean, default=False)
    class_date = Column(Date, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="reminder_logs")
    timetable_entry = relationship("TimetableEntry", back_populates="reminder_logs")
    course = relationship("Course", back_populates="reminder_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("User", back_populates="notifications")
