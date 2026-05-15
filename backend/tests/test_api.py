from main import app
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Yolüstü API"}


def test_request_otp():
    response = client.post("/api/auth/request-otp?phone=%2B994501234567")
    assert response.status_code == 200
    assert response.json() == {"message": "success", "phone": "+994501234567"}
