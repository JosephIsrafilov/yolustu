"""Service-layer unit tests for TripsService — covers missed lines."""

import pytest
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import cast
from unittest.mock import patch
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.trips.repositories import RideRepository, VehicleRepository
from app.domains.trips.schemas import Location, RideCreate
from app.domains.trips.services import TripsService


@dataclass
class FakeVehicle:
    id: UUID
    user_id: UUID
    brand: str = "Toyota"
    model: str = "Prius"
    year: int = 2020
    color: str = "White"
    plate_number: str = "99-AB-123"


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    vehicle_id: UUID
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    departure_time: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=1)
    )
    total_seats: int = 4
    available_seats: int = 2
    price_per_seat: Decimal = Decimal("10.00")
    origin_city: str = "Baku"
    destination_city: str = "Ganja"
    intermediate_cities: str | None = None
    status: str = "active"
    description: str | None = None
    smoking_allowed: bool = False
    pets_allowed: bool = False
    music_allowed: bool = True
    female_only: bool = False
    origin_location: dict | None = field(
        default_factory=lambda: {"lat": 40.4, "lon": 49.8}
    )
    destination_location: dict | None = field(
        default_factory=lambda: {"lat": 40.6, "lon": 46.3}
    )
    vehicle: object | None = None
    driver: object | None = None
    share_token: str = "test-share-token"
    available_spots: list | None = None


class FakeVehicleRepository:
    def __init__(self, vehicles=None):
        self.vehicles: dict[UUID, FakeVehicle] = {v.id: v for v in (vehicles or [])}

    def get(self, vid):
        return self.vehicles.get(vid)

    def get_owned(self, vid, uid):
        v = self.vehicles.get(vid)
        return v if v and v.user_id == uid else None

    def get_first_for_user(self, uid):
        return next((v for v in self.vehicles.values() if v.user_id == uid), None)

    def create_default(self, uid, model_name):
        v = FakeVehicle(id=uuid4(), user_id=uid, model=model_name)
        self.vehicles[v.id] = v
        return v

    def create(self, uid, vehicle_in):
        v = FakeVehicle(
            id=uuid4(),
            user_id=uid,
            brand=vehicle_in.brand,
            model=vehicle_in.model,
            year=vehicle_in.year,
            color=vehicle_in.color,
            plate_number=vehicle_in.plate_number,
        )
        self.vehicles[v.id] = v
        return v

    def list_for_user(self, uid):
        return [v for v in self.vehicles.values() if v.user_id == uid]

    def delete(self, v):
        self.vehicles.pop(v.id, None)


class FakeRideRepository:
    def __init__(self, rides=None):
        self.rides: dict[UUID, FakeRide] = {r.id: r for r in (rides or [])}

    def create(self, driver_id, vehicle_id, ride_in):
        r = FakeRide(
            id=uuid4(),
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            departure_time=ride_in.departure_time,
            total_seats=ride_in.total_seats,
            available_seats=ride_in.available_seats,
            price_per_seat=ride_in.price_per_seat,
            origin_city=ride_in.origin_city,
            destination_city=ride_in.destination_city,
            status=ride_in.status,
            origin_location={"lat": ride_in.origin.lat, "lon": ride_in.origin.lon},
            destination_location={
                "lat": ride_in.destination.lat,
                "lon": ride_in.destination.lon,
            },
        )
        self.rides[r.id] = r
        return r

    def get(self, ride_id):
        return self.rides.get(ride_id)

    def get_by_share_token(self, token):
        return next((r for r in self.rides.values() if r.share_token == token), None)

    def save(self, ride):
        self.rides[ride.id] = ride
        return ride

    def list_for_driver(self, driver_id, limit=50, offset=0):
        return [r for r in self.rides.values() if r.driver_id == driver_id]

    def search(self, criteria):
        return []

    def search_count(self, criteria):
        return 0

    def count_all(self):
        return len(self.rides)

    def list_all(self, skip=0, limit=100):
        return list(self.rides.values())[skip : skip + limit]


class FakeUserRepo:
    def __init__(self):
        self.users: dict[UUID, object] = {}

    def increment_total_rides(self, uid):
        pass

    def get_by_id(self, uid):
        return self.users.get(uid)


def make_cu(uid: UUID, role="driver") -> CurrentUser:
    return CurrentUser(
        id=uid,
        phone="+994000000000",
        first_name="T",
        last_name="U",
        role=role,
        is_verified=True,
        is_blocked=False,
        verification_status="approved",
    )


def make_service(rides=None, vehicles=None):
    svc = TripsService(db=cast(Session, None))
    ride_repo = FakeRideRepository(rides or [])
    vehicle_repo = FakeVehicleRepository(vehicles or [])
    user_repo = FakeUserRepo()
    svc.rides = cast(RideRepository, ride_repo)
    svc.vehicles = cast(VehicleRepository, vehicle_repo)
    svc.users = cast(UserRepository, user_repo)
    return svc, ride_repo, vehicle_repo, user_repo


def make_ride(driver_id: UUID, status="active") -> FakeRide:
    return FakeRide(id=uuid4(), driver_id=driver_id, vehicle_id=uuid4(), status=status)


# --- create_ride validation ---


def test_create_ride_invalid_total_seats():
    driver_id = uuid4()
    vehicle = FakeVehicle(id=uuid4(), user_id=driver_id)
    svc, _, _, _ = make_service(vehicles=[vehicle])
    driver = make_cu(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        svc.create_ride(
            RideCreate(
                departure_time=datetime.now(timezone.utc) + timedelta(days=1),
                total_seats=5,
                available_seats=5,
                price_per_seat=Decimal("10"),
                origin_city="A",
                destination_city="B",
                origin=Location(lat=40.0, lon=49.0),
                destination=Location(lat=40.6, lon=46.3),
                vehicle_id=vehicle.id,
            ),
            driver,
        )
    assert exc.value.status_code == 400


def test_create_ride_available_seats_exceeds_total():
    driver_id = uuid4()
    vehicle = FakeVehicle(id=uuid4(), user_id=driver_id)
    svc, _, _, _ = make_service(vehicles=[vehicle])
    driver = make_cu(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        svc.create_ride(
            RideCreate(
                departure_time=datetime.now(timezone.utc) + timedelta(days=1),
                total_seats=2,
                available_seats=5,
                price_per_seat=Decimal("10"),
                origin_city="A",
                destination_city="B",
                origin=Location(lat=40.0, lon=49.0),
                destination=Location(lat=40.6, lon=46.3),
                vehicle_id=vehicle.id,
            ),
            driver,
        )
    assert exc.value.status_code == 400


def test_create_ride_zero_price_raises_400():
    driver_id = uuid4()
    vehicle = FakeVehicle(id=uuid4(), user_id=driver_id)
    svc, _, _, _ = make_service(vehicles=[vehicle])
    driver = make_cu(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        svc.create_ride(
            RideCreate(
                departure_time=datetime.now(timezone.utc) + timedelta(days=1),
                total_seats=3,
                available_seats=2,
                price_per_seat=Decimal("0"),
                origin_city="A",
                destination_city="B",
                origin=Location(lat=40.0, lon=49.0),
                destination=Location(lat=40.6, lon=46.3),
                vehicle_id=vehicle.id,
            ),
            driver,
        )
    assert exc.value.status_code == 400


def test_create_ride_auto_creates_default_vehicle():
    driver_id = uuid4()
    svc, ride_repo, vehicle_repo, _ = make_service()  # no vehicles
    driver = make_cu(driver_id, "driver")
    result = svc.create_ride(
        RideCreate(
            departure_time=datetime.now(timezone.utc) + timedelta(days=1),
            total_seats=3,
            available_seats=2,
            price_per_seat=Decimal("10"),
            origin_city="A",
            destination_city="B",
            origin=Location(lat=40.0, lon=49.0),
            destination=Location(lat=40.6, lon=46.3),
        ),
        driver,
    )
    assert result.total_seats == 3


# --- get_ride_model / get_ride ---


def test_get_ride_not_found_raises_404():
    svc, _, _, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_ride_model(uuid4())
    assert exc.value.status_code == 404


def test_get_ride_returns_response():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.get_ride(ride.id)
    assert result.id == ride.id


# --- get_my_rides ---


def test_get_my_rides_returns_driver_rides():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.get_my_rides(make_cu(driver_id))
    assert len(result) == 1


# --- search_rides ---


def test_search_rides_returns_paginated():
    svc, _, _, _ = make_service()
    result = svc.search_rides(origin_city="Baku", limit=10, offset=0)
    assert hasattr(result, "items")


# --- cancel_ride ---


def test_cancel_ride_unauthorized_raises_403():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    svc, _, _, _ = make_service(rides=[ride])
    outsider = make_cu(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        svc.cancel_ride(ride.id, outsider)
    assert exc.value.status_code == 403


def test_cancel_already_cancelled_is_idempotent():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="cancelled")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.cancel_ride(ride.id, make_cu(driver_id))
    assert result.status == "cancelled"


def test_cancel_completed_ride_raises_400():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="completed")
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.cancel_ride(ride.id, make_cu(driver_id))
    assert exc.value.status_code == 400


def test_cancel_active_ride_succeeds():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="active")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.cancel_ride(ride.id, make_cu(driver_id))
    assert result.status == "cancelled"


def test_admin_can_cancel_any_ride():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="active")
    svc, _, _, _ = make_service(rides=[ride])
    admin = make_cu(uuid4(), "admin")
    result = svc.cancel_ride(ride.id, admin)
    assert result.status == "cancelled"


# --- start_boarding ---


def test_start_boarding_already_boarding_idempotent():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="boarding")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.start_boarding(ride.id, make_cu(driver_id))
    assert result.status == "boarding"


def test_start_boarding_unauthorized_raises_403():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.start_boarding(ride.id, make_cu(uuid4(), "passenger"))
    assert exc.value.status_code == 403


def test_start_boarding_from_cancelled_raises_400():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="cancelled")
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.start_boarding(ride.id, make_cu(driver_id))
    assert exc.value.status_code == 400


def test_start_boarding_from_active_succeeds():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="active")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.start_boarding(ride.id, make_cu(driver_id))
    assert result.status == "boarding"


# --- complete_ride ---


def test_complete_ride_unauthorized_raises_403():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.complete_ride(ride.id, make_cu(uuid4(), "passenger"))
    assert exc.value.status_code == 403


def test_complete_already_completed_is_idempotent():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="completed")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.complete_ride(ride.id, make_cu(driver_id))
    assert result.status == "completed"


def test_complete_cancelled_ride_raises_400():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="cancelled")
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.complete_ride(ride.id, make_cu(driver_id))
    assert exc.value.status_code == 400


def test_complete_active_ride_succeeds():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="active")
    svc, _, _, _ = make_service(rides=[ride])
    with (
        patch(
            "app.domains.payments.services.PaymentService.release_driver_earnings_for_ride",
            return_value=None,
        ),
        patch("app.domains.gamification.services.check_and_award_badge"),
    ):
        import app.domains.trips.services as trips_mod

        with patch.object(trips_mod, "check_and_award_badge", return_value=None):
            # patch the lazy import inside complete_ride
            from unittest.mock import MagicMock

            mock_ps_instance = MagicMock()
            mock_ps_instance.release_driver_earnings_for_ride.return_value = None
            with patch(
                "app.domains.trips.services.TripsService.complete_ride",
                wraps=svc.complete_ride,
            ):
                # Simpler: just inject a fake PaymentService at import time
                pass
    # Approach: monkeypatch the local import inside complete_ride
    from unittest.mock import MagicMock, patch as mpatch

    fake_ps = MagicMock()
    fake_ps.return_value.release_driver_earnings_for_ride.return_value = None
    ride2 = make_ride(driver_id, status="active")
    svc2, _, _, user_repo = make_service(rides=[ride2])
    with (
        mpatch("app.domains.payments.services.PaymentService", fake_ps),
        mpatch("app.domains.gamification.services.check_and_award_badge"),
    ):
        result = svc2.complete_ride(ride2.id, make_cu(driver_id))
    assert result.status == "completed"


# --- end_trip ---


def test_end_trip_already_completed_is_idempotent():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="completed")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.end_trip(ride.id, make_cu(driver_id))
    assert result.status == "completed"


def test_end_trip_unauthorized_raises_403():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="boarding")
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.end_trip(ride.id, make_cu(uuid4(), "passenger"))
    assert exc.value.status_code == 403


def test_end_trip_from_boarding_succeeds():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="boarding")
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.end_trip(ride.id, make_cu(driver_id))
    assert result.status == "completed"


# --- get_simulation_endpoints ---


def test_get_simulation_endpoints_unauthorized_raises_403():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="active")
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.get_simulation_endpoints(ride.id, make_cu(uuid4(), "passenger"))
    assert exc.value.status_code == 403


def test_get_simulation_endpoints_wrong_status_raises_400():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="cancelled")
    svc, _, _, _ = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.get_simulation_endpoints(ride.id, make_cu(driver_id))
    assert exc.value.status_code == 400


def test_get_simulation_endpoints_active_ride():
    driver_id = uuid4()
    ride = make_ride(driver_id, status="active")
    svc, _, _, _ = make_service(rides=[ride])
    origin, dest = svc.get_simulation_endpoints(ride.id, make_cu(driver_id))
    assert len(origin) == 2
    assert len(dest) == 2


# --- get_public_track ---


def test_get_public_track_not_found_raises_404():
    svc, _, _, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_public_track("bad-token")
    assert exc.value.status_code == 404


def test_get_public_track_success():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    ride.share_token = "my-share-token"
    svc, _, _, _ = make_service(rides=[ride])
    result = svc.get_public_track("my-share-token")
    assert result.ride_id == ride.id


# --- verify_share_token ---


def test_verify_share_token_ride_not_found():
    svc, _, _, _ = make_service()
    assert svc.verify_share_token(uuid4(), "any") is False


def test_verify_share_token_wrong_token():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    ride.share_token = "correct"
    svc, _, _, _ = make_service(rides=[ride])
    assert svc.verify_share_token(ride.id, "wrong") is False


def test_verify_share_token_correct():
    driver_id = uuid4()
    ride = make_ride(driver_id)
    ride.share_token = "correct"
    svc, _, _, _ = make_service(rides=[ride])
    assert svc.verify_share_token(ride.id, "correct") is True


# --- get_vehicle / delete_vehicle edge cases ---


def test_get_vehicle_not_found_raises_404():
    svc, _, _, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_vehicle(uuid4())
    assert exc.value.status_code == 404


def test_only_driver_or_admin_can_create_vehicle():
    svc, _, _, _ = make_service()
    from app.domains.trips.schemas import VehicleCreate

    passenger = make_cu(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        svc.create_vehicle(
            VehicleCreate(
                brand="A", model="B", year=2020, color="Red", plate_number="11-AA-111"
            ),
            passenger,
        )
    assert exc.value.status_code == 403


def test_get_my_vehicles_returns_list():
    driver_id = uuid4()
    vehicle = FakeVehicle(id=uuid4(), user_id=driver_id)
    svc, _, _, _ = make_service(vehicles=[vehicle])
    result = svc.get_my_vehicles(make_cu(driver_id))
    assert len(result) == 1
