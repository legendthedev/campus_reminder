from datetime import datetime

from pydantic import BaseModel

from app.models.storefront import ApparelCategory


class StorefrontItemCreate(BaseModel):
    title: str
    description: str | None = None
    category: ApparelCategory
    gender_target: str
    price: float
    currency: str = "USD"
    images: str | None = None
    sizes_available: str | None = None
    materials: str | None = None
    stock_count: int = 0


class StorefrontItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: ApparelCategory | None = None
    gender_target: str | None = None
    price: float | None = None
    images: str | None = None
    sizes_available: str | None = None
    materials: str | None = None
    stock_count: int | None = None
    is_active: int | None = None


class StorefrontItemResponse(BaseModel):
    id: str
    tailor_id: str
    title: str
    description: str | None = None
    category: ApparelCategory
    gender_target: str
    price: float
    currency: str
    images: str | None = None
    sizes_available: str | None = None
    materials: str | None = None
    stock_count: int
    is_active: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TailorPublicProfile(BaseModel):
    id: str
    full_name: str
    business_name: str | None = None
    business_description: str | None = None
    specializations: str | None = None
    avatar_url: str | None = None
    business_verified: bool = False

    model_config = {"from_attributes": True}
