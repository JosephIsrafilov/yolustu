import secrets
import uuid

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.orm import validates

from app.core.database import Base

SEAT_SPOTS = ("front_right", "back_left", "back_middle", "back_right")


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        CheckConstraint("seats_count BETWEEN 1 AND 4", name="ck_vehicles_seats_count"),
        CheckConstraint("year BETWEEN 1886 AND 2100", name="ck_vehicles_year"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(30), nullable=False)
    plate_number = Column(String(20), nullable=False)
    normalized_plate = Column(String(20), nullable=False)
    seats_count = Column(Integer, nullable=False, server_default="4")
    variations = Column(String(100), nullable=True)
    verification_status = Column(String(20), default="none", nullable=False)
    document_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    is_default = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="vehicles")
    rides = relationship("Ride", back_populates="vehicle")
    documents = relationship(
        "VehicleDocument",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="VehicleDocument.created_at.desc()",
    )

    @validates("plate_number")
    def normalize_plate_number(self, _key: str, value: str) -> str:
        cleaned = value.strip().upper()
        self.normalized_plate = "".join(char for char in cleaned if char.isalnum())
        return cleaned


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
    # Public, unguessable handle for read-only live-tracking share links.
    share_token = Column(
        String(64),
        unique=True,
        nullable=False,
        default=lambda: secrets.token_urlsafe(16),
    )
    description = Column(Text, nullable=True)
    available_spots = Column(JSON, nullable=True)
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
    seat_inventory = relationship(
        "RideSeat", back_populates="ride", cascade="all, delete-orphan"
    )


class RideSeat(Base):
    __tablename__ = "ride_seats"
    __table_args__ = (
        UniqueConstraint("ride_id", "spot", name="uq_ride_seats_ride_spot"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(
        UUID(as_uuid=True), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False
    )
    spot = Column(String(20), nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride", back_populates="seat_inventory")
    booking_seats = relationship(
        "BookingSeat", back_populates="ride_seat", cascade="all, delete-orphan"
    )


Index("ix_rides_departure_time", Ride.departure_time)
Index("ix_rides_status", Ride.status)
Index("ix_rides_driver_id", Ride.driver_id)
Index("ix_rides_origin_city", Ride.origin_city)
Index("ix_rides_destination_city", Ride.destination_city)
Index("ix_rides_status_departure", Ride.status, Ride.departure_time)
Index("ix_rides_available_seats", Ride.available_seats)
Index("ix_rides_share_token", Ride.share_token, unique=True)
Index("ix_vehicles_user_id", Vehicle.user_id)
Index(
    "uq_vehicles_active_normalized_plate",
    Vehicle.normalized_plate,
    unique=True,
    postgresql_where=Vehicle.is_active.is_(True),
    sqlite_where=Vehicle.is_active.is_(True),
)
Index(
    "uq_vehicles_owner_active_default",
    Vehicle.user_id,
    unique=True,
    postgresql_where=Vehicle.is_active.is_(True) & Vehicle.is_default.is_(True),
    sqlite_where=Vehicle.is_active.is_(True) & Vehicle.is_default.is_(True),
)
Index("ix_ride_seats_ride_id", RideSeat.ride_id)


VEHICLE_DOC_TYPES = ("registration", "insurance", "inspection")
VEHICLE_DOC_STATUSES = ("pending", "approved", "rejected")
VEHICLE_DOC_PROCESSING = ("pending", "processing", "completed", "failed")


class VehicleDocument(Base):
    __tablename__ = "vehicle_documents"
    __table_args__ = (
        CheckConstraint(
            f"document_type IN {VEHICLE_DOC_TYPES}",
            name="ck_vehicle_documents_type",
        ),
        CheckConstraint(
            f"status IN {VEHICLE_DOC_STATUSES}",
            name="ck_vehicle_documents_status",
        ),
        CheckConstraint("version >= 1", name="ck_vehicle_documents_version"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_type = Column(String(50), nullable=False)
    storage_key = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False)
    # admin decision
    status = Column(String(20), default="pending", nullable=False)
    # async AI processing state
    processing_status = Column(String(20), default="pending", nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    # AI advisory output (never drives auto-approval)
    ai_recommendation = Column(String(20), nullable=True)
    ai_confidence = Column(Numeric(4, 3), nullable=True)
    ai_issues = Column(JSON, nullable=True)
    ai_metadata = Column(JSON, nullable=True)
    # admin review
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    # optimistic-lock version for concurrent admin decisions
    version = Column(Integer, default=1, nullable=False)
    # only the latest submission per (vehicle_id, document_type) is current
    is_current = Column(Boolean, default=True, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="documents")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


Index("ix_vehicle_documents_vehicle_id", VehicleDocument.vehicle_id)
Index(
    "uq_vehicle_documents_current",
    VehicleDocument.vehicle_id,
    VehicleDocument.document_type,
    unique=True,
    postgresql_where=VehicleDocument.is_current.is_(True),
    sqlite_where=VehicleDocument.is_current.is_(True),
)
