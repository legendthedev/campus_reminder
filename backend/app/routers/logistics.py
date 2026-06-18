from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order import OrderResponse
from app.schemas.user import LogisticsProfileUpdate, UserResponse
from app.services.auth import generate_id, require_role
from app.services.delivery import (
    calculate_delivery_fee,
    generate_waybill_number,
    haversine_distance,
)

router = APIRouter(prefix="/api/logistics", tags=["Logistics Portal"])

logistics_required = require_role("logistics")


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: LogisticsProfileUpdate,
    current_user: User = Depends(logistics_required),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/available-orders", response_model=list[OrderResponse])
def list_available_orders(
    current_user: User = Depends(logistics_required),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.status == OrderStatus.READY, Order.logistics_id.is_(None))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderResponse.model_validate(o) for o in orders]


@router.post("/orders/{order_id}/claim", response_model=OrderResponse)
def claim_order(
    order_id: str,
    current_user: User = Depends(logistics_required),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.status == OrderStatus.READY)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not ready")
    if order.logistics_id:
        raise HTTPException(status_code=409, detail="Order already claimed")

    order.logistics_id = current_user.id
    order.status = OrderStatus.SHIPPED
    order.waybill_number = generate_waybill_number(order_id)

    tailor = db.query(User).filter(User.id == order.tailor_id).first()
    if (
        tailor
        and tailor.business_latitude
        and tailor.business_longitude
        and order.delivery_latitude
        and order.delivery_longitude
    ):
        dist = haversine_distance(
            tailor.business_latitude,
            tailor.business_longitude,
            order.delivery_latitude,
            order.delivery_longitude,
        )
        fee_data = calculate_delivery_fee(dist)
        order.delivery_fee = fee_data["fee"]
        order.estimated_delivery = datetime.utcnow() + timedelta(days=fee_data["estimated_days"])

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.put("/orders/{order_id}/transit", response_model=OrderResponse)
def mark_in_transit(
    order_id: str,
    current_user: User = Depends(logistics_required),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.logistics_id == current_user.id,
            Order.status == OrderStatus.SHIPPED,
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = OrderStatus.IN_TRANSIT
    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.put("/orders/{order_id}/delivered", response_model=OrderResponse)
def mark_delivered(
    order_id: str,
    current_user: User = Depends(logistics_required),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.logistics_id == current_user.id,
            Order.status == OrderStatus.IN_TRANSIT,
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = OrderStatus.DELIVERED
    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.get("/my-deliveries", response_model=list[OrderResponse])
def list_my_deliveries(
    status: str | None = None,
    current_user: User = Depends(logistics_required),
    db: Session = Depends(get_db),
):
    query = db.query(Order).filter(Order.logistics_id == current_user.id)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/tracking/{waybill}", response_model=OrderResponse)
def track_by_waybill(
    waybill: str,
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.waybill_number == waybill).first()
    if not order:
        raise HTTPException(status_code=404, detail="Waybill not found")
    return OrderResponse.model_validate(order)
