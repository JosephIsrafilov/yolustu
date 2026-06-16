"""Admin service gap tests — covers change_user_role, set_user_blocked, create_user, get_verification_user."""

import pytest
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import cast
from unittest.mock import MagicMock
from uuid import UUID, uuid4

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
    email: str | None = None


class FakeUserRepository:
    def __init__(self, users: list[FakeUser]):
        self.users: dict[UUID, FakeUser] = {u.id: u for u in users}
        self.by_phone: dict[str, FakeUser] = {u.phone: u for u in users}
        self.by_email: dict[str, FakeUser] = {u.email: u for u in users if u.email}

    def get_by_id(self, uid):
        return self.users.get(uid)

    def get_by_phone(self, phone):
        return self.by_phone.get(phone)

    def get_by_email(self, email):
        return self.by_email.get(email) if email else None

    def set_role(self, user, role):
        user.role = role
        return user

    def set_blocked(self, user, is_blocked):
        user.is_blocked = is_blocked
        return user

    def count_admins(self):
        return sum(1 for u in self.users.values() if u.role == "admin")

    def create_by_admin(self, payload, hashed_password):
        u = FakeUser(
            id=uuid4(),
            phone=payload.phone,
            email=getattr(payload, "email", None),
            first_name=payload.first_name,
            last_name=payload.last_name,
            role=payload.role,
            created_at=datetime.now(timezone.utc),
        )
        self.users[u.id] = u
        self.by_phone[u.phone] = u
        return u

    def search_users(
        self,
        skip=0,
        limit=100,
        role=None,
        is_blocked=None,
        verification_status=None,
        q=None,
    ):
        return list(self.users.values())[skip : skip + limit]

    def count_filtered(
        self, role=None, is_blocked=None, verification_status=None, q=None
    ):
        return len(self.users)

    def update_verification_status(self, user, status, document_url=None):
        user.verification_status = status
        return user


class FakeAdminRepository:
    def stats(self):
        return {"totalUsers": 1}

    def list_pending_verifications(self, skip=0, limit=100):
        return []

    def count_pending_verifications(self):
        return 0


class FakeRideRepository:
    def list_all(self, skip=0, limit=100):
        return []

    def count_all(self):
        return 0


class FakeBookingRepository:
    def list_all(self, skip=0, limit=100):
        return []

    def count_all(self):
        return 0


def make_cu(uid, role="admin"):
    return CurrentUser(
        id=uid,
        phone="+994500000000",
        first_name="Ad",
        last_name="Min",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


def make_service(extra_users=None):
    admin_id = uuid4()
    admin = FakeUser(
        id=admin_id,
        phone="+994500000001",
        first_name="Ad",
        last_name="Min",
        role="admin",
        created_at=datetime.now(timezone.utc),
    )
    users = [admin] + (extra_users or [])
    svc = AdminService(db=cast(Session, None))
    user_repo = FakeUserRepository(users)
    svc.users = cast(UserRepository, user_repo)
    svc.admin = cast(AdminRepository, FakeAdminRepository())
    svc.rides = cast(RideRepository, FakeRideRepository())
    svc.bookings = cast(BookingRepository, FakeBookingRepository())
    svc.audit = MagicMock()
    return svc, admin, user_repo


# --- change_user_role ---


def test_change_role_invalid_role_raises_400():
    svc, admin, _ = make_service()
    target = FakeUser(
        id=uuid4(),
        phone="+994500000002",
        first_name="T",
        last_name="U",
        role="passenger",
        created_at=datetime.now(timezone.utc),
    )
    svc.users.users[target.id] = target
    with pytest.raises(HTTPException) as exc:
        svc.change_user_role(make_cu(admin.id), target.id, "superuser")
    assert exc.value.status_code == 400


def test_change_role_user_not_found_raises_404():
    svc, admin, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.change_user_role(make_cu(admin.id), uuid4(), "driver")
    assert exc.value.status_code == 404


def test_change_role_demote_last_admin_raises_400():
    svc, admin, _ = make_service()  # only 1 admin
    with pytest.raises(HTTPException) as exc:
        svc.change_user_role(make_cu(admin.id), admin.id, "passenger")
    assert exc.value.status_code == 400


def test_change_role_success():
    target = FakeUser(
        id=uuid4(),
        phone="+994500000003",
        first_name="T",
        last_name="U",
        role="passenger",
        created_at=datetime.now(timezone.utc),
    )
    svc, admin, _ = make_service(extra_users=[target])
    result = svc.change_user_role(make_cu(admin.id), target.id, "driver")
    assert result.role == "driver"


def test_change_role_demote_admin_when_multiple_admins():
    second_admin = FakeUser(
        id=uuid4(),
        phone="+994500000004",
        first_name="S",
        last_name="A",
        role="admin",
        created_at=datetime.now(timezone.utc),
    )
    svc, admin, _ = make_service(extra_users=[second_admin])
    result = svc.change_user_role(make_cu(admin.id), second_admin.id, "passenger")
    assert result.role == "passenger"


# --- set_user_blocked ---


def test_set_user_blocked_not_found_raises_404():
    svc, admin, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.set_user_blocked(uuid4(), True, make_cu(admin.id))
    assert exc.value.status_code == 404


def test_set_user_blocked_success():
    target = FakeUser(
        id=uuid4(),
        phone="+994500000005",
        first_name="T",
        last_name="U",
        role="passenger",
        created_at=datetime.now(timezone.utc),
    )
    svc, admin, _ = make_service(extra_users=[target])
    result = svc.set_user_blocked(target.id, True, make_cu(admin.id))
    assert result.is_blocked is True


def test_set_user_unblocked_success():
    target = FakeUser(
        id=uuid4(),
        phone="+994500000006",
        first_name="T",
        last_name="U",
        role="passenger",
        created_at=datetime.now(timezone.utc),
        is_blocked=True,
    )
    svc, admin, _ = make_service(extra_users=[target])
    result = svc.set_user_blocked(target.id, False, make_cu(admin.id))
    assert result.is_blocked is False


# --- create_user ---


def test_create_user_dup_phone_raises_400():
    svc, admin, _ = make_service()
    from app.domains.identity.schemas import AdminUserCreate

    with pytest.raises(HTTPException) as exc:
        svc.create_user(
            make_cu(admin.id),
            AdminUserCreate(
                phone="+994500000001",
                email=None,
                first_name="X",
                last_name="Y",
                password="pass1234",
                role="passenger",
            ),
        )
    assert exc.value.status_code == 400


def test_create_user_dup_email_raises_400():
    target = FakeUser(
        id=uuid4(),
        phone="+994500000007",
        first_name="T",
        last_name="U",
        role="passenger",
        created_at=datetime.now(timezone.utc),
        email="dup@x.com",
    )
    svc, admin, _ = make_service(extra_users=[target])
    from app.domains.identity.schemas import AdminUserCreate

    with pytest.raises(HTTPException) as exc:
        svc.create_user(
            make_cu(admin.id),
            AdminUserCreate(
                phone="+994500000099",
                email="dup@x.com",
                first_name="X",
                last_name="Y",
                password="pass1234",
                role="passenger",
            ),
        )
    assert exc.value.status_code == 400


def test_create_user_success():
    svc, admin, _ = make_service()
    from app.domains.identity.schemas import AdminUserCreate

    result = svc.create_user(
        make_cu(admin.id),
        AdminUserCreate(
            phone="+994500009999",
            email=None,
            first_name="New",
            last_name="User",
            password="pass1234",
            role="passenger",
        ),
    )
    assert result.phone == "+994500009999"


# --- get_verification_user ---


def test_get_verification_user_not_found_raises_404():
    svc, admin, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_verification_user(uuid4(), make_cu(admin.id))
    assert exc.value.status_code == 404


def test_get_verification_user_success():
    target = FakeUser(
        id=uuid4(),
        phone="+994500000008",
        first_name="T",
        last_name="U",
        role="passenger",
        created_at=datetime.now(timezone.utc),
        verification_status="pending",
    )
    svc, admin, _ = make_service(extra_users=[target])
    result = svc.get_verification_user(target.id, make_cu(admin.id))
    assert result.id == target.id


# --- get_users / get_rides / get_bookings ---


def test_get_users_returns_paginated():
    svc, admin, _ = make_service()
    result = svc.get_users(make_cu(admin.id))
    assert hasattr(result, "items")


def test_get_rides_returns_paginated():
    svc, admin, _ = make_service()
    result = svc.get_rides(make_cu(admin.id))
    assert hasattr(result, "items")


def test_get_bookings_returns_paginated():
    svc, admin, _ = make_service()
    result = svc.get_bookings(make_cu(admin.id))
    assert hasattr(result, "items")
