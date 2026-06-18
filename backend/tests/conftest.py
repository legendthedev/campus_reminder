import pytest


@pytest.fixture(autouse=True)
def env_setup(monkeypatch):
    """Ensure test environment variables are set."""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test_db")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")
    monkeypatch.setenv("STUDY_START_DATE", "2024-09-01")
    monkeypatch.setenv("FCM_SERVER_KEY", "")
