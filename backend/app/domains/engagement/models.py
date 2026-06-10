import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship(
        "User", foreign_keys=[author_id], back_populates="reviews_written"
    )
    target = relationship(
        "User", foreign_keys=[target_id], back_populates="reviews_received"
    )
    ride = relationship("Ride", back_populates="reviews")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), nullable=False)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), nullable=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    created_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status = Column(String(50), nullable=False, default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    participants = relationship(
        "ConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )
    ride = relationship("Ride")
    booking = relationship("Booking")
    creator = relationship("User")


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    conversation_id = Column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), primary_key=True
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    role = Column(String(50), nullable=False)

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True
    )
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), nullable=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    ride = relationship("Ride", back_populates="messages")
    sender = relationship("User", back_populates="messages_sent")

    @property
    def sender_name(self) -> str:
        if self.sender:
            return f"{self.sender.first_name} {self.sender.last_name}"
        return "User"


Index("ix_conversations_booking_id", Conversation.booking_id)
Index("ix_conversations_ride_id", Conversation.ride_id)
Index("ix_conversations_type", Conversation.type)
Index("ix_conversation_participants_user_id", ConversationParticipant.user_id)
Index("ix_messages_conversation_id", Message.conversation_id)
Index("ix_messages_created_at", Message.created_at)
