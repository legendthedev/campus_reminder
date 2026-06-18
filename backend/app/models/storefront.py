import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ApparelCategory(str, enum.Enum):
    CASUAL = "casual"
    TRADITIONAL = "traditional"
    CORPORATE = "corporate"


class StorefrontItem(Base):
    __tablename__ = "storefront_items"

    id = Column(String, primary_key=True, index=True)
    tailor_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(ApparelCategory), nullable=False)
    gender_target = Column(String, nullable=False)  # male, female, unisex
    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    images = Column(Text, nullable=True)  # JSON list of image URLs
    sizes_available = Column(Text, nullable=True)  # JSON list
    materials = Column(Text, nullable=True)
    stock_count = Column(Integer, default=0)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tailor = relationship("User", back_populates="storefront_items")
    order_items = relationship("OrderItem", back_populates="storefront_item")
