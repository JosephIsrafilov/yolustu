import uuid

from sqlalchemy import Column, DateTime, String, Text, func, Index, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class AuditLog(Base):
    """Immutable audit trail for sensitive admin actions.

    Records who did what, when, and includes before/after snapshots for changes.
    Never updated or deleted — write-only for compliance and forensics.
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Actor
    admin_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    admin_name = Column(String(200), nullable=False)  # Denormalized for stability

    # Action
    action = Column(String(100), nullable=False, index=True)  # "create_user", "change_role", "block_user", etc.
    resource_type = Column(String(50), nullable=False, index=True)  # "user", "ride", "payout", etc.
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Target resource UUID

    # Context
    description = Column(Text, nullable=False)  # Human-readable summary
    changes = Column(JSON, nullable=True)  # {"field": {"old": "passenger", "new": "driver"}}
    extra_data = Column(JSON, nullable=True)  # Additional context (IP, user agent, etc.)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.admin_name} at {self.created_at}>"


# Composite indexes for common queries
Index("ix_audit_logs_admin_created", AuditLog.admin_user_id, AuditLog.created_at.desc())
Index("ix_audit_logs_resource", AuditLog.resource_type, AuditLog.resource_id, AuditLog.created_at.desc())
Index("ix_audit_logs_action_created", AuditLog.action, AuditLog.created_at.desc())
