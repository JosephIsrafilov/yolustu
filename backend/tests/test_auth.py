import sys
import os
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)


TEST_PHONE = f"+99499{str(uuid4().int)[:7]}"
TEST_PASSWORD = "testpassword123"

def test_register_user():
    response = client.post(
        "/api/auth/register",
        json={
            "phone": TEST_PHONE,
            "first_name": "Test",
            "last_name": "User",
            "password": TEST_PASSWORD
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == TEST_PHONE
    assert data["first_name"] == "Test"
    assert data["is_verified"] == False

def test_login_unverified_user():
    response = client.post(
        "/api/auth/login",
        json={
            "phone": TEST_PHONE,
            "password": TEST_PASSWORD
        }
    )
    
    assert response.status_code == 403
    assert "not verified" in response.json()["detail"]

def test_request_otp():
    response = client.post(f"/api/auth/request-otp?phone={TEST_PHONE}")
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent successfully"




def test_verify_otp_invalid():
    response = client.post(f"/api/auth/verify-otp?phone={TEST_PHONE}&otp=000000")
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]
