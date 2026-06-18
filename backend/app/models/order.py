import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    READY = "ready"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class OrderType(str, enum.Enum):
    READY_MADE = "ready_made"
    BESPOKE = "bespoke"


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    tailor_id = Column(String, ForeignKey("users.id"), nullable=False)
    logistics_id = Column(String, ForeignKey("users.id"), nullable=True)
    order_type = Column(Enum(OrderType), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_price = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0)
    delivery_address = Column(Text, nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    waybill_number = Column(String, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("User", back_populates="client_orders", foreign_keys=[client_id])
    tailor = relationship("User", back_populates="tailor_orders", foreign_keys=[tailor_id])
    items = relationship("OrderItem", back_populates="order")
    measurements = relationship("CustomerMeasurement", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    storefront_item_id = Column(String, ForeignKey("storefront_items.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    size = Column(String, nullable=True)
    custom_specs = Column(Text, nullable=True)  # JSON for bespoke orders

    order = relationship("Order", back_populates="items")
    storefront_item = relationship("StorefrontItem", back_populates="order_items")


class CustomerMeasurement(Base):
    __tablename__ = "customer_measurements"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    chest = Column(Float, nullable=True)
    waist = Column(Float, nullable=True)
    hips = Column(Float, nullable=True)
    shoulder_width = Column(Float, nullable=True)
    arm_length = Column(Float, nullable=True)
    inseam = Column(Float, nullable=True)
    neck = Column(Float, nullable=True)
    torso_length = Column(Float, nullable=True)
    thigh = Column(Float, nullable=True)
    unit = Column(String, default="cm")
    ai_verified = Column(Integer, default=0)
    ai_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="measurements")
