import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.campus_geofence import CampusGeofence
from app.models.reminder_log import StudentLocation
from app.core.redis import set_location, get_location
from datetime import datetime, timezone


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def get_active_geofence(db: AsyncSession):
    result = await db.execute(select(CampusGeofence).where(CampusGeofence.is_active == True))
    return result.scalar_one_or_none()


async def check_position(db: AsyncSession, student_id: str, latitude: float, longitude: float, platform: str = None):
    geofence = await get_active_geofence(db)
    if not geofence:
        return {"is_on_campus": False, "distance_metres": 9999.0, "campus_name": "Unknown", "radius_metres": 500}

    distance = haversine_distance(latitude, longitude, geofence.centre_latitude, geofence.centre_longitude)
    is_on_campus = distance <= geofence.radius_metres

    location_data = {
        "latitude": latitude,
        "longitude": longitude,
        "is_on_campus": is_on_campus,
        "distance_metres": round(distance, 1),
        "platform": platform,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    await set_location(student_id, location_data)

    import uuid
    loc = StudentLocation(
        student_id=uuid.UUID(student_id),
        latitude=latitude,
        longitude=longitude,
        is_on_campus=is_on_campus,
        distance_metres=round(distance, 1),
        platform=platform,
    )
    db.add(loc)
    await db.commit()

    return {
        "is_on_campus": is_on_campus,
        "distance_metres": round(distance, 1),
        "campus_name": geofence.name,
        "radius_metres": geofence.radius_metres,
    }


async def get_cached_location(student_id: str):
    return await get_location(student_id)
