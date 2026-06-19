from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


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

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "sender_name"):
            data = {
                "id": obj.id,
                "conversation_id": obj.conversation_id,
                "ride_id": obj.ride_id,
                "sender_id": obj.sender_id,
                "created_at": obj.created_at,
                "read_at": obj.read_at,
                "sender_name": obj.sender_name,
                "message_type": obj.message_type,
                "attachments": obj.attachments,
                "content": obj.content,
            }
            return super().model_validate(data, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)


class ConversationParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
    role: str
    user_name: str = "User"
    user_avatar_url: Optional[str] = None

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "user_name"):
            # It's an ORM object or similar
            data = {
                "user_id": obj.user_id,
                "role": obj.role,
                "user_name": obj.user_name,
                "user_avatar_url": obj.user_avatar_url,
            }
            return super().model_validate(data, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)


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
    ride_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None


class ChatMessageCreate(MessageBase):
    pass
