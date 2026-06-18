import math


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_delivery_fee(distance_km: float) -> dict:
    base_fee = 5.00
    per_km = 0.50
    fee = base_fee + (distance_km * per_km)
    estimated_days = max(1, int(distance_km / 200) + 1)
    return {
        "distance_km": round(distance_km, 2),
        "fee": round(fee, 2),
        "currency": "USD",
        "estimated_days": estimated_days,
    }


def generate_waybill_number(order_id: str) -> str:
    short_id = order_id[:8].upper().replace("-", "")
    return f"WB-{short_id}"
