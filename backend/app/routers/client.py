from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import CustomerMeasurement, Order, OrderItem, OrderType
from app.models.storefront import StorefrontItem
from app.models.user import User
from app.schemas.order import (
    DeliveryFeeRequest,
    DeliveryFeeResponse,
    OrderCreate,
    OrderResponse,
)
from app.schemas.storefront import StorefrontItemResponse, TailorPublicProfile
from app.schemas.user import ClientProfileUpdate, UserResponse
from app.services.auth import generate_id, require_role
from app.services.delivery import calculate_delivery_fee, haversine_distance
from app.ai_engine.measurement_validator import validate_measurements

router = APIRouter(prefix="/api/client", tags=["Client Portal"])

client_required = require_role("client")


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: ClientProfileUpdate,
    current_user: User = Depends(client_required),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/marketplace", response_model=list[StorefrontItemResponse])
def browse_marketplace(
    category: str | None = None,
    gender: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(client_required),
    db: Session = Depends(get_db),
):
    query = db.query(StorefrontItem).filter(StorefrontItem.is_active == 1)
    if category:
        query = query.filter(StorefrontItem.category == category)
    if gender:
        query = query.filter(
            StorefrontItem.gender_target.in_([gender, "unisex"])
        )
    if min_price is not None:
        query = query.filter(StorefrontItem.price >= min_price)
    if max_price is not None:
        query = query.filter(StorefrontItem.price <= max_price)
    if search:
        query = query.filter(StorefrontItem.title.ilike(f"%{search}%"))

    items = query.offset(skip).limit(limit).all()
    return [StorefrontItemResponse.model_validate(i) for i in items]


@router.get("/tailors", response_model=list[TailorPublicProfile])
def browse_tailors(
    current_user: User = Depends(client_required),
    db: Session = Depends(get_db),
):
    tailors = (
        db.query(User)
        .filter(User.role == "tailor", User.is_active.is_(True))
        .all()
    )
    return [TailorPublicProfile.model_validate(t) for t in tailors]


@router.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(client_required),
    db: Session = Depends(get_db),
):
    tailor = db.query(User).filter(User.id == data.tailor_id, User.role == "tailor").first()
    if not tailor:
        raise HTTPException(status_code=404, detail="Tailor not found")

    total_price = 0.0
    order_id = generate_id()

    order = Order(
        id=order_id,
        client_id=current_user.id,
        tailor_id=data.tailor_id,
        order_type=data.order_type,
        total_price=0,
        delivery_address=data.delivery_address,
        delivery_latitude=data.delivery_latitude,
        delivery_longitude=data.delivery_longitude,
        notes=data.notes,
    )
    db.add(order)

    for item_data in data.items:
        unit_price = 0.0
        if item_data.storefront_item_id:
            sf_item = db.query(StorefrontItem).filter(
                StorefrontItem.id == item_data.storefront_item_id
            ).first()
            if sf_item:
                unit_price = sf_item.price
        elif item_data.custom_specs:
            unit_price = 50.0  # Base price for bespoke

        item = OrderItem(
            id=generate_id(),
            order_id=order_id,
            storefront_item_id=item_data.storefront_item_id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            size=item_data.size,
            custom_specs=item_data.custom_specs,
        )
        db.add(item)
        total_price += unit_price * item_data.quantity

    if data.measurements and data.order_type == OrderType.BESPOKE:
        m = data.measurements
        measurement = CustomerMeasurement(
            id=generate_id(),
            order_id=order_id,
            client_id=current_user.id,
            chest=m.chest,
            waist=m.waist,
            hips=m.hips,
            shoulder_width=m.shoulder_width,
            arm_length=m.arm_length,
            inseam=m.inseam,
            neck=m.neck,
            torso_length=m.torso_length,
            thigh=m.thigh,
            unit=m.unit,
        )
        gender = current_user.gender.value if current_user.gender else "male"
        validation = validate_measurements(m.model_dump(), gender)
        measurement.ai_verified = 1 if validation.is_valid else 0
        measurement.ai_notes = validation.notes
        db.add(measurement)

    # Calculate delivery fee
    delivery_fee = 0.0
    if data.delivery_latitude and data.delivery_longitude and tailor.business_latitude and tailor.business_longitude:
        dist = haversine_distance(
            tailor.business_latitude, tailor.business_longitude,
            data.delivery_latitude, data.delivery_longitude,
        )
        fee_data = calculate_delivery_fee(dist)
        delivery_fee = fee_data["fee"]

    order.total_price = total_price
    order.delivery_fee = delivery_fee
    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.get("/orders", response_model=list[OrderResponse])
def list_orders(
    current_user: User = Depends(client_required),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.client_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: User = Depends(client_required),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.client_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)


@router.post("/delivery-fee", response_model=DeliveryFeeResponse)
def estimate_delivery_fee(
    data: DeliveryFeeRequest,
    current_user: User = Depends(client_required),
):
    dist = haversine_distance(data.origin_lat, data.origin_lng, data.dest_lat, data.dest_lng)
    return DeliveryFeeResponse(**calculate_delivery_fee(dist))
