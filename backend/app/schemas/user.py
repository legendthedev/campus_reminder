from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import GenderCategory, UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str | None = None
    full_name: str
    role: UserRole
    auth_provider: str = "email"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    token: str
    role: UserRole


class ClientProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    gender: GenderCategory | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    avatar_url: str | None = None


class TailorProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    business_name: str | None = None
    business_description: str | None = None
    specializations: str | None = None
    business_latitude: float | None = None
    business_longitude: float | None = None
    avatar_url: str | None = None


class LogisticsProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    fleet_size: str | None = None
    service_regions: str | None = None
    api_endpoint: str | None = None
    avatar_url: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: str | None = None
    phone: str | None = None
    auth_provider: str
    created_at: datetime

    # Client fields
    gender: GenderCategory | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    # Tailor fields
    business_name: str | None = None
    business_description: str | None = None
    specializations: str | None = None
    business_latitude: float | None = None
    business_longitude: float | None = None
    business_verified: bool = False

    # Logistics fields
    company_name: str | None = None
    fleet_size: str | None = None
    service_regions: str | None = None
    api_endpoint: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
