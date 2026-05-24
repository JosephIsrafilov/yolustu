import sys
import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.domains.ai import router as ai_router
from main import app

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


@patch("app.domains.ai.router.OpenAI")
@patch("app.domains.ai.router.httpx.AsyncClient")
def test_pricing_suggestion_with_coords_and_ai(
    mock_async_client, mock_openai, access_token, monkeypatch
):
    monkeypatch.setattr(ai_router.settings, "NVIDIA_API_KEY", "test-api-key")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "routes": [
            {
                "distance": 360000.0,
                "duration": 18000.0,
            }
        ]
    }

    mock_client_instance = MagicMock()
    mock_client_instance.get = AsyncMock(return_value=mock_response)
    mock_async_client.return_value.__aenter__ = AsyncMock(
        return_value=mock_client_instance
    )
    mock_async_client.return_value.__aexit__ = AsyncMock(return_value=None)

    mock_completion = MagicMock()
    mock_completion.choices = [
        MagicMock(
            message=MagicMock(
                content='{"suggested_price": 19, "reasoning": "AI optimized pricing based on premium vehicle and weekend timing."}'
            )
        )
    ]
    mock_openai.return_value.chat.completions.create.return_value = mock_completion

    payload = {
        "origin": "Baku",
        "destination": "Ganja",
        "departure_time": "12:00",
        "origin_coords": {"lat": 40.4093, "lng": 49.8671},
        "destination_coords": {"lat": 40.6828, "lng": 46.3606},
        "car_model": "Mercedes E-Class",
        "seats_total": 3,
        "language": "az",
    }

    response = client.post(
        "/api/v1/ai/pricing-suggestion",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
    )

    assert response.status_code == 200
    res_data = response.json()

    assert res_data["suggested_price"] == 19
    assert "AI optimized pricing" in res_data["reasoning"]


@patch("app.domains.ai.router.OpenAI")
def test_pricing_suggestion_fallback_on_ai_failure(mock_openai, access_token):
    mock_openai.return_value.chat.completions.create.side_effect = Exception(
        "API Error"
    )

    payload = {
        "origin": "Baku",
        "destination": "Ganja",
        "departure_time": "12:00",
        "car_model": "Mercedes E-Class",
        "seats_total": 3,
        "language": "en",
    }

    response = client.post(
        "/api/v1/ai/pricing-suggestion",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
    )

    assert response.status_code == 200
    res_data = response.json()

    assert res_data["suggested_price"] == 15
    assert "Price is calculated based on market averages" in res_data["reasoning"]


@patch("app.domains.ai.router.OpenAI")
def test_generate_description_success(mock_openai, access_token, monkeypatch):
    monkeypatch.setattr(ai_router.settings, "NVIDIA_API_KEY", "test-api-key")

    mock_completion = MagicMock()
    mock_completion.choices = [
        MagicMock(
            message=MagicMock(
                content="Join me for a nice trip to Ganja. Space for bags."
            )
        )
    ]
    mock_openai.return_value.chat.completions.create.return_value = mock_completion

    payload = {
        "origin": "Baku",
        "destination": "Ganja",
        "departure_time": "12:00",
        "departure_date": "2026-06-01",
        "car_model": "Opel Astra",
        "seats_total": 3,
        "language": "en",
        "preferences": ["Music", "Non-smoking"],
    }

    response = client.post(
        "/api/v1/ai/generate-description",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
    )

    assert response.status_code == 200
    assert (
        response.json()["description"]
        == "Join me for a nice trip to Ganja. Space for bags."
    )


@patch("app.domains.ai.router.OpenAI")
def test_generate_description_fallback(mock_openai, access_token):
    mock_openai.return_value.chat.completions.create.side_effect = Exception(
        "API Error"
    )

    payload = {
        "origin": "Baku",
        "destination": "Ganja",
        "departure_time": "12:00",
        "car_model": "Opel Astra",
        "seats_total": 3,
        "language": "en",
    }

    response = client.post(
        "/api/v1/ai/generate-description",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
    )

    assert response.status_code == 200
    assert "Driving from Baku to Ganja" in response.json()["description"]
