import sys
import os
from fastapi.testclient import TestClient
from uuid import uuid4

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)


TEST_PHONE = f"+99499{str(uuid4().int)[:7]}"
TEST_PASSWORD = "testpassword123"


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
    assert data["phone"] == TEST_PHONE
    assert data["first_name"] == "Test"
    assert not data["is_verified"]


def test_login_unverified_user():
    response = client.post(
        "/api/v1/auth/login", json={"phone": TEST_PHONE, "password": TEST_PASSWORD}
    )

    assert response.status_code == 403
    assert "not verified" in response.json()["error"]["message"]


def test_request_otp():
    response = client.post(f"/api/v1/auth/request-otp?phone={TEST_PHONE}")
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent successfully"


def test_verify_otp_invalid():
    response = client.post(f"/api/v1/auth/verify-otp?phone={TEST_PHONE}&otp=000000")
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["error"]["message"]


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
