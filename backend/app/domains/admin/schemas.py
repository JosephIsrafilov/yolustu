from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    """Response schema for audit log entries."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    admin_user_id: UUID
    admin_name: str
    action: str
    resource_type: str
    resource_id: UUID | None
    description: str
    changes: dict | None
    extra_data: dict | None
    created_at: datetime
