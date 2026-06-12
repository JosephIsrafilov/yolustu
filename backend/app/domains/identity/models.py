import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    func,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    language = Column(String(10), default="az")
    role = Column(String(20), default="passenger", nullable=False)
    city = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    is_blocked = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    verification_status = Column(
        String(20), default="none", nullable=False
    )  # none, pending, approved, rejected
    document_url = Column(String(255), nullable=True)
    rating = Column(Float, default=0.0)
    total_rides = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="owner")
    rides_driven = relationship("Ride", back_populates="driver")
    bookings = relationship("Booking", back_populates="passenger")
    reviews_written = relationship(
        "Review", foreign_keys="Review.author_id", back_populates="author"
    )
    reviews_received = relationship(
        "Review", foreign_keys="Review.target_id", back_populates="target"
    )
    messages_sent = relationship("Message", back_populates="sender")
    device_tokens = relationship(
        "DeviceToken", back_populates="user", cascade="all, delete-orphan"
    )
    badges = relationship(
        "UserBadge", back_populates="user", cascade="all, delete-orphan"
    )


class DeviceToken(Base):
    __tablename__ = "device_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="device_tokens")


Index("ix_users_role", User.role)
Index("ix_users_verification_status", User.verification_status)
Index("ix_users_is_blocked", User.is_blocked)
