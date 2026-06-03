from pydantic_settings import BaseSettings
from typing import Optional
from datetime import date


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://campus_user:campus_pass@localhost:5432/campus_reminder_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-this-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FCM_SERVER_KEY: str = ""
    GOOGLE_MAPS_ANDROID_KEY: str = ""
    GOOGLE_MAPS_IOS_KEY: str = ""
    CAMPUS_GEOFENCE_LAT: float = 6.5244
    CAMPUS_GEOFENCE_LNG: float = 3.3792
    CAMPUS_GEOFENCE_RADIUS: int = 500
    STUDY_START_DATE: str = "2024-09-01"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
