from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class BadgeBase(BaseModel):
    code: str
    name: str
    description: str
    icon_url: Optional[str] = None


class BadgeCreate(BadgeBase):
    pass


class BadgeResponse(BadgeBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBadgeResponse(BaseModel):
    id: UUID
    user_id: UUID
    badge_id: UUID
    awarded_at: datetime
    badge: BadgeResponse

    model_config = ConfigDict(from_attributes=True)
