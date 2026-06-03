import uuid
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class CampusGeofence(Base):
    __tablename__ = "campus_geofences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    centre_latitude = Column(Float, nullable=False)
    centre_longitude = Column(Float, nullable=False)
    radius_metres = Column(Integer, default=500)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
