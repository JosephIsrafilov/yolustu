import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app

client = TestClient(app)


SEED_PHONE = "+994501234567"
SEED_PASSWORD = "password123"


@pytest.fixture(scope="module")
def access_token():
    response = client.post(
        "/api/v1/auth/login", json={"phone": SEED_PHONE, "password": SEED_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["accessToken"]


def test_get_current_user_requires_auth():
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_get_current_user(access_token):
    response = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == SEED_PHONE
    assert data["first_name"] == "Elvin"


def test_update_current_user(access_token):
    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"first_name": "Elvin Updated"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Elvin Updated"

    client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"first_name": "Elvin"},
    )


def test_update_current_user_cannot_self_assign_admin_role(access_token):
    before = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert before.status_code == 200
    original_role = before.json()["role"]

    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"role": "admin"},
    )
    assert response.status_code == 400
    assert "Invalid role" in response.json()["error"]["message"]

    after = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert after.status_code == 200
    assert after.json()["role"] == original_role


def test_submit_verification_rejects_unsafe_file_types(access_token):
    response = client.post(
        "/api/v1/users/me/verify",
        headers={"Authorization": f"Bearer {access_token}"},
        files={"file": ("proof.html", b"<script>alert(1)</script>", "text/html")},
    )

    assert response.status_code == 400
    assert "Unsupported upload type" in response.json()["error"]["message"]


def test_submit_verification_rejects_mismatched_file_content(access_token):
    response = client.post(
        "/api/v1/users/me/verify",
        headers={"Authorization": f"Bearer {access_token}"},
        files={"file": ("proof.png", b"\xff\xd8\xff\xe0not-a-png", "image/png")},
    )

    assert response.status_code == 400
    assert "does not match" in response.json()["error"]["message"]


def test_submit_verification_accepts_real_pdf_and_sets_pending(
    access_token, monkeypatch
):
    monkeypatch.setattr(
        "app.domains.ai.document_review.run_document_review_task",
        lambda *args: None,
    )
    response = client.post(
        "/api/v1/users/me/verify",
        headers={"Authorization": f"Bearer {access_token}"},
        files={
            "file": (
                "license.pdf",
                b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["verification_status"] == "pending"
    assert data["is_verified"] is False
    assert data["role"] == "passenger"
    assert "/api/v1/admin/verifications/" in data["document_url"]


def test_submit_verification_rejects_oversized_file(access_token):
    oversized = b"%PDF-1.4\n" + b"0" * (5 * 1024 * 1024)
    response = client.post(
        "/api/v1/users/me/verify",
        headers={"Authorization": f"Bearer {access_token}"},
        files={"file": ("license.pdf", oversized, "application/pdf")},
    )

    assert response.status_code == 413
    assert "5MB limit" in response.json()["error"]["message"]


def test_upload_avatar_rejects_oversized_file(access_token):
    oversized = b"\x89PNG\r\n\x1a\n" + b"0" * (5 * 1024 * 1024 + 1)
    response = client.post(
        "/api/v1/users/me/avatar",
        headers={"Authorization": f"Bearer {access_token}"},
        files={"file": ("avatar.png", oversized, "image/png")},
    )

    assert response.status_code == 413
    assert "5MB limit" in response.json()["error"]["message"]
