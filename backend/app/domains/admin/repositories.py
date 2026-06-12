from uuid import UUID
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domains.admin.models import AuditLog
from app.domains.bookings.models import Booking
from app.domains.identity.models import User
from app.domains.trips.models import Ride


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def stats(self) -> dict:
        return {
            "totalUsers": self.db.query(func.count(User.id)).scalar() or 0,
            "blockedUsers": self.db.query(func.count(User.id))
            .filter(User.is_blocked)
            .scalar()
            or 0,
            "totalTrips": self.db.query(func.count(Ride.id)).scalar() or 0,
            "activeTrips": self.db.query(func.count(Ride.id))
            .filter(Ride.status == "active")
            .scalar()
            or 0,
            "totalBookings": self.db.query(func.count(Booking.id)).scalar() or 0,
            "pendingBookings": self.db.query(func.count(Booking.id))
            .filter(Booking.status == "pending")
            .scalar()
            or 0,
            "pendingVerifications": self.db.query(func.count(User.id))
            .filter(User.verification_status == "pending")
            .scalar()
            or 0,
        }

    def count_pending_verifications(self) -> int:
        return self.db.query(User).filter(User.verification_status == "pending").count()

    def list_pending_verifications(self, skip: int = 0, limit: int = 100) -> list[User]:
        return (
            self.db.query(User)
            .filter(User.verification_status == "pending")
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )


class AuditLogRepository:
    """Repository for write-only audit logs.

    Audit logs are immutable — no update or delete methods.
    """

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        admin_user_id: UUID,
        admin_name: str,
        action: str,
        resource_type: str,
        description: str,
        resource_id: UUID | None = None,
        changes: dict | None = None,
        extra_data: dict | None = None,
    ) -> AuditLog:
        """Create an immutable audit log entry."""
        log = AuditLog(
            admin_user_id=admin_user_id,
            admin_name=admin_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            changes=changes,
            extra_data=extra_data,
        )
        self.db.add(log)
        self.db.flush()
        return log

    def list_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        admin_user_id: UUID | None = None,
        resource_type: str | None = None,
        resource_id: UUID | None = None,
        action: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[AuditLog]:
        """Query audit logs with optional filters."""
        query = self.db.query(AuditLog)

        if admin_user_id:
            query = query.filter(AuditLog.admin_user_id == admin_user_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        return (
            query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
        )

    def count_logs(
        self,
        admin_user_id: UUID | None = None,
        resource_type: str | None = None,
        resource_id: UUID | None = None,
        action: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> int:
        """Count audit logs matching the filters."""
        query = self.db.query(func.count(AuditLog.id))

        if admin_user_id:
            query = query.filter(AuditLog.admin_user_id == admin_user_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        return query.scalar() or 0

    def get_recent_activity(self, limit: int = 10) -> list[AuditLog]:
        """Get the most recent audit log entries for dashboard display."""
        return (
            self.db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_user_activity_timeline(
        self, resource_id: UUID, limit: int = 50
    ) -> list[AuditLog]:
        """Get all admin actions performed on a specific user."""
        return (
            self.db.query(AuditLog)
            .filter(
                AuditLog.resource_type == "user", AuditLog.resource_id == resource_id
            )
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .all()
        )
