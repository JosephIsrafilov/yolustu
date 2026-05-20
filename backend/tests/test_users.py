import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)


SEED_PHONE = "+994501234567"
SEED_PASSWORD = "password123"

@pytest.fixture(scope="module")
def access_token():
    response = client.post(
        "/api/v1/auth/login",
        json={"phone": SEED_PHONE, "password": SEED_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]

def test_get_current_user(access_token):
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == SEED_PHONE
    assert data["first_name"] == "Elvin"

def test_update_current_user(access_token):
    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"first_name": "Elvin Updated"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Elvin Updated"

    
    client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"first_name": "Elvin"}
    )
