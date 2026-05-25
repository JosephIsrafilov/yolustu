from dataclasses import dataclass
from datetime import datetime, timezone
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser, get_current_user_from_token
from app.domains.identity.models import User
from app.domains.identity.repositories import UserRepository
from app.domains.identity.services import IdentityService
from app.domains.identity.schemas import UserUpdate
from app.domains.trips.schemas import Location, RideCreate
from app.domains.trips.services import TripsService


@dataclass
class FakeUser:
    id: UUID
    phone: str
    first_name: str
    last_name: str
    role: str
    is_blocked: bool
    is_verified: bool
    verification_status: str


class FakeUserRepository:
    def __init__(self, users: list[FakeUser]):
        self.users = {u.phone: u for u in users}

    def get_by_phone(self, phone: str) -> FakeUser | None:
        return self.users.get(phone)


def test_blocked_user_raises_403_in_get_current_user():
    user = FakeUser(
        id=uuid4(),
        phone="+994509999999",
        first_name="Blocked",
        last_name="User",
        role="passenger",
        is_blocked=True,
        is_verified=True,
        verification_status="none",
    )
    repo = FakeUserRepository([user])
    
    # We can mock the UserRepository on dependencies module
    from app.domains.identity import dependencies
    original_repo = dependencies.UserRepository
    dependencies.UserRepository = lambda db: repo  # type: ignore

    try:
        from jose import jwt
        from app.core.config import settings
        token = jwt.encode({"sub": user.phone}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        with pytest.raises(HTTPException) as exc:
            get_current_user_from_token(token, cast(Session, None))
        
        assert exc.value.status_code == 403
        assert "blocked" in str(exc.value.detail).lower()
    finally:
        dependencies.UserRepository = original_repo


def test_cannot_self_promote_role():
    # Setup service with mocked UserRepository
    class MockUserRepo:
        def __init__(self, db):
            pass
        def get_by_id(self, user_id):
            return User(id=user_id, role="passenger")
        def update(self, user, user_in):
            return user

    service = IdentityService(db=cast(Session, None))
    service.users = cast(UserRepository, MockUserRepo(None))

    current_user = CurrentUser(
        id=uuid4(),
        phone="+994500000000",
        first_name="Test",
        last_name="User",
        role="passenger",
        is_verified=True,
        is_blocked=False,
        verification_status="none",
    )

    # Elevate role to driver
    with pytest.raises(HTTPException) as exc:
        service.update_current_user(current_user, UserUpdate(role="driver"))
    assert exc.value.status_code == 400
    assert "Invalid role" in str(exc.value.detail)

    # Elevate role to admin
    with pytest.raises(HTTPException) as exc:
        service.update_current_user(current_user, UserUpdate(role="admin"))
    assert exc.value.status_code == 400
    assert "Invalid role" in str(exc.value.detail)


def test_approved_driver_vs_unapproved_driver_create_ride():
    class DummyVehicle:
        id = uuid4()

    class MockVehicleRepo:
        def get_owned(self, vehicle_id, user_id):
            return DummyVehicle()

    service = TripsService(db=cast(Session, None))
    service.vehicles = cast(any, MockVehicleRepo())

    ride_in = RideCreate(
        departure_time=datetime.now(timezone.utc),
        total_seats=4,
        available_seats=3,
        price_per_seat=10.0,
        origin_city="Baku",
        destination_city="Ganja",
        vehicle_id=uuid4(),
        origin=Location(lat=40.0, lon=49.0),
        destination=Location(lat=40.5, lon=46.0),
    )

    from app.domains.trips import services
    original_ride_to_response = services.ride_to_response
    services.ride_to_response = lambda ride: ride  # type: ignore

    try:
        # 1. Approved driver should be allowed (will try to call repo.create)
        approved_driver = CurrentUser(
            id=uuid4(), phone="+1", first_name="A", last_name="B",
            role="driver", is_verified=True, is_blocked=False, verification_status="approved"
        )
        class DummyRideRepo:
            def create(self, driver_id, vehicle_id, ride_in):
                return object()
        service.rides = cast(any, DummyRideRepo())
        # Should not raise 403 (will raise AttributeError on 'object' object has no attribute 'id', but not 403!)
        try:
            service.create_ride(ride_in, approved_driver)
        except AttributeError:
            pass
        except HTTPException as exc:
            assert exc.status_code != 403

        # 2. Pending driver -> 403
        pending_driver = CurrentUser(
            id=uuid4(), phone="+1", first_name="A", last_name="B",
            role="driver", is_verified=False, is_blocked=False, verification_status="pending"
        )
        with pytest.raises(HTTPException) as exc:
            service.create_ride(ride_in, pending_driver)
        assert exc.value.status_code == 403
        assert "Only approved drivers" in str(exc.value.detail)

        # 3. Rejected driver -> 403
        rejected_driver = CurrentUser(
            id=uuid4(), phone="+1", first_name="A", last_name="B",
            role="driver", is_verified=False, is_blocked=False, verification_status="rejected"
        )
        with pytest.raises(HTTPException) as exc:
            service.create_ride(ride_in, rejected_driver)
        assert exc.value.status_code == 403
        assert "Only approved drivers" in str(exc.value.detail)

        # 4. Admin trying to create via public create endpoint -> 403
        admin_user = CurrentUser(
            id=uuid4(), phone="+1", first_name="A", last_name="B",
            role="admin", is_verified=True, is_blocked=False, verification_status="approved"
        )
        with pytest.raises(HTTPException) as exc:
            service.create_ride(ride_in, admin_user)
        assert exc.value.status_code == 403
        assert "Only approved drivers" in str(exc.value.detail)
    finally:
        services.ride_to_response = original_ride_to_response
