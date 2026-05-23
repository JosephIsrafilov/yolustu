import sys
import os
from fastapi.testclient import TestClient
from uuid import uuid4

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)


TEST_PHONE = f"+99499{str(uuid4().int)[:7]}"
TEST_PASSWORD = "testpassword123"
SEED_PHONE = "+994501234567"
SEED_PASSWORD = "password123"


def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "phone": TEST_PHONE,
            "first_name": "Test",
            "last_name": "User",
            "password": TEST_PASSWORD,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["phone"] == TEST_PHONE
    assert data["user"]["first_name"] == "Test"
    assert not data["user"]["is_verified"]


def test_register_user_with_driver_role():
    driver_phone = f"+99498{str(uuid4().int)[:7]}"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "phone": driver_phone,
            "first_name": "Driver",
            "last_name": "User",
            "password": TEST_PASSWORD,
            "role": "driver",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["phone"] == driver_phone
    assert data["user"]["role"] == "driver"


def test_register_user_without_role_defaults_to_passenger():
    passenger_phone = f"+99497{str(uuid4().int)[:7]}"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "phone": passenger_phone,
            "first_name": "Default",
            "last_name": "Passenger",
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["phone"] == passenger_phone
    assert data["user"]["role"] == "passenger"


def test_login_registered_user_returns_tokens_and_user():
    response = client.post(
        "/api/v1/auth/login", json={"phone": TEST_PHONE, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["phone"] == TEST_PHONE


def test_login_verified_user_returns_tokens_and_user():
    response = client.post(
        "/api/v1/auth/login", json={"phone": SEED_PHONE, "password": SEED_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["phone"] == SEED_PHONE
    assert data["user"]["is_verified"] is True


def test_request_otp():
    response = client.post(f"/api/v1/auth/request-otp?phone={TEST_PHONE}")
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent successfully"


def test_verify_otp_invalid():
    response = client.post(f"/api/v1/auth/verify-otp?phone={TEST_PHONE}&otp=000000")
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["error"]["message"]


def test_refresh_token_contract(redis_mock):
    previous_get = redis_mock.get.side_effect
    previous_get_return = redis_mock.get.return_value

    token_value = "refresh-token-123"

    def _get(key):
        if key == f"refresh_token:{token_value}":
            return "+994501234567"
        return None

    redis_mock.get.side_effect = _get

    try:
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refreshToken": token_value},
        )
        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert data["user"]["phone"] == "+994501234567"
    finally:
        redis_mock.get.side_effect = previous_get
        redis_mock.get.return_value = previous_get_return


def test_request_otp_rate_limit():
    # We trigger request_otp multiple times to hit the 5/minute rate limit
    responses = []
    # Make 6 requests
    for _ in range(6):
        response = client.post(f"/api/v1/auth/request-otp?phone={TEST_PHONE}")
        responses.append(response)

    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes


def test_verify_otp_rate_limit():
    # We trigger verify_otp multiple times to hit the 10/minute rate limit
    responses = []
    # Make 11 requests
    for _ in range(11):
        response = client.post(f"/api/v1/auth/verify-otp?phone={TEST_PHONE}&otp=000000")
        responses.append(response)

    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
