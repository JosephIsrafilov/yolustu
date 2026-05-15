import uuid

from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime, Text, func

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import relationship

from core.database import Base

from geoalchemy2 import Geometry

class User(Base):

    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    phone = Column(String(20), unique=True, index=True, nullable=False)

    first_name = Column(String(100), nullable=False)

    last_name = Column(String(100), nullable=False)

    is_verified = Column(Boolean, default=False)

    rating = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="owner")

    rides_driven = relationship("Ride", back_populates="driver")

    bookings = relationship("Booking", back_populates="passenger")

    reviews_written = relationship("Review", foreign_keys='Review.author_id', back_populates="author")

    reviews_received = relationship("Review", foreign_keys='Review.target_id', back_populates="target")

    messages_sent = relationship("Message", back_populates="sender")

class Vehicle(Base):

    __tablename__ = 'vehicles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    brand = Column(String(50), nullable=False)

    model = Column(String(50), nullable=False)

    year = Column(Integer, nullable=False)

    color = Column(String(30), nullable=False)

    plate_number = Column(String(20), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="vehicles")

    rides = relationship("Ride", back_populates="vehicle")

class Ride(Base):

    __tablename__ = 'rides'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    driver_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    vehicle_id = Column(UUID(as_uuid=True), ForeignKey('vehicles.id'), nullable=False)

    origin_location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)

    origin_city = Column(String(100), nullable=False)

    destination_location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)

    destination_city = Column(String(100), nullable=False)

    departure_time = Column(DateTime(timezone=True), nullable=False)

    total_seats = Column(Integer, nullable=False)

    available_seats = Column(Integer, nullable=False)

    price_per_seat = Column(Float, nullable=False)

    status = Column(String(20), default="active")                               

    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("User", back_populates="rides_driven")

    vehicle = relationship("Vehicle", back_populates="rides")

    bookings = relationship("Booking", back_populates="ride")

    reviews = relationship("Review", back_populates="ride")

    messages = relationship("Message", back_populates="ride")

class Booking(Base):

    __tablename__ = 'bookings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    ride_id = Column(UUID(as_uuid=True), ForeignKey('rides.id'), nullable=False)

    passenger_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    seats_booked = Column(Integer, nullable=False)

    status = Column(String(20), default="pending")                                         

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride", back_populates="bookings")

    passenger = relationship("User", back_populates="bookings")

class Review(Base):

    __tablename__ = 'reviews'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    author_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    target_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    ride_id = Column(UUID(as_uuid=True), ForeignKey('rides.id'), nullable=False)

    rating = Column(Integer, nullable=False)

    comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", foreign_keys=[author_id], back_populates="reviews_written")

    target = relationship("User", foreign_keys=[target_id], back_populates="reviews_received")

    ride = relationship("Ride", back_populates="reviews")

class Message(Base):

    __tablename__ = 'messages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    ride_id = Column(UUID(as_uuid=True), ForeignKey('rides.id'), nullable=False)

    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride", back_populates="messages")

    sender = relationship("User", back_populates="messages_sent")

