"""Phase 1 — admin user CRUD + role management.

Exercises AdminService.create_user / change_user_role against the real
UserRepository on the in-memory SQLite session, plus the RBAC and
last-admin guards. Each test uses unique phones/emails because the
session-scoped test DB persists rows across tests.
"""

import uuid
from uuid import UUID

import pytest
from fastapi import HTTPException

from app.core.security import get_password_hash
from app.domains.admin.services import AdminService
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.models import User
from app.domains.identity.schemas import AdminUserCreate


def _admin_current_user(user_id: UUID) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Admin",
        last_name="User",
        role="admin",
        is_verified=True,
        is_blocked=False,
    )


def _non_admin_current_user(user_id: UUID) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000001",
        first_name="Reg",
        last_name="User",
        role="driver",
        is_verified=True,
        is_blocked=False,
    )


def _make_admin_in_db(db) -> User:
    admin = User(
        phone=f"+99450{uuid.uuid4().hex[:7]}",
        email=f"admin-{uuid.uuid4().hex[:8]}@example.com",
        first_name="Seed",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        role="admin",
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def _payload(role: str = "passenger", **overrides) -> AdminUserCreate:
    base = dict(
        phone=f"+99451{uuid.uuid4().hex[:7]}",
        email=f"user-{uuid.uuid4().hex[:8]}@example.com",
        first_name="New",
        last_name="User",
        password="password123",
        role=role,
    )
    base.update(overrides)
    return AdminUserCreate(**base)


@pytest.mark.parametrize("role", ["passenger", "driver", "admin"])
def test_admin_can_create_user_of_each_role(db, role):
    admin = _make_admin_in_db(db)
    service = AdminService(db)

    created = service.create_user(_admin_current_user(admin.id), _payload(role=role))

    assert created.role == role
    assert created.hashed_password != "password123"
    assert created.id is not None


def test_create_duplicate_phone_returns_400(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    payload = _payload()

    service.create_user(_admin_current_user(admin.id), payload)

    dup = _payload(phone=payload.phone)
    with pytest.raises(HTTPException) as exc:
        service.create_user(_admin_current_user(admin.id), dup)
    assert exc.value.status_code == 400


def test_create_duplicate_email_returns_400(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    payload = _payload()

    service.create_user(_admin_current_user(admin.id), payload)

    dup = _payload(email=payload.email)
    with pytest.raises(HTTPException) as exc:
        service.create_user(_admin_current_user(admin.id), dup)
    assert exc.value.status_code == 400


def test_non_admin_cannot_create_user(db):
    service = AdminService(db)
    with pytest.raises(HTTPException) as exc:
        service.create_user(_non_admin_current_user(uuid.uuid4()), _payload())
    assert exc.value.status_code == 403


def test_non_admin_cannot_change_role(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    target = service.create_user(_admin_current_user(admin.id), _payload())

    with pytest.raises(HTTPException) as exc:
        service.change_user_role(
            _non_admin_current_user(uuid.uuid4()), target.id, "driver"
        )
    assert exc.value.status_code == 403


def test_admin_can_change_user_role(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    target = service.create_user(
        _admin_current_user(admin.id), _payload(role="passenger")
    )

    updated = service.change_user_role(
        _admin_current_user(admin.id), target.id, "driver"
    )
    assert updated.role == "driver"


def test_change_role_invalid_role_returns_400(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    target = service.create_user(_admin_current_user(admin.id), _payload())

    with pytest.raises(HTTPException) as exc:
        service.change_user_role(_admin_current_user(admin.id), target.id, "superuser")
    assert exc.value.status_code == 400


def test_change_role_missing_user_returns_404(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)

    with pytest.raises(HTTPException) as exc:
        service.change_user_role(_admin_current_user(admin.id), uuid.uuid4(), "driver")
    assert exc.value.status_code == 404


def test_cannot_demote_last_admin(db):
    # Ensure exactly one admin remains, then attempt to demote it.
    # Demote any pre-existing admins down to a single one first.
    existing_admins = db.query(User).filter(User.role == "admin").all()
    for extra in existing_admins[1:]:
        extra.role = "passenger"
    db.commit()

    if existing_admins:
        sole_admin = existing_admins[0]
    else:
        sole_admin = _make_admin_in_db(db)

    service = AdminService(db)
    assert service.users.count_admins() == 1

    with pytest.raises(HTTPException) as exc:
        service.change_user_role(
            _admin_current_user(sole_admin.id), sole_admin.id, "passenger"
        )
    assert exc.value.status_code == 400
    assert "last admin" in exc.value.detail.lower()


def test_can_demote_admin_when_another_admin_exists(db):
    admin_one = _make_admin_in_db(db)
    admin_two = _make_admin_in_db(db)
    service = AdminService(db)

    assert service.users.count_admins() >= 2

    updated = service.change_user_role(
        _admin_current_user(admin_one.id), admin_two.id, "passenger"
    )
    assert updated.role == "passenger"


# --- Phase 2: server-side filtering ---------------------------------------
# The session-scoped test DB persists rows, so each filter test creates users
# carrying a unique token in their name and searches for that token, isolating
# its own rows from everything else in the table.


def _create_user_with_name(db, service, admin, role, first_name, **overrides):
    payload = _payload(role=role, first_name=first_name, **overrides)
    return service.create_user(_admin_current_user(admin.id), payload)


def test_filter_by_role_returns_only_that_role(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    token = f"Ztok{uuid.uuid4().hex[:8]}"

    _create_user_with_name(db, service, admin, "driver", token)
    _create_user_with_name(db, service, admin, "driver", token)
    _create_user_with_name(db, service, admin, "passenger", token)

    result = service.get_users(_admin_current_user(admin.id), role="driver", q=token)
    assert result.total == 2
    assert all(u.role == "driver" for u in result.items)


def test_search_matches_name_email_phone_case_insensitive(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    token = f"Findme{uuid.uuid4().hex[:8]}"

    created = _create_user_with_name(db, service, admin, "passenger", token)

    # lower-case query against a capitalised first name -> ilike match
    result = service.get_users(_admin_current_user(admin.id), q=token.lower())
    assert result.total == 1
    assert result.items[0].id == created.id


def test_filter_by_status_blocked(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    token = f"Blk{uuid.uuid4().hex[:8]}"

    blocked = _create_user_with_name(db, service, admin, "passenger", token)
    _create_user_with_name(db, service, admin, "passenger", token)
    service.users.set_blocked(service.users.get_by_id(blocked.id), True)

    result = service.get_users(_admin_current_user(admin.id), status="blocked", q=token)
    assert result.total == 1
    assert result.items[0].id == blocked.id


def test_filters_compose_status_and_role(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    token = f"Cmp{uuid.uuid4().hex[:8]}"

    target = _create_user_with_name(db, service, admin, "driver", token)
    service.users.set_blocked(service.users.get_by_id(target.id), True)
    # a blocked passenger and an active driver that must NOT match
    other = _create_user_with_name(db, service, admin, "passenger", token)
    service.users.set_blocked(service.users.get_by_id(other.id), True)
    _create_user_with_name(db, service, admin, "driver", token)

    result = service.get_users(
        _admin_current_user(admin.id), role="driver", status="blocked", q=token
    )
    assert result.total == 1
    assert result.items[0].id == target.id


def test_filtered_total_differs_from_global_total(db):
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    token = f"Tot{uuid.uuid4().hex[:8]}"

    _create_user_with_name(db, service, admin, "driver", token)

    unfiltered = service.get_users(_admin_current_user(admin.id))
    filtered = service.get_users(_admin_current_user(admin.id), q=token)

    assert filtered.total == 1
    assert unfiltered.total > filtered.total
