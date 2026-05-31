from dataclasses import dataclass
from datetime import datetime, timezone
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.admin.repositories import AdminRepository
from app.domains.admin.services import AdminService
from app.domains.bookings.repositories import BookingRepository
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.trips.repositories import RideRepository


@dataclass
class FakeUser:
    id: UUID
    phone: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime
    is_blocked: bool = False
    is_verified: bool = True
    verification_status: str = "none"
    document_url: str | None = None
    rating: float = 5.0
    total_rides: int = 0
    avatar_url: str | None = None
    language: str = "az"
    city: str | None = None
    bio: str | None = None


@dataclass
class FakeRide:
    id: UUID
    status: str = "active"


class FakeAdminRepository:
    def __init__(self, users: list[FakeUser]):
        self.users = users

    def stats(self) -> dict[str, int]:
        return {
            "totalUsers": len(self.users),
            "blockedUsers": len([user for user in self.users if user.is_blocked]),
            "totalTrips": 1,
            "activeTrips": 1,
            "totalBookings": 1,
            "pendingBookings": 1,
            "pendingVerifications": len(
                [user for user in self.users if user.verification_status == "pending"]
            ),
        }

    def count_pending_verifications(self) -> int:
        return len(
            [user for user in self.users if user.verification_status == "pending"]
        )

    def list_pending_verifications(
        self, skip: int = 0, limit: int = 100
    ) -> list[FakeUser]:
        pending = [user for user in self.users if user.verification_status == "pending"]
        return pending[skip : skip + limit]


class FakeUserRepository:
    def __init__(self, users: list[FakeUser]):
        self.users: dict[UUID, FakeUser] = {user.id: user for user in users}

    def get_by_id(self, user_id: UUID) -> FakeUser | None:
        return self.users.get(user_id)

    def list_all(self) -> list[FakeUser]:
        return list(self.users.values())

    def set_blocked(self, user: FakeUser, is_blocked: bool) -> FakeUser:
        user.is_blocked = is_blocked
        return user

    def update_verification_status(
        self, user: FakeUser, status: str, document_url: str | None = None
    ) -> FakeUser:
        user.verification_status = status
        if document_url is not None:
            user.document_url = document_url
        return user


class FakeRideRepository:
    def __init__(self, rides: list[FakeRide]):
        self.rides: dict[UUID, FakeRide] = {ride.id: ride for ride in rides}

    def list_all(self, skip: int = 0, limit: int = 100) -> list[FakeRide]:
        return list(self.rides.values())[skip : skip + limit]

    def count_all(self) -> int:
        return len(self.rides)

    def get(self, ride_id: UUID) -> FakeRide | None:
        return self.rides.get(ride_id)

    def save(self, ride: FakeRide) -> FakeRide:
        self.rides[ride.id] = ride
        return ride


class FakeBookingRepository:
    def list_all(self) -> list[object]:
        return []


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


def make_service() -> tuple[AdminService, list[FakeUser], FakeRide]:
    admin_id = uuid4()
    user_id = uuid4()
    users = [
        FakeUser(
            id=admin_id,
            phone="+994500000001",
            first_name="Admin",
            last_name="User",
            role="admin",
            created_at=datetime.now(timezone.utc),
            verification_status="approved",
        ),
        FakeUser(
            id=user_id,
            phone="+994500000002",
            first_name="Pending",
            last_name="User",
            role="driver",
            created_at=datetime.now(timezone.utc),
            verification_status="pending",
            document_url="/uploads/doc.pdf",
        ),
    ]

    ride = FakeRide(id=uuid4())
    service = AdminService(db=cast(Session, None))
    service.admin = cast(AdminRepository, FakeAdminRepository(users))
    service.users = cast(UserRepository, FakeUserRepository(users))
    service.rides = cast(RideRepository, FakeRideRepository([ride]))
    service.bookings = cast(BookingRepository, FakeBookingRepository())
    return service, users, ride


def test_non_admin_access_is_forbidden_for_admin_methods():
    service, users, _ = make_service()
    non_admin = make_current_user(users[1].id, role="driver")

    with pytest.raises(HTTPException) as stats_exc:
        service.get_stats(non_admin)
    with pytest.raises(HTTPException) as users_exc:
        service.get_users(non_admin)
    with pytest.raises(HTTPException) as rides_exc:
        service.get_rides(non_admin)
    with pytest.raises(HTTPException) as bookings_exc:
        service.get_bookings(non_admin)
    with pytest.raises(HTTPException) as verifications_exc:
        service.get_pending_verifications(non_admin)
    with pytest.raises(HTTPException) as approve_exc:
        service.approve_verification(users[1].id, non_admin)
    with pytest.raises(HTTPException) as reject_exc:
        service.reject_verification(users[1].id, non_admin)

    assert stats_exc.value.status_code == 403
    assert users_exc.value.status_code == 403
    assert rides_exc.value.status_code == 403
    assert bookings_exc.value.status_code == 403
    assert verifications_exc.value.status_code == 403
    assert approve_exc.value.status_code == 403
    assert reject_exc.value.status_code == 403


def test_admin_can_list_and_update_verification_status():
    service, users, _ = make_service()
    admin = make_current_user(users[0].id, role="admin")
    target = users[1]

    pending = service.get_pending_verifications(admin)
    assert len(pending.items) == 1
    assert pending.items[0].id == target.id

    approved = service.approve_verification(target.id, admin)
    assert approved.verification_status == "approved"
    assert approved.role == "driver"
    assert approved.is_verified is True

    rejected = service.reject_verification(target.id, admin)
    assert rejected.verification_status == "rejected"
    assert rejected.role == "passenger"
    assert rejected.is_verified is False


def test_admin_stats_available_only_for_admin():
    service, users, _ = make_service()
    admin = make_current_user(users[0].id, role="admin")

    stats = service.get_stats(admin)
    assert stats["totalUsers"] == 2
    assert stats["pendingVerifications"] == 1


def test_admin_delete_ride_soft_cancels_and_preserves_record():
    service, users, ride = make_service()
    admin = make_current_user(users[0].id, role="admin")

    response = service.delete_ride(ride.id, admin)

    assert response["message"] == "Ride cancelled"
    assert service.rides.get(ride.id) is ride
    assert ride.status == "cancelled"
