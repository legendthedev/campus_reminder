import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_login_invalid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/auth/login", json={"email": "bad@test.com", "password": "wrong"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "full_name": "Test User", "email": "testuser_unique99@test.com",
            "password": "testpass123", "role": "student", "student_id": "TST099"
        })
        assert reg.status_code == 200
        login = await client.post("/api/auth/login", json={
            "email": "testuser_unique99@test.com", "password": "testpass123"
        })
        assert login.status_code == 200
        assert "access_token" in login.json()
