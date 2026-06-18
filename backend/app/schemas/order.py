from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus, OrderType


class MeasurementInput(BaseModel):
    chest: float | None = None
    waist: float | None = None
    hips: float | None = None
    shoulder_width: float | None = None
    arm_length: float | None = None
    inseam: float | None = None
    neck: float | None = None
    torso_length: float | None = None
    thigh: float | None = None
    unit: str = "cm"


class OrderItemCreate(BaseModel):
    storefront_item_id: str | None = None
    quantity: int = 1
    size: str | None = None
    custom_specs: str | None = None


class OrderCreate(BaseModel):
    tailor_id: str
    order_type: OrderType
    items: list[OrderItemCreate]
    measurements: MeasurementInput | None = None
    delivery_address: str | None = None
    delivery_latitude: float | None = None
    delivery_longitude: float | None = None
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: str
    client_id: str
    tailor_id: str
    logistics_id: str | None = None
    order_type: OrderType
    status: OrderStatus
    total_price: float
    delivery_fee: float
    delivery_address: str | None = None
    waybill_number: str | None = None
    estimated_delivery: datetime | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DeliveryFeeRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float


class DeliveryFeeResponse(BaseModel):
    distance_km: float
    fee: float
    currency: str = "USD"
    estimated_days: int


class RevenueAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    pending_orders: int
    completed_orders: int
    in_production: int
    average_order_value: float
    currency: str = "USD"
