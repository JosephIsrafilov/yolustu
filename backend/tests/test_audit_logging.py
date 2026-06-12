"""Test suite for audit logging functionality.

Verifies that all critical admin actions are properly logged to the audit_logs
table for security, compliance, and forensics.
"""

import uuid
from datetime import datetime, timedelta

from app.core.security import get_password_hash
from app.domains.admin.repositories import AuditLogRepository
from app.domains.admin.services import AdminService
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.models import User
from app.domains.identity.schemas import AdminUserCreate


def _admin_current_user(user_id) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Admin",
        last_name="Tester",
        role="admin",
        is_verified=True,
        is_blocked=False,
    )


def _make_admin_in_db(db) -> User:
    admin = User(
        phone=f"+99450{uuid.uuid4().hex[:7]}",
        email=f"admin-{uuid.uuid4().hex[:8]}@example.com",
        first_name="Test",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        role="admin",
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def _create_user_payload(role: str = "passenger") -> AdminUserCreate:
    return AdminUserCreate(
        phone=f"+99451{uuid.uuid4().hex[:7]}",
        email=f"user-{uuid.uuid4().hex[:8]}@example.com",
        first_name="Test",
        last_name="User",
        password="password123",
        role=role,
    )


def test_create_user_logs_action(db):
    """Verify that creating a user generates an audit log entry."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    payload = _create_user_payload(role="driver")
    created_user = service.create_user(_admin_current_user(admin.id), payload)

    logs = audit_repo.list_logs(action="create_user", resource_id=created_user.id)
    assert len(logs) == 1

    log = logs[0]
    assert log.admin_user_id == admin.id
    assert log.admin_name == "Admin Tester"
    assert log.action == "create_user"
    assert log.resource_type == "user"
    assert log.resource_id == created_user.id
    assert payload.phone in log.description
    assert log.extra_data["role"] == "driver"


def test_change_role_logs_action(db):
    """Verify that changing a user's role generates an audit log with changes."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    user = service.create_user(_admin_current_user(admin.id), _create_user_payload())
    service.change_user_role(_admin_current_user(admin.id), user.id, "driver")

    logs = audit_repo.list_logs(action="change_role", resource_id=user.id)
    assert len(logs) == 1

    log = logs[0]
    assert log.changes["role"]["old"] == "passenger"
    assert log.changes["role"]["new"] == "driver"
    assert "passenger" in log.description and "driver" in log.description


def test_block_user_logs_action(db):
    """Verify that blocking a user generates an audit log."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    user = service.create_user(_admin_current_user(admin.id), _create_user_payload())
    service.set_user_blocked(user.id, True, _admin_current_user(admin.id))

    logs = audit_repo.list_logs(action="block_user", resource_id=user.id)
    assert len(logs) == 1

    log = logs[0]
    assert log.changes["is_blocked"]["old"] is False
    assert log.changes["is_blocked"]["new"] is True
    assert "Blocked" in log.description


def test_unblock_user_logs_action(db):
    """Verify that unblocking a user generates an audit log."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    user = service.create_user(_admin_current_user(admin.id), _create_user_payload())
    service.set_user_blocked(user.id, True, _admin_current_user(admin.id))
    service.set_user_blocked(user.id, False, _admin_current_user(admin.id))

    logs = audit_repo.list_logs(action="unblock_user", resource_id=user.id)
    assert len(logs) == 1

    log = logs[0]
    assert log.changes["is_blocked"]["new"] is False
    assert "Unblocked" in log.description


def test_approve_verification_logs_action(db):
    """Verify that approving verification generates an audit log."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    # Create a user with pending verification
    user = User(
        phone=f"+99451{uuid.uuid4().hex[:7]}",
        email=f"pending-{uuid.uuid4().hex[:8]}@example.com",
        first_name="Pending",
        last_name="Driver",
        hashed_password=get_password_hash("password123"),
        role="passenger",
        is_verified=False,
        verification_status="pending",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    service.approve_verification(user.id, _admin_current_user(admin.id))

    logs = audit_repo.list_logs(action="approve_verification", resource_id=user.id)
    assert len(logs) == 1

    log = logs[0]
    assert log.changes["verification_status"]["old"] == "pending"
    assert log.changes["verification_status"]["new"] == "approved"
    assert log.changes["role"]["new"] == "driver"


def test_reject_verification_logs_action(db):
    """Verify that rejecting verification generates an audit log."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    user = User(
        phone=f"+99451{uuid.uuid4().hex[:7]}",
        email=f"pending-{uuid.uuid4().hex[:8]}@example.com",
        first_name="Pending",
        last_name="Driver",
        hashed_password=get_password_hash("password123"),
        role="passenger",
        is_verified=False,
        verification_status="pending",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    service.reject_verification(user.id, _admin_current_user(admin.id))

    logs = audit_repo.list_logs(action="reject_verification", resource_id=user.id)
    assert len(logs) == 1

    log = logs[0]
    assert log.changes["verification_status"]["new"] == "rejected"


def test_audit_log_filtering_by_admin(db):
    """Verify that audit logs can be filtered by admin user."""
    admin1 = _make_admin_in_db(db)
    admin2 = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    service.create_user(_admin_current_user(admin1.id), _create_user_payload())
    service.create_user(_admin_current_user(admin2.id), _create_user_payload())

    admin1_logs = audit_repo.list_logs(admin_user_id=admin1.id)
    admin2_logs = audit_repo.list_logs(admin_user_id=admin2.id)

    assert len(admin1_logs) == 1
    assert len(admin2_logs) == 1
    assert admin1_logs[0].admin_user_id == admin1.id
    assert admin2_logs[0].admin_user_id == admin2.id


def test_audit_log_filtering_by_resource_type(db):
    """Verify that audit logs can be filtered by resource type."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    service.create_user(_admin_current_user(admin.id), _create_user_payload())

    user_logs = audit_repo.list_logs(resource_type="user")
    assert len(user_logs) >= 1
    assert all(log.resource_type == "user" for log in user_logs)


def test_audit_log_filtering_by_date_range(db):
    """Verify that audit logs can be filtered by date range."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    now = datetime.utcnow()
    service.create_user(_admin_current_user(admin.id), _create_user_payload())

    # Query for logs in the last hour
    start = now - timedelta(hours=1)
    end = now + timedelta(hours=1)
    logs = audit_repo.list_logs(start_date=start, end_date=end)

    assert len(logs) >= 1

    # Query for logs in the future (should be empty)
    future_start = now + timedelta(days=1)
    future_logs = audit_repo.list_logs(start_date=future_start)
    assert len(future_logs) == 0


def test_get_user_activity_timeline(db):
    """Verify that we can retrieve a complete activity timeline for a user."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    user = service.create_user(_admin_current_user(admin.id), _create_user_payload())
    service.change_user_role(_admin_current_user(admin.id), user.id, "driver")
    service.set_user_blocked(user.id, True, _admin_current_user(admin.id))
    service.set_user_blocked(user.id, False, _admin_current_user(admin.id))

    timeline = audit_repo.get_user_activity_timeline(user.id)

    assert len(timeline) == 4
    actions = [log.action for log in timeline]
    assert "create_user" in actions
    assert "change_role" in actions
    assert "block_user" in actions
    assert "unblock_user" in actions


def test_get_recent_activity(db):
    """Verify that we can retrieve recent audit activity."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    for _ in range(3):
        service.create_user(_admin_current_user(admin.id), _create_user_payload())

    recent = audit_repo.get_recent_activity(limit=5)

    assert len(recent) >= 3
    # Verify they're in descending order by created_at
    for i in range(len(recent) - 1):
        assert recent[i].created_at >= recent[i + 1].created_at


def test_audit_log_count(db):
    """Verify that count_logs returns accurate counts."""
    admin = _make_admin_in_db(db)
    service = AdminService(db)
    audit_repo = AuditLogRepository(db)

    initial_count = audit_repo.count_logs()

    service.create_user(_admin_current_user(admin.id), _create_user_payload())
    service.create_user(_admin_current_user(admin.id), _create_user_payload())

    final_count = audit_repo.count_logs()
    assert final_count == initial_count + 2

    create_user_count = audit_repo.count_logs(action="create_user")
    assert create_user_count >= 2


def test_audit_logs_are_immutable(db):
    """Verify that audit logs don't have update or delete methods."""
    audit_repo = AuditLogRepository(db)

    # Repository should not have update or delete methods
    assert not hasattr(audit_repo, "update")
    assert not hasattr(audit_repo, "delete")
    assert not hasattr(audit_repo, "update_log")
    assert not hasattr(audit_repo, "delete_log")
