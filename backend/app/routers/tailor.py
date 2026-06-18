from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.storefront import StorefrontItem
from app.models.user import User
from app.schemas.order import OrderResponse, OrderStatusUpdate, RevenueAnalytics
from app.schemas.storefront import (
    StorefrontItemCreate,
    StorefrontItemResponse,
    StorefrontItemUpdate,
)
from app.schemas.user import TailorProfileUpdate, UserResponse
from app.services.auth import generate_id, require_role

router = APIRouter(prefix="/api/tailor", tags=["Tailor Portal"])

tailor_required = require_role("tailor")


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: TailorProfileUpdate,
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/storefront", response_model=StorefrontItemResponse, status_code=201)
def create_item(
    data: StorefrontItemCreate,
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    item = StorefrontItem(
        id=generate_id(),
        tailor_id=current_user.id,
        **data.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return StorefrontItemResponse.model_validate(item)


@router.get("/storefront", response_model=list[StorefrontItemResponse])
def list_items(
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    items = (
        db.query(StorefrontItem)
        .filter(StorefrontItem.tailor_id == current_user.id)
        .order_by(StorefrontItem.created_at.desc())
        .all()
    )
    return [StorefrontItemResponse.model_validate(i) for i in items]


@router.put("/storefront/{item_id}", response_model=StorefrontItemResponse)
def update_item(
    item_id: str,
    data: StorefrontItemUpdate,
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    item = (
        db.query(StorefrontItem)
        .filter(StorefrontItem.id == item_id, StorefrontItem.tailor_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return StorefrontItemResponse.model_validate(item)


@router.delete("/storefront/{item_id}", status_code=204)
def delete_item(
    item_id: str,
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    item = (
        db.query(StorefrontItem)
        .filter(StorefrontItem.id == item_id, StorefrontItem.tailor_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.get("/orders", response_model=list[OrderResponse])
def list_orders(
    status: str | None = None,
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    query = db.query(Order).filter(Order.tailor_id == current_user.id)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.tailor_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.get("/analytics", response_model=RevenueAnalytics)
def get_analytics(
    current_user: User = Depends(tailor_required),
    db: Session = Depends(get_db),
):
    orders = db.query(Order).filter(Order.tailor_id == current_user.id).all()
    total_revenue = sum(o.total_price for o in orders if o.status == OrderStatus.DELIVERED)
    total_orders = len(orders)
    pending = sum(1 for o in orders if o.status == OrderStatus.PENDING)
    completed = sum(1 for o in orders if o.status == OrderStatus.DELIVERED)
    in_production = sum(1 for o in orders if o.status == OrderStatus.IN_PRODUCTION)
    avg = total_revenue / completed if completed > 0 else 0

    return RevenueAnalytics(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        pending_orders=pending,
        completed_orders=completed,
        in_production=in_production,
        average_order_value=round(avg, 2),
    )
