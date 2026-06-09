import uuid

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(30), nullable=False)
    plate_number = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="vehicles")
    rides = relationship("Ride", back_populates="vehicle")


class Ride(Base):
    __tablename__ = "rides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    origin_location = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    origin_city = Column(String(100), nullable=False)
    destination_location = Column(
        Geometry(geometry_type="POINT", srid=4326), nullable=False
    )
    destination_city = Column(String(100), nullable=False)
    intermediate_cities = Column(Text, nullable=True)
    departure_time = Column(DateTime(timezone=True), nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    price_per_seat = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default="active")
    description = Column(Text, nullable=True)
    smoking_allowed = Column(Boolean, default=False)
    pets_allowed = Column(Boolean, default=False)
    music_allowed = Column(Boolean, default=True)
    female_only = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("User", back_populates="rides_driven")
    vehicle = relationship("Vehicle", back_populates="rides")
    bookings = relationship("Booking", back_populates="ride")
    reviews = relationship("Review", back_populates="ride")
    messages = relationship("Message", back_populates="ride")


Index("ix_rides_departure_time", Ride.departure_time)
Index("ix_rides_status", Ride.status)
Index("ix_rides_driver_id", Ride.driver_id)
Index("ix_vehicles_user_id", Vehicle.user_id)
