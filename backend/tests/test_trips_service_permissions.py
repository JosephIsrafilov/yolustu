from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.trips.repositories import RideRepository, VehicleRepository
from app.domains.trips.schemas import Location, RideCreate, VehicleCreate
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
    normalized_plate: str = "99AB123"
    seats_count: int = 4
    is_active: bool = True
    is_default: bool = False
    verification_status: str = "approved"


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    vehicle_id: UUID
    created_at: datetime
    departure_time: datetime
    total_seats: int
    available_seats: int
    price_per_seat: Decimal
    origin_city: str
    destination_city: str
    intermediate_cities: str | None = None
    status: str = "active"
    description: str | None = None
    smoking_allowed: bool = False
    pets_allowed: bool = False
    music_allowed: bool = True
    female_only: bool = False
    origin_location: dict[str, float] | None = None
    destination_location: dict[str, float] | None = None
    vehicle: object | None = None
    driver: object | None = None


class FakeVehicleRepository:
    def __init__(self, vehicles: list[FakeVehicle]):
        self.vehicles: dict[UUID, FakeVehicle] = {
            vehicle.id: vehicle for vehicle in vehicles
        }

    def create(self, user_id: UUID, vehicle_in: VehicleCreate) -> FakeVehicle:
        vehicle = FakeVehicle(
            id=uuid4(),
            user_id=user_id,
            brand=vehicle_in.brand,
            model=vehicle_in.model,
            year=vehicle_in.year,
            color=vehicle_in.color,
            plate_number=vehicle_in.plate_number,
        )
        self.vehicles[vehicle.id] = vehicle
        return vehicle

    def get(self, vehicle_id: UUID) -> FakeVehicle | None:
        return self.vehicles.get(vehicle_id)

    def get_owned(self, vehicle_id: UUID, user_id: UUID) -> FakeVehicle | None:
        vehicle = self.vehicles.get(vehicle_id)
        if not vehicle or vehicle.user_id != user_id:
            return None
        return vehicle

    def list_for_user(self, user_id: UUID) -> list[FakeVehicle]:
        return [
            vehicle for vehicle in self.vehicles.values() if vehicle.user_id == user_id
        ]

    def find_active_by_plate(
        self, normalized_plate: str, exclude_id: UUID | None = None
    ) -> FakeVehicle | None:
        return next(
            (
                vehicle
                for vehicle in self.vehicles.values()
                if vehicle.normalized_plate == normalized_plate
                and vehicle.is_active
                and vehicle.id != exclude_id
            ),
            None,
        )

    def has_active_or_future_rides(self, vehicle_id: UUID) -> bool:
        return False

    def deactivate(self, vehicle: FakeVehicle) -> FakeVehicle:
        vehicle.is_active = False
        vehicle.is_default = False
        return vehicle


class FakeRideRepository:
    def __init__(self):
        self.created_vehicle_id: UUID | None = None

    def create(
        self, driver_id: UUID, vehicle_id: UUID, ride_in: RideCreate
    ) -> FakeRide:
        self.created_vehicle_id = vehicle_id
        return FakeRide(
            id=uuid4(),
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            created_at=datetime.now(timezone.utc),
            departure_time=ride_in.departure_time,
            total_seats=ride_in.total_seats,
            available_seats=ride_in.available_seats,
            price_per_seat=ride_in.price_per_seat,
            origin_city=ride_in.origin_city,
            destination_city=ride_in.destination_city,
            status=ride_in.status,
            description=ride_in.description,
            smoking_allowed=ride_in.smoking_allowed,
            pets_allowed=ride_in.pets_allowed,
            music_allowed=ride_in.music_allowed,
            female_only=ride_in.female_only,
            origin_location={"lat": ride_in.origin.lat, "lon": ride_in.origin.lon},
            destination_location={
                "lat": ride_in.destination.lat,
                "lon": ride_in.destination.lon,
            },
        )


class FakeUserRepository:
    def increment_total_rides(self, user_id: UUID) -> None:
        return None


def make_current_user(user_id: UUID, role: str) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Test",
        last_name="User",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


def make_ride_create(vehicle_id: UUID) -> RideCreate:
    return RideCreate(
        departure_time=datetime.now(timezone.utc),
        total_seats=4,
        available_seats=3,
        price_per_seat=Decimal("12.00"),
        origin_city="Baku",
        destination_city="Ganja",
        vehicle_id=vehicle_id,
        origin=Location(lat=40.4093, lon=49.8671),
        destination=Location(lat=40.6828, lon=46.3606),
    )


def make_service_with_vehicles(
    vehicles: list[FakeVehicle],
) -> tuple[TripsService, FakeVehicleRepository, FakeRideRepository]:
    service = TripsService(db=cast(Session, None))
    vehicle_repo = FakeVehicleRepository(vehicles)
    ride_repo = FakeRideRepository()
    service.vehicles = cast(VehicleRepository, vehicle_repo)
    service.rides = cast(RideRepository, ride_repo)
    service.users = cast(UserRepository, FakeUserRepository())
    return service, vehicle_repo, ride_repo


def test_vehicle_create_list_and_delete_for_owner():
    owner_id = uuid4()
    service, vehicle_repo, _ = make_service_with_vehicles([])
    owner = make_current_user(owner_id, role="driver")

    created = service.create_vehicle(
        VehicleCreate(
            brand="Kia",
            model="Rio",
            year=2019,
            color="Black",
            plate_number="10-AA-100",
        ),
        owner,
    )
    my_vehicles = service.get_my_vehicles(owner)

    assert created.user_id == owner_id
    assert len(my_vehicles) == 1
    assert my_vehicles[0].id == created.id

    response = service.delete_vehicle(created.id, owner)
    assert response["message"] == "Vehicle deactivated"
    assert vehicle_repo.get(created.id).is_active is False


def test_cannot_delete_other_users_vehicle():
    owner_id = uuid4()
    other_user_id = uuid4()
    foreign_vehicle = FakeVehicle(id=uuid4(), user_id=owner_id)
    service, _, _ = make_service_with_vehicles([foreign_vehicle])
    other_user = make_current_user(other_user_id, role="driver")

    with pytest.raises(HTTPException) as exc:
        service.delete_vehicle(foreign_vehicle.id, other_user)

    assert exc.value.status_code == 403
    assert "Not authorized" in str(exc.value.detail)


def test_create_ride_with_foreign_vehicle_is_forbidden():
    driver_id = uuid4()
    foreign_vehicle = FakeVehicle(id=uuid4(), user_id=uuid4())
    service, _, _ = make_service_with_vehicles([foreign_vehicle])
    driver = make_current_user(driver_id, role="driver")

    with pytest.raises(HTTPException) as exc:
        service.create_ride(make_ride_create(foreign_vehicle.id), driver)

    assert exc.value.status_code == 404
    assert "Vehicle not found" in str(exc.value.detail)


def test_passenger_cannot_create_ride():
    user_id = uuid4()
    own_vehicle = FakeVehicle(id=uuid4(), user_id=user_id)
    service, _, _ = make_service_with_vehicles([own_vehicle])
    passenger = make_current_user(user_id, role="passenger")

    with pytest.raises(HTTPException) as exc:
        service.create_ride(make_ride_create(own_vehicle.id), passenger)

    assert exc.value.status_code == 403
    assert "Only approved drivers can create rides" in str(exc.value.detail)


def test_deleted_vehicle_cannot_be_used_for_new_ride():
    driver_id = uuid4()
    own_vehicle = FakeVehicle(id=uuid4(), user_id=driver_id)
    service, _, _ = make_service_with_vehicles([own_vehicle])
    driver = make_current_user(driver_id, role="driver")

    service.delete_vehicle(own_vehicle.id, driver)
    with pytest.raises(HTTPException) as exc:
        service.create_ride(make_ride_create(own_vehicle.id), driver)

    assert exc.value.status_code == 409
    assert "inactive" in str(exc.value.detail)
