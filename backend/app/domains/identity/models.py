import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, index=True, nullable=False)
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
    rating = Column(Float, default=0.0)
    total_rides = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="owner")
    rides_driven = relationship("Ride", back_populates="driver")
    bookings = relationship("Booking", back_populates="passenger")
    reviews_written = relationship("Review", foreign_keys="Review.author_id", back_populates="author")
    reviews_received = relationship("Review", foreign_keys="Review.target_id", back_populates="target")
    messages_sent = relationship("Message", back_populates="sender")
