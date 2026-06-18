import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    CLIENT = "client"
    TAILOR = "tailor"
    LOGISTICS = "logistics"


class GenderCategory(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    UNISEX = "unisex"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    auth_provider = Column(String, default="email")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Client-specific
    gender = Column(Enum(GenderCategory), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Tailor-specific
    business_name = Column(String, nullable=True)
    business_description = Column(Text, nullable=True)
    specializations = Column(Text, nullable=True)  # JSON list
    business_latitude = Column(Float, nullable=True)
    business_longitude = Column(Float, nullable=True)
    business_verified = Column(Boolean, default=False)

    # Logistics-specific
    company_name = Column(String, nullable=True)
    fleet_size = Column(String, nullable=True)
    service_regions = Column(Text, nullable=True)  # JSON list
    api_endpoint = Column(String, nullable=True)

    # Relationships
    storefront_items = relationship("StorefrontItem", back_populates="tailor")
    client_orders = relationship(
        "Order", back_populates="client", foreign_keys="Order.client_id"
    )
    tailor_orders = relationship(
        "Order", back_populates="tailor", foreign_keys="Order.tailor_id"
    )
    sent_messages = relationship(
        "ChatMessage", back_populates="sender", foreign_keys="ChatMessage.sender_id"
    )
