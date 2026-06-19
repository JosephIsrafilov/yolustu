from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.trips.repositories import RideRepository, VehicleRepository
from app.domains.trips.schemas import Location, RideCreate, VehicleCreate, VehicleUpdate
from app.domains.trips.services import TripsService


@dataclass
class FakeVehicle:
    id: UUID
    user_id: UUID
    plate_number: str
    normalized_plate: str
    seats_count: int = 4
    brand: str = "Toyota"
    model: str = "Prius"
    year: int = 2020
    color: str = "White"
    variations: str | None = None
    is_active: bool = True
    is_default: bool = False
    verification_status: str = "approved"
    created_at: datetime = datetime(2026, 1, 1, tzinfo=timezone.utc)


class FakeVehicles:
    def __init__(self, vehicles: list[FakeVehicle] | None = None):
        self.items = {vehicle.id: vehicle for vehicle in vehicles or []}
        self.blocked_vehicle_ids: set[UUID] = set()

    def get(self, vehicle_id: UUID):
        return self.items.get(vehicle_id)

    def get_owned(self, vehicle_id: UUID, user_id: UUID):
        vehicle = self.get(vehicle_id)
        return vehicle if vehicle and vehicle.user_id == user_id else None

    def list_for_user(self, user_id: UUID):
        return [vehicle for vehicle in self.items.values() if vehicle.user_id == user_id]

    def find_active_by_plate(self, normalized_plate: str, exclude_id=None):
        return next(
            (
                vehicle
                for vehicle in self.items.values()
                if vehicle.normalized_plate == normalized_plate
                and vehicle.is_active
                and vehicle.id != exclude_id
            ),
            None,
        )

    def create(self, user_id: UUID, vehicle_in: VehicleCreate):
        active = [v for v in self.items.values() if v.user_id == user_id and v.is_active]
        vehicle = FakeVehicle(
            id=uuid4(),
            user_id=user_id,
            plate_number=vehicle_in.plate_number,
            normalized_plate="".join(
                char for char in vehicle_in.plate_number if char.isalnum()
            ),
            seats_count=vehicle_in.seats_count,
            is_default=not active,
        )
        self.items[vehicle.id] = vehicle
        return vehicle

    def update(self, vehicle: FakeVehicle, update_data: dict):
        for field, value in update_data.items():
            setattr(vehicle, field, value)
        return vehicle

    def set_default(self, vehicle: FakeVehicle):
        for candidate in self.items.values():
            if candidate.user_id == vehicle.user_id:
                candidate.is_default = candidate.id == vehicle.id
        return vehicle

    def has_active_or_future_rides(self, vehicle_id: UUID):
        return vehicle_id in self.blocked_vehicle_ids

    def deactivate(self, vehicle: FakeVehicle):
        vehicle.is_active = False
        was_default = vehicle.is_default
        vehicle.is_default = False
        if was_default:
            replacement = next(
                (
                    candidate
                    for candidate in self.items.values()
                    if candidate.user_id == vehicle.user_id and candidate.is_active
                ),
                None,
            )
            if replacement:
                replacement.is_default = True
        return vehicle


class FakeRides:
    def create(self, driver_id, vehicle_id, ride_in):
        return type(
            "RideResult",
            (),
            {
                "id": uuid4(),
                "driver_id": driver_id,
                "vehicle_id": vehicle_id,
                "created_at": datetime.now(timezone.utc),
                "share_token": "token",
                "departure_time": ride_in.departure_time,
                "total_seats": ride_in.total_seats,
                "available_seats": ride_in.available_seats,
                "price_per_seat": ride_in.price_per_seat,
                "origin_city": ride_in.origin_city,
                "destination_city": ride_in.destination_city,
                "intermediate_cities": None,
                "status": ride_in.status,
                "description": None,
                "available_spots": ride_in.available_spots,
                "smoking_allowed": False,
                "pets_allowed": False,
                "music_allowed": True,
                "female_only": False,
                "origin_location": ride_in.origin,
                "destination_location": ride_in.destination,
                "vehicle": None,
                "driver": None,
            },
        )()


def current_user(user_id: UUID, role: str = "driver") -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Test",
        last_name="Driver",
        role=role,
        is_verified=True,
        is_blocked=False,
        verification_status="approved",
    )


def service_with(vehicles: list[FakeVehicle] | None = None):
    service = TripsService(cast(Session, None))
    vehicle_repo = FakeVehicles(vehicles)
    service.vehicles = cast(VehicleRepository, vehicle_repo)
    service.rides = cast(RideRepository, FakeRides())
    service.users = cast(UserRepository, object())
    return service, vehicle_repo


def ride_create(vehicle_id: UUID, total_seats: int = 4) -> RideCreate:
    return RideCreate(
        vehicle_id=vehicle_id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        total_seats=total_seats,
        available_seats=total_seats,
        price_per_seat=Decimal("10"),
        origin_city="Baku",
        destination_city="Ganja",
        origin=Location(lat=40.4, lon=49.8),
        destination=Location(lat=40.7, lon=46.3),
    )


def test_first_active_vehicle_is_default_and_plate_is_normalized():
    owner_id = uuid4()
    service, _ = service_with()

    vehicle = service.create_vehicle(
        VehicleCreate(
            brand="Kia",
            model="Rio",
            year=2022,
            color="Black",
            plate_number=" 99-ab 123 ",
        ),
        current_user(owner_id),
    )

    assert vehicle.normalized_plate == "99AB123"
    assert vehicle.is_active is True
    assert vehicle.is_default is True


def test_duplicate_active_normalized_plate_is_rejected():
    existing = FakeVehicle(uuid4(), uuid4(), "99-AB-123", "99AB123")
    service, _ = service_with([existing])

    with pytest.raises(HTTPException) as exc:
        service.create_vehicle(
            VehicleCreate(
                brand="Kia",
                model="Rio",
                year=2022,
                color="Black",
                plate_number="99 ab 123",
            ),
            current_user(uuid4()),
        )

    assert exc.value.status_code == 409


def test_owner_or_admin_can_get_vehicle_but_foreign_driver_cannot():
    owner_id = uuid4()
    vehicle = FakeVehicle(uuid4(), owner_id, "10-AA-100", "10AA100")
    service, _ = service_with([vehicle])

    assert service.get_vehicle(vehicle.id, current_user(owner_id)) is vehicle
    assert service.get_vehicle(vehicle.id, current_user(uuid4(), "admin")) is vehicle
    with pytest.raises(HTTPException) as exc:
        service.get_vehicle(vehicle.id, current_user(uuid4()))
    assert exc.value.status_code == 403


def test_inactive_vehicle_and_excess_capacity_are_rejected_for_ride():
    owner_id = uuid4()
    inactive = FakeVehicle(
        uuid4(), owner_id, "10-AA-100", "10AA100", seats_count=3, is_active=False
    )
    service, _ = service_with([inactive])
    with pytest.raises(HTTPException) as exc:
        service.create_ride(ride_create(inactive.id, 3), current_user(owner_id))
    assert exc.value.status_code == 409

    inactive.is_active = True
    with pytest.raises(HTTPException) as exc:
        service.create_ride(ride_create(inactive.id, 4), current_user(owner_id))
    assert exc.value.status_code == 400


def test_set_default_requires_active_vehicle():
    owner_id = uuid4()
    first = FakeVehicle(
        uuid4(), owner_id, "10-AA-100", "10AA100", is_default=True
    )
    second = FakeVehicle(uuid4(), owner_id, "10-BB-200", "10BB200")
    service, _ = service_with([first, second])

    result = service.set_default_vehicle(second.id, current_user(owner_id))
    assert result.is_default is True
    assert first.is_default is False

    second.is_active = False
    with pytest.raises(HTTPException) as exc:
        service.set_default_vehicle(second.id, current_user(owner_id))
    assert exc.value.status_code == 409


def test_deactivation_blocks_dependencies_and_reassigns_default():
    owner_id = uuid4()
    first = FakeVehicle(
        uuid4(), owner_id, "10-AA-100", "10AA100", is_default=True
    )
    second = FakeVehicle(uuid4(), owner_id, "10-BB-200", "10BB200")
    service, repo = service_with([first, second])
    repo.blocked_vehicle_ids.add(first.id)

    with pytest.raises(HTTPException) as exc:
        service.delete_vehicle(first.id, current_user(owner_id))
    assert exc.value.status_code == 409

    repo.blocked_vehicle_ids.clear()
    response = service.delete_vehicle(first.id, current_user(owner_id))
    assert response == {"message": "Vehicle deactivated"}
    assert first.is_active is False
    assert second.is_default is True


def test_patch_plate_rechecks_normalized_duplicate():
    owner_id = uuid4()
    first = FakeVehicle(uuid4(), owner_id, "10-AA-100", "10AA100")
    second = FakeVehicle(uuid4(), owner_id, "10-BB-200", "10BB200")
    service, _ = service_with([first, second])

    with pytest.raises(HTTPException) as exc:
        service.update_vehicle(
            second.id,
            VehicleUpdate(plate_number="10 aa 100"),
            current_user(owner_id),
        )
    assert exc.value.status_code == 409


def test_inactive_vehicle_may_share_an_active_plate():
    owner_id = uuid4()
    active = FakeVehicle(uuid4(), owner_id, "10-AA-100", "10AA100")
    inactive = FakeVehicle(
        uuid4(), owner_id, "10-BB-200", "10BB200", is_active=False
    )
    service, _ = service_with([active, inactive])

    result = service.update_vehicle(
        inactive.id,
        VehicleUpdate(plate_number="10 aa 100"),
        current_user(owner_id),
    )

    assert result.normalized_plate == "10AA100"
