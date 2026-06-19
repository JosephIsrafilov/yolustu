import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    text,
    JSON,
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
    selected_spots = Column(JSON, nullable=True)
    total_price = Column(Numeric(12, 2), nullable=True)
    status = Column(String(20), default="pending")
    payment_deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings")
    seat_assignments = relationship(
        "BookingSeat", back_populates="booking", cascade="all, delete-orphan"
    )


class BookingSeat(Base):
    __tablename__ = "booking_seats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
    )
    ride_seat_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ride_seats.id", ondelete="CASCADE"),
        nullable=False,
    )
    released_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking", back_populates="seat_assignments")
    ride_seat = relationship("RideSeat", back_populates="booking_seats")


Index("ix_bookings_passenger_id", Booking.passenger_id)
Index("ix_bookings_ride_id", Booking.ride_id)
Index("ix_bookings_status", Booking.status)
Index("ix_bookings_created_at", Booking.created_at)
Index("ix_booking_seats_booking_id", BookingSeat.booking_id)
Index(
    "uq_booking_seats_active_ride_seat",
    BookingSeat.ride_seat_id,
    unique=True,
    postgresql_where=text("released_at IS NULL"),
    sqlite_where=text("released_at IS NULL"),
)
