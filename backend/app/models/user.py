import uuid
import enum
from sqlalchemy import Column, String, Boolean, Enum as SAEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class UserRole(str, enum.Enum):
    student = "student"
    lecturer = "lecturer"
    admin = "admin"


class Platform(str, enum.Enum):
    android = "android"
    ios = "ios"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(UserRole, name="userrole"), nullable=False, default=UserRole.student)
    student_id = Column(String, unique=True, nullable=True)
    fcm_token = Column(String, nullable=True)
    platform = Column(SAEnum(Platform, name="platform"), nullable=True)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollments = relationship("CourseEnrollment", back_populates="student",
                               foreign_keys="CourseEnrollment.student_id")
    courses_taught = relationship("Course", back_populates="lecturer")
    reminder_logs = relationship("ReminderLog", back_populates="student")
    notifications = relationship("Notification", back_populates="recipient")
    survey_responses = relationship("SurveyResponse", back_populates="student")
    locations = relationship("StudentLocation", back_populates="student")
