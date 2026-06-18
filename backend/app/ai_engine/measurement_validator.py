"""
AI Engine — Measurement Verification & Clothing Recommendations

Validates body measurements for structural consistency, flags anomalies,
and provides personalized size/style recommendations.
"""

from dataclasses import dataclass

# Reasonable measurement ranges (cm) by gender
RANGES = {
    "male": {
        "chest": (76, 140),
        "waist": (60, 130),
        "hips": (76, 130),
        "shoulder_width": (38, 56),
        "arm_length": (50, 75),
        "inseam": (68, 90),
        "neck": (33, 50),
        "torso_length": (40, 60),
        "thigh": (42, 75),
    },
    "female": {
        "chest": (70, 130),
        "waist": (55, 120),
        "hips": (80, 140),
        "shoulder_width": (34, 50),
        "arm_length": (45, 68),
        "inseam": (64, 86),
        "neck": (30, 42),
        "torso_length": (36, 55),
        "thigh": (40, 72),
    },
}

RATIO_RULES = [
    ("waist", "chest", 0.60, 1.05, "Waist-to-chest ratio out of normal range"),
    ("hips", "waist", 0.90, 1.50, "Hip-to-waist ratio unusual"),
    ("shoulder_width", "waist", 0.35, 0.75, "Shoulder-to-waist proportion atypical"),
]

SIZE_MAP = {
    "XS": (0, 82),
    "S": (82, 90),
    "M": (90, 100),
    "L": (100, 110),
    "XL": (110, 120),
    "XXL": (120, 999),
}


@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    recommended_size: str
    notes: str


def validate_measurements(
    measurements: dict,
    gender: str = "male",
) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    gender_key = gender if gender in RANGES else "male"
    ranges = RANGES[gender_key]

    provided = {k: v for k, v in measurements.items() if v is not None and k in ranges}

    if len(provided) < 3:
        errors.append("At least 3 measurements are required for verification")
        return ValidationResult(
            is_valid=False,
            errors=errors,
            warnings=warnings,
            recommended_size="N/A",
            notes="Insufficient measurements provided.",
        )

    for field, value in provided.items():
        low, high = ranges[field]
        if value < low * 0.8:
            errors.append(f"{field} ({value}cm) is unusually small (expected {low}-{high}cm)")
        elif value < low:
            warnings.append(f"{field} ({value}cm) is below typical range ({low}-{high}cm)")
        elif value > high * 1.2:
            errors.append(f"{field} ({value}cm) is unusually large (expected {low}-{high}cm)")
        elif value > high:
            warnings.append(f"{field} ({value}cm) is above typical range ({low}-{high}cm)")

    for num_field, den_field, low_r, high_r, msg in RATIO_RULES:
        num = provided.get(num_field)
        den = provided.get(den_field)
        if num and den and den > 0:
            ratio = num / den
            if ratio < low_r or ratio > high_r:
                warnings.append(f"{msg} (ratio: {ratio:.2f})")

    chest = provided.get("chest", 90)
    recommended = "M"
    for size_label, (low, high) in SIZE_MAP.items():
        if low <= chest < high:
            recommended = size_label
            break

    is_valid = len(errors) == 0
    notes_parts = []
    if is_valid and not warnings:
        notes_parts.append("All measurements verified successfully.")
    elif is_valid:
        notes_parts.append("Measurements accepted with minor observations.")
    else:
        notes_parts.append("Measurement issues detected — review required.")
    notes_parts.append(f"Recommended size: {recommended}")

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        recommended_size=recommended,
        notes=" ".join(notes_parts),
    )


def get_clothing_recommendations(
    gender: str,
    category: str | None = None,
    measurements: dict | None = None,
) -> list[dict]:
    recs = []
    base = {
        "casual": [
            {"type": "T-Shirt", "tip": "Relaxed fit works best for daily comfort"},
            {"type": "Jeans", "tip": "Slim or regular fit based on thigh measurement"},
            {"type": "Sneakers", "tip": "Pair with casual tops for a complete look"},
        ],
        "traditional": [
            {"type": "Agbada", "tip": "Flowing robe — shoulder and torso length are key"},
            {"type": "Kaftan", "tip": "Loose fit — chest and arm length matter most"},
            {"type": "Dashiki", "tip": "Vibrant print shirt — standard chest sizing"},
        ],
        "corporate": [
            {"type": "Suit Jacket", "tip": "Shoulder width and chest are critical for fit"},
            {"type": "Dress Shirt", "tip": "Neck and arm length determine proper sizing"},
            {"type": "Trousers", "tip": "Waist and inseam for a tailored silhouette"},
        ],
    }

    if category and category in base:
        recs = base[category]
    else:
        for cat_items in base.values():
            recs.extend(cat_items)

    if measurements:
        result = validate_measurements(measurements, gender)
        for rec in recs:
            rec["recommended_size"] = result.recommended_size

    return recs
