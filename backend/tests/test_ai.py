import sys
import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
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

@patch("app.domains.ai.router.settings")
@patch("app.domains.ai.router.OpenAI")
@patch("app.domains.ai.router.httpx.AsyncClient")
def test_pricing_suggestion_with_coords(mock_async_client, mock_openai_class, mock_settings, access_token):
    # Setup mocks
    mock_settings.NVIDIA_API_KEY = "dummy-key"
    
    # Mock OSRM response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "routes": [
            {
                "distance": 360000.0,  # 360 km
                "duration": 18000.0,   # 300 minutes (5 hours)
            }
        ]
    }
    
    # httpx.AsyncClient is an async context manager
    mock_client_instance = MagicMock()
    mock_client_instance.get = AsyncMock(return_value=mock_response)
    
    # Setup async context manager mock
    mock_async_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
    mock_async_client.return_value.__aexit__ = AsyncMock(return_value=None)
    
    # Mock OpenAI Completion
    mock_openai_instance = MagicMock()
    mock_openai_class.return_value = mock_openai_instance
    
    mock_chat = MagicMock()
    mock_openai_instance.chat = mock_chat
    
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"suggested_price": 18, "reasoning": "The suggested price is 18 AZN based on the 360.0 km driving distance and estimated fuel costs."}'
    mock_completion.choices = [mock_choice]
    mock_chat.completions.create.return_value = mock_completion

    # Execute request
    payload = {
        "origin": "Baku",
        "destination": "Ganja",
        "departure_time": "12:00",
        "origin_coords": {"lat": 40.4093, "lng": 49.8671},
        "destination_coords": {"lat": 40.6828, "lng": 46.3606},
        "car_model": "Mercedes E-Class",
        "seats_total": 3
    }
    
    response = client.post(
        "/api/v1/ai/pricing-suggestion",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload
    )
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["suggested_price"] == 18
    assert "360.0 km" in res_data["reasoning"]

    # Verify OSRM was called with correct coords (lng first)
    mock_client_instance.get.assert_called_once_with(
        "https://router.project-osrm.org/route/v1/driving/49.8671,40.4093;46.3606,40.6828?overview=false",
        timeout=5.0
    )


@patch("app.domains.ai.router.settings")
@patch("app.domains.ai.router.OpenAI")
def test_pricing_suggestion_without_coords(mock_openai_class, mock_settings, access_token):
    # Setup mocks
    mock_settings.NVIDIA_API_KEY = "dummy-key"
    
    # Mock OpenAI Completion
    mock_openai_instance = MagicMock()
    mock_openai_class.return_value = mock_openai_instance
    
    mock_chat = MagicMock()
    mock_openai_instance.chat = mock_chat
    
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"suggested_price": 15, "reasoning": "The suggested price is 15 AZN for the route Baku to Ganja."}'
    mock_completion.choices = [mock_choice]
    mock_chat.completions.create.return_value = mock_completion

    payload = {
        "origin": "Baku",
        "destination": "Ganja",
        "departure_time": "12:00",
        "car_model": "Mercedes E-Class",
        "seats_total": 3
    }
    
    response = client.post(
        "/api/v1/ai/pricing-suggestion",
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload
    )
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["suggested_price"] == 15
    assert "Baku to Ganja" in res_data["reasoning"]
