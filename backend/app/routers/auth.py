from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    GoogleAuthRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth import (
    create_access_token,
    generate_id,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if data.auth_provider == "email" and not data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password required for email registration",
        )

    user = User(
        id=generate_id(),
        email=data.email,
        hashed_password=hash_password(data.password) if data.password else None,
        full_name=data.full_name,
        role=data.role,
        auth_provider=data.auth_provider,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Accepts a Google ID token, verifies it, and creates/logs in the user.
    In production, verify the token with Google's API.
    For MVP, we trust the frontend-verified token and extract the email.
    """
    import json
    import base64

    try:
        parts = data.token.split(".")
        if len(parts) >= 2:
            padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
            email = payload.get("email", "")
            name = payload.get("name", email.split("@")[0])
        else:
            raise ValueError("Invalid token format")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google token",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=generate_id(),
            email=email,
            full_name=name,
            role=data.role,
            auth_provider="google",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
