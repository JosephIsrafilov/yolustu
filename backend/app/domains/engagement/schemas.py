from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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
    content: str = Field(min_length=0, max_length=2000)
    message_type: str = "text"
    attachments: list[str] = Field(default_factory=list)


class MessageCreate(MessageBase):
    conversation_id: Optional[UUID] = None
    ride_id: Optional[UUID] = None


class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: Optional[UUID] = None
    ride_id: Optional[UUID] = None
    sender_id: UUID
    created_at: datetime
    read_at: Optional[datetime] = None
    sender_name: str
    message_type: str
    attachments: list[str] = []


class ConversationParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
    role: str
    user_name: str = "User"
    user_avatar_url: Optional[str] = None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    ride_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime
    participants: list[ConversationParticipantResponse] = []


class RideConversationCreate(BaseModel):
    booking_id: UUID


class ChatMessageCreate(MessageBase):
    pass
