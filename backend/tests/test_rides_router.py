import os
import sys
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app
from app.domains.trips.services import TripsService
from app.domains.trips.tracking import tracking_manager


client = TestClient(app)

SEED_PHONE = "+994501234567"
SEED_PASSWORD = "password123"


def get_access_token() -> str:
    response = client.post(
        "/api/v1/auth/login", json={"phone": SEED_PHONE, "password": SEED_PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def sample_ride_response():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid4()),
        "driver_id": str(uuid4()),
        "vehicle_id": str(uuid4()),
        "created_at": now,
        "departure_time": now,
        "total_seats": 4,
        "available_seats": 3,
        "price_per_seat": 12.0,
        "origin_city": "Baku",
        "destination_city": "Ganja",
        "intermediate_cities": None,
        "status": "active",
        "description": "Demo ride",
        "smoking_allowed": False,
        "pets_allowed": False,
        "music_allowed": True,
        "female_only": False,
        "origin_location": {"lat": 40.4093, "lon": 49.8671},
        "destination_location": {"lat": 40.6828, "lon": 46.3606},
        "vehicle": None,
        "driver": None,
    }


def test_rides_create_endpoint(monkeypatch):
    monkeypatch.setattr(
        TripsService,
        "create_ride",
        lambda self, ride_in, current_user: sample_ride_response(),
    )
    token = get_access_token()

    response = client.post(
        "/api/v1/rides/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": str(uuid4()),
            "departure_time": datetime.now(timezone.utc).isoformat(),
            "total_seats": 4,
            "available_seats": 4,
            "price_per_seat": 15,
            "origin_city": "Baku",
            "destination_city": "Ganja",
            "origin": {"lat": 40.4, "lon": 49.8},
            "destination": {"lat": 40.7, "lon": 46.3},
        },
    )

    assert response.status_code == 200
    assert response.json()["origin_city"] == "Baku"


def test_rides_search_endpoint(monkeypatch):
    monkeypatch.setattr(
        TripsService,
        "search_rides",
        lambda self, **kwargs: {
            "items": [sample_ride_response()],
            "total": 1,
            "page": 1,
            "size": 50,
            "pages": 1,
        },
    )

    response = client.get(
        "/api/v1/rides/search?origin_city=Baku&dest_city=Ganja&min_seats=1"
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("items"), list)
    assert data["items"][0]["destination_city"] == "Ganja"


def test_rides_detail_endpoint(monkeypatch):
    ride = sample_ride_response()
    monkeypatch.setattr(TripsService, "get_ride", lambda self, ride_id: ride)

    response = client.get(f"/api/v1/rides/{ride['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == ride["id"]


def test_rides_my_endpoint(monkeypatch):
    monkeypatch.setattr(
        TripsService,
        "get_my_rides",
        lambda self, current_user, **kwargs: [sample_ride_response()],
    )
    token = get_access_token()

    response = client.get(
        "/api/v1/rides/my", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_driver_can_start_trip_simulation(monkeypatch):
    ride_id = uuid4()
    started: dict[str, object] = {}
    monkeypatch.setattr(
        TripsService,
        "get_simulation_endpoints",
        lambda self, requested_id, current_user: (
            (40.4093, 49.8671),
            (40.6828, 46.3606),
        ),
    )
    monkeypatch.setattr(
        tracking_manager,
        "start_simulation",
        lambda requested_id, origin, destination: started.update(
            ride_id=requested_id,
            origin=origin,
            destination=destination,
        ),
    )

    response = client.post(
        f"/api/v1/rides/{ride_id}/simulate",
        headers={"Authorization": f"Bearer {get_access_token()}"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "started", "ride_id": str(ride_id)}
    assert started["ride_id"] == ride_id


def test_ending_simulation_runs_full_ride_completion(monkeypatch):
    ride = sample_ride_response()
    ride["status"] = "completed"
    completed: list[UUID] = []
    stopped: list[UUID] = []
    monkeypatch.setattr(
        TripsService,
        "complete_ride",
        lambda self, ride_id, current_user: completed.append(ride_id) or ride,
    )
    monkeypatch.setattr(
        tracking_manager,
        "stop_simulation",
        lambda ride_id: stopped.append(ride_id),
    )

    response = client.post(
        f"/api/v1/rides/{ride['id']}/end",
        headers={"Authorization": f"Bearer {get_access_token()}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert completed == [UUID(ride["id"])]
    assert stopped == [UUID(ride["id"])]
