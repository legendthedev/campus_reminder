from fastapi import APIRouter, Depends

from app.models.user import User
from app.schemas.order import MeasurementInput
from app.services.auth import get_current_user
from app.ai_engine.measurement_validator import (
    get_clothing_recommendations,
    validate_measurements,
)

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])


@router.post("/validate-measurements")
def validate(
    data: MeasurementInput,
    gender: str = "male",
    current_user: User = Depends(get_current_user),
):
    result = validate_measurements(data.model_dump(exclude={"unit"}), gender)
    return {
        "is_valid": result.is_valid,
        "errors": result.errors,
        "warnings": result.warnings,
        "recommended_size": result.recommended_size,
        "notes": result.notes,
    }


@router.get("/recommendations")
def recommendations(
    gender: str = "male",
    category: str | None = None,
    current_user: User = Depends(get_current_user),
):
    return get_clothing_recommendations(gender, category)
