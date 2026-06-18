import pytest
from datetime import timedelta
from jose import jwt
from fastapi import HTTPException

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings


class TestPasswordHashing:
    def test_hash_and_verify_correct_password(self):
        password = "securepass123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        hashed = get_password_hash("correct_pass")
        assert verify_password("wrong_pass", hashed) is False

    def test_hash_is_not_plaintext(self):
        password = "mypassword"
        hashed = get_password_hash(password)
        assert hashed != password

    def test_hash_different_each_time(self):
        password = "samepassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2

    def test_long_password_truncated_at_72_bytes(self):
        long_pass = "a" * 100
        hashed = get_password_hash(long_pass)
        assert verify_password(long_pass, hashed) is True

    def test_empty_password(self):
        hashed = get_password_hash("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


class TestAccessToken:
    def test_create_access_token_contains_sub(self):
        data = {"sub": "user-123", "role": "student"}
        token = create_access_token(data)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "user-123"
        assert payload["role"] == "student"
        assert payload["type"] == "access"

    def test_create_access_token_has_exp(self):
        token = create_access_token({"sub": "user-1"})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload

    def test_create_access_token_custom_expiry(self):
        token = create_access_token({"sub": "u1"}, expires_delta=timedelta(minutes=5))
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload

    def test_access_token_does_not_mutate_input(self):
        data = {"sub": "user-1"}
        original = data.copy()
        create_access_token(data)
        assert data == original


class TestRefreshToken:
    def test_create_refresh_token_contains_sub(self):
        token = create_refresh_token({"sub": "user-456"})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "user-456"
        assert payload["type"] == "refresh"

    def test_refresh_token_has_exp(self):
        token = create_refresh_token({"sub": "u2"})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload


class TestDecodeToken:
    def test_decode_valid_token(self):
        token = create_access_token({"sub": "user-789", "role": "admin"})
        payload = decode_token(token)
        assert payload["sub"] == "user-789"
        assert payload["role"] == "admin"

    def test_decode_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.string")
        assert exc_info.value.status_code == 401

    def test_decode_tampered_token_raises_401(self):
        token = create_access_token({"sub": "user-1"})
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(HTTPException) as exc_info:
            decode_token(tampered)
        assert exc_info.value.status_code == 401

    def test_decode_token_wrong_secret_raises_401(self):
        token = jwt.encode({"sub": "u1", "exp": 9999999999}, "wrong-secret", algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        assert exc_info.value.status_code == 401
