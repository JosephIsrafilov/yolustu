import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), nullable=False)
    passenger_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seats_booked = Column(Integer, nullable=False)
    total_price = Column(Numeric(12, 2), nullable=True)
    status = Column(String(20), default="pending")
    payment_deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings")


Index("ix_bookings_passenger_id", Booking.passenger_id)
Index("ix_bookings_ride_id", Booking.ride_id)
Index("ix_bookings_status", Booking.status)
Index("ix_bookings_created_at", Booking.created_at)
