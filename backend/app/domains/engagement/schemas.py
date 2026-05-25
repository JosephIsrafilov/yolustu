from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    target_id: UUID
    ride_id: UUID


class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    target_id: UUID
    ride_id: UUID
    created_at: datetime


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    ride_id: UUID


class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ride_id: UUID
    sender_id: UUID
    created_at: datetime
    sender_name: str
