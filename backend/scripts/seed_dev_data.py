from __future__ import annotations

import os
import sys
import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.domains.lifecycle import (
    BOOKING_ACCEPTED,
    BOOKING_CANCELLED,
    BOOKING_COMPLETED,
    BOOKING_PAID,
    BOOKING_PENDING,
    BOOKING_REJECTED,
    PAYMENT_COMPLETED,
    PAYMENT_PENDING,
    RIDE_ACTIVE,
    RIDE_CANCELLED,
    RIDE_COMPLETED,
)
from app.domains.models import Booking, Message, Payment, Review, Ride, User, Vehicle

SEED_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "yolmates.dev.seed")
DEV_PASSWORD = "StrongPass1!"
SAFE_ENVIRONMENTS = {"development", "dev", "local", "test", "demo"}
SEAT_OCCUPYING_BOOKING_STATUSES = {
    BOOKING_ACCEPTED,
    BOOKING_PAID,
    BOOKING_COMPLETED,
}

CITY_COORDINATES: dict[str, tuple[float, float]] = {
    "Bakı": (40.4093, 49.8671),
    "Gəncə": (40.6828, 46.3606),
    "Lənkəran": (38.7540, 48.8508),
    "Şəki": (41.1919, 47.1706),
    "Quba": (41.3611, 48.5134),
    "Şamaxı": (40.6314, 48.6414),
    "Sumqayıt": (40.5855, 49.6317),
    "Mingəçevir": (40.7703, 47.0496),
}

BASE_RATINGS = {
    "driver.elvin": 4.9,
    "driver.murad": 4.8,
    "driver.kamran": 4.7,
    "driver.leyla": 4.6,
    "admin.sanan": 0.0,
}


@dataclass(frozen=True)
class RideSeed:
    key: str
    driver_key: str
    vehicle_key: str
    origin_city: str
    destination_city: str
    departure_offset_days: int
    departure_at: time
    total_seats: int
    price_per_seat: Decimal
    status: str
    description: str
    intermediate_cities: str | None = None
    smoking_allowed: bool = False
    pets_allowed: bool = False
    music_allowed: bool = True
    female_only: bool = False
    departure_offset_hours: int | None = None


@dataclass(frozen=True)
class BookingSeed:
    key: str
    ride_key: str
    passenger_key: str
    seats_booked: int
    status: str
    created_offset_days: int
    payment_deadline_offset_hours: int | None = None


@dataclass(frozen=True)
class ReviewSeed:
    key: str
    ride_key: str
    author_key: str
    target_key: str
    rating: int
    comment: str
    created_offset_days: int


@dataclass(frozen=True)
class MessageSeed:
    key: str
    ride_key: str
    sender_key: str
    content: str
    created_offset_days: int


@dataclass(frozen=True)
class PaymentSeed:
    key: str
    booking_key: str
    amount: Decimal
    status: str


USERS: list[dict[str, Any]] = [
    {"key": "driver.elvin", "phone": "+994501110001", "email": "elvin.dev@yolmates.test", "first_name": "Elvin", "last_name": "Məmmədov", "language": "az", "role": "driver", "city": "Bakı", "bio": "Punktual sürücüdür, səhər səfərlərini sevir.", "is_verified": True, "is_email_verified": True, "verification_status": "approved", "document_url": "/uploads/dev/elvin-license.pdf", "is_blocked": False},
    {"key": "passenger.aysel", "phone": "+994501110002", "email": "aysel.dev@yolmates.test", "first_name": "Aysel", "last_name": "Əliyeva", "language": "az", "role": "passenger", "city": "Bakı", "bio": "Həftəiçi Gəncə və Şamaxı istiqamətinə tez-tez gedir.", "is_verified": True, "is_email_verified": True, "verification_status": "none", "document_url": None, "is_blocked": False},
    {"key": "driver.murad", "phone": "+994501110003", "email": "murad.dev@yolmates.test", "first_name": "Murad", "last_name": "Hüseynov", "language": "ru", "role": "driver", "city": "Gəncə", "bio": "Gəncə-Bakı marşrutunda təcrübəli sürücü.", "is_verified": True, "is_email_verified": True, "verification_status": "approved", "document_url": "/uploads/dev/murad-license.pdf", "is_blocked": False},
    {"key": "passenger.nigar", "phone": "+994501110004", "email": "nigar.dev@yolmates.test", "first_name": "Nigar", "last_name": "Qasımova", "language": "en", "role": "passenger", "city": "Lənkəran", "bio": "Prefers quiet rides and advance booking.", "is_verified": True, "is_email_verified": True, "verification_status": "none", "document_url": None, "is_blocked": False},
    {"key": "driver.kamran", "phone": "+994501110005", "email": "kamran.dev@yolmates.test", "first_name": "Kamran", "last_name": "İsmayılov", "language": "az", "role": "driver", "city": "Sumqayıt", "bio": "Sumqayıt və Bakı arasında gündəlik səfərlər edir.", "is_verified": True, "is_email_verified": False, "verification_status": "approved", "document_url": "/uploads/dev/kamran-license.pdf", "is_blocked": False},
    {"key": "driver.leyla", "phone": "+994501110006", "email": "leyla.dev@yolmates.test", "first_name": "Leyla", "last_name": "Abbasova", "language": "ru", "role": "driver", "city": "Bakı", "bio": "Female-only rides for evening intercity trips.", "is_verified": True, "is_email_verified": True, "verification_status": "approved", "document_url": "/uploads/dev/leyla-license.pdf", "is_blocked": False},
    {"key": "passenger.reshad", "phone": "+994501110007", "email": "reshad.dev@yolmates.test", "first_name": "Rəşad", "last_name": "Kərimov", "language": "az", "role": "passenger", "city": "Quba", "bio": "Quba istiqamətində tez-tez səyahət edir.", "is_verified": True, "is_email_verified": False, "verification_status": "none", "document_url": None, "is_blocked": False},
    {"key": "passenger.fidan", "phone": "+994501110008", "email": "fidan.dev@yolmates.test", "first_name": "Fidan", "last_name": "Rzayeva", "language": "en", "role": "passenger", "city": "Şəki", "bio": "Books weekend trips and leaves detailed reviews.", "is_verified": True, "is_email_verified": True, "verification_status": "none", "document_url": None, "is_blocked": False},
    {"key": "passenger.orxan", "phone": "+994501110009", "email": "orxan.dev@yolmates.test", "first_name": "Orxan", "last_name": "Səfərov", "language": "az", "role": "passenger", "city": "Mingəçevir", "bio": "Uses carpool for flexible mid-week travel.", "is_verified": True, "is_email_verified": True, "verification_status": "none", "document_url": None, "is_blocked": True},
    {"key": "passenger.farid", "phone": "+994501110010", "email": "farid.dev@yolmates.test", "first_name": "Farid", "last_name": "Əhmədov", "language": "ru", "role": "passenger", "city": "Bakı", "bio": "Prefers music-friendly rides after work.", "is_verified": True, "is_email_verified": True, "verification_status": "none", "document_url": None, "is_blocked": False},
    {"key": "driver.pending", "phone": "+994501110011", "email": "sevda.dev@yolmates.test", "first_name": "Sevda", "last_name": "Məlikova", "language": "az", "role": "passenger", "city": "Bakı", "bio": "Driver application waiting for admin review.", "is_verified": False, "is_email_verified": True, "verification_status": "pending", "document_url": "/uploads/dev/sevda-doc.pdf", "is_blocked": False},
    {"key": "admin.sanan", "phone": "+994501110012", "email": "sanan.admin@yolmates.test", "first_name": "Sanan", "last_name": "Əliyev", "language": "en", "role": "admin", "city": "Bakı", "bio": "Development admin account for dashboard checks.", "is_verified": True, "is_email_verified": True, "verification_status": "approved", "document_url": None, "is_blocked": False},
]

VEHICLES: list[dict[str, Any]] = [
    {"key": "vehicle.elvin.prius", "user_key": "driver.elvin", "brand": "Toyota", "model": "Prius", "year": 2016, "color": "White", "plate_number": "90-YM-101"},
    {"key": "vehicle.murad.elantra", "user_key": "driver.murad", "brand": "Hyundai", "model": "Elantra", "year": 2019, "color": "Silver", "plate_number": "90-YM-102"},
    {"key": "vehicle.kamran.rio", "user_key": "driver.kamran", "brand": "Kia", "model": "Rio", "year": 2018, "color": "Blue", "plate_number": "90-YM-103"},
    {"key": "vehicle.leyla.cclass", "user_key": "driver.leyla", "brand": "Mercedes", "model": "C-Class", "year": 2020, "color": "Black", "plate_number": "90-YM-104"},
    {"key": "vehicle.elvin.passat", "user_key": "driver.elvin", "brand": "Volkswagen", "model": "Passat", "year": 2017, "color": "Gray", "plate_number": "90-YM-105"},
    {"key": "vehicle.murad.sonata", "user_key": "driver.murad", "brand": "Hyundai", "model": "Sonata", "year": 2021, "color": "Dark Blue", "plate_number": "90-YM-106"},
]

RIDES: list[RideSeed] = [
    RideSeed("ride-01", "driver.elvin", "vehicle.elvin.prius", "Bakı", "Gəncə", 0, time(7, 30), 3, 15, RIDE_ACTIVE, "Morning intercity ride with quick city center pickup."),
    RideSeed("ride-02", "driver.murad", "vehicle.murad.elantra", "Gəncə", "Bakı", 1, time(9, 0), 4, 16, RIDE_ACTIVE, "Return ride with luggage-friendly trunk space."),
    RideSeed("ride-03", "driver.kamran", "vehicle.kamran.rio", "Bakı", "Lənkəran", 1, time(18, 0), 3, 18, RIDE_ACTIVE, "Evening southern route, music is welcome."),
    RideSeed("ride-04", "driver.leyla", "vehicle.leyla.cclass", "Bakı", "Şəki", 2, time(8, 15), 3, 24, RIDE_ACTIVE, "Comfortable women-only ride with one coffee stop.", female_only=True),
    RideSeed("ride-05", "driver.elvin", "vehicle.elvin.passat", "Bakı", "Quba", 2, time(14, 0), 4, 12, RIDE_ACTIVE, "Direct route to Quba with room for backpacks."),
    RideSeed("ride-06", "driver.murad", "vehicle.murad.sonata", "Bakı", "Şamaxı", 3, time(10, 30), 3, 10, RIDE_ACTIVE, "Fast ride via main highway, no smoking."),
    RideSeed("ride-07", "driver.kamran", "vehicle.kamran.rio", "Sumqayıt", "Bakı", 0, time(19, 10), 3, 8, RIDE_ACTIVE, "Daily commuter ride from Sumqayıt to Bakı."),
    RideSeed("ride-08", "driver.leyla", "vehicle.leyla.cclass", "Bakı", "Mingəçevir", 4, time(7, 45), 4, 22, RIDE_ACTIVE, "Early departure with a quiet cabin.", music_allowed=False),
    RideSeed("ride-09", "driver.elvin", "vehicle.elvin.prius", "Bakı", "Lənkəran", 5, time(11, 20), 3, 20, RIDE_ACTIVE, "Midday ride, one planned tea stop.", intermediate_cities="Salyan"),
    RideSeed("ride-10", "driver.murad", "vehicle.murad.elantra", "Gəncə", "Bakı", 6, time(15, 30), 4, 17, RIDE_ACTIVE, "Afternoon trip suitable for business travel."),
    RideSeed("ride-11", "driver.kamran", "vehicle.kamran.rio", "Bakı", "Şamaxı", 6, time(9, 10), 2, 9, RIDE_ACTIVE, "Compact ride with limited luggage space."),
    RideSeed("ride-12", "driver.leyla", "vehicle.leyla.cclass", "Bakı", "Quba", 7, time(16, 40), 3, 14, RIDE_ACTIVE, "Weekend mountain route, women-only.", female_only=True),
    RideSeed("ride-13", "driver.elvin", "vehicle.elvin.prius", "Bakı", "Gəncə", -2, time(8, 0), 3, 15, RIDE_COMPLETED, "Completed early-week ride used for reviews."),
    RideSeed("ride-14", "driver.murad", "vehicle.murad.sonata", "Bakı", "Şəki", -1, time(17, 0), 4, 23, RIDE_COMPLETED, "Completed evening ride with smooth highway route.", intermediate_cities="İsmayıllı"),
    RideSeed("ride-15", "driver.kamran", "vehicle.kamran.rio", "Sumqayıt", "Bakı", -1, time(7, 50), 3, 8, RIDE_COMPLETED, "Completed commuter ride."),
    RideSeed("ride-16", "driver.leyla", "vehicle.leyla.cclass", "Bakı", "Lənkəran", -3, time(12, 15), 3, 19, RIDE_COMPLETED, "Completed women-only southbound ride.", female_only=True),
    RideSeed("ride-17", "driver.elvin", "vehicle.elvin.passat", "Bakı", "Mingəçevir", 3, time(6, 50), 4, 21, RIDE_CANCELLED, "Cancelled due to vehicle maintenance."),
    RideSeed("ride-18", "driver.murad", "vehicle.murad.elantra", "Bakı", "Quba", 4, time(13, 35), 3, 13, RIDE_CANCELLED, "Cancelled after weather warning."),
    RideSeed("ride-19", "driver.kamran", "vehicle.kamran.rio", "Bakı", "Quba", 0, time(0, 0), 4, 15, RIDE_ACTIVE, "Active but expired ride for negative tests.", departure_offset_hours=-5),
]

BOOKINGS: list[BookingSeed] = [
    BookingSeed("booking-01", "ride-01", "passenger.aysel", 1, BOOKING_PENDING, -1),
    BookingSeed("booking-02", "ride-01", "passenger.farid", 1, BOOKING_ACCEPTED, -1, payment_deadline_offset_hours=-2),
    BookingSeed("booking-03", "ride-02", "passenger.nigar", 2, BOOKING_ACCEPTED, -1, payment_deadline_offset_hours=12),
    BookingSeed("booking-04", "ride-03", "passenger.reshad", 1, BOOKING_PAID, -1),
    BookingSeed("booking-05", "ride-04", "passenger.fidan", 1, BOOKING_PENDING, -1),
    BookingSeed("booking-06", "ride-05", "passenger.orxan", 1, BOOKING_REJECTED, -2),
    BookingSeed("booking-07", "ride-06", "passenger.aysel", 1, BOOKING_CANCELLED, -2),
    BookingSeed("booking-08", "ride-07", "passenger.farid", 1, BOOKING_ACCEPTED, -1, payment_deadline_offset_hours=20),
    BookingSeed("booking-09", "ride-13", "passenger.aysel", 1, BOOKING_COMPLETED, -3),
    BookingSeed("booking-10", "ride-13", "passenger.nigar", 1, BOOKING_COMPLETED, -3),
    BookingSeed("booking-11", "ride-14", "passenger.reshad", 1, BOOKING_COMPLETED, -2),
    BookingSeed("booking-12", "ride-15", "passenger.fidan", 1, BOOKING_COMPLETED, -2),
    BookingSeed("booking-13", "ride-16", "passenger.orxan", 1, BOOKING_COMPLETED, -4),
    BookingSeed("booking-14", "ride-16", "passenger.farid", 1, BOOKING_COMPLETED, -4),
]

REVIEWS: list[ReviewSeed] = [
    ReviewSeed("review-01", "ride-13", "passenger.aysel", "driver.elvin", 5, "Çox rahat və vaxtında səfər oldu.", -2),
    ReviewSeed("review-02", "ride-13", "passenger.nigar", "driver.elvin", 4, "Clean car and smooth communication.", -2),
    ReviewSeed("review-03", "ride-13", "driver.elvin", "passenger.aysel", 5, "Sərnişin vaxtında gəldi və ünsiyyət çox rahat idi.", -2),
    ReviewSeed("review-04", "ride-14", "passenger.reshad", "driver.murad", 5, "Marşrut sürətli və təhlükəsiz idi.", -1),
    ReviewSeed("review-05", "ride-14", "driver.murad", "passenger.reshad", 4, "Everything went smoothly, passenger was punctual.", -1),
    ReviewSeed("review-06", "ride-15", "passenger.fidan", "driver.kamran", 4, "Sürətli şəhərdaxili gediş idi.", -1),
    ReviewSeed("review-07", "ride-16", "passenger.orxan", "driver.leyla", 5, "Комфортная поездка и спокойная атмосфера.", -3),
    ReviewSeed("review-08", "ride-16", "passenger.farid", "driver.leyla", 4, "Great women-only ride management and clear updates.", -3),
]

MESSAGES: list[MessageSeed] = [
    MessageSeed("message-01", "ride-01", "passenger.farid", "Salam, mən 20 Yanvar yaxınlığında qoşulacam.", -1),
    MessageSeed("message-02", "ride-01", "driver.elvin", "Salam, 07:20-də çıxırıq, gecikməyin.", -1),
    MessageSeed("message-03", "ride-03", "passenger.reshad", "Lənkəranda mərkəzə yaxın düşmək olar?", -1),
    MessageSeed("message-04", "ride-03", "driver.kamran", "Bəli, avtovağzal tərəfdə düşürə bilərəm.", -1),
    MessageSeed("message-05", "ride-13", "passenger.aysel", "Yoldayam, 5 dəqiqəyə oradayam.", -3),
    MessageSeed("message-06", "ride-13", "driver.elvin", "Oldu, girişdə gözləyirəm.", -3),
]

PAYMENTS: list[PaymentSeed] = [
    PaymentSeed("payment-01", "booking-04", 18.0, PAYMENT_COMPLETED),
    PaymentSeed("payment-02", "booking-11", 23.0, PAYMENT_COMPLETED),
    PaymentSeed("payment-03", "booking-03", 32.0, PAYMENT_PENDING),
]


def seed_uuid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, ":".join(parts))


def departure_datetime(offset_days: int, departure_at: time, offset_hours: int | None = None) -> datetime:
    if offset_hours is not None:
        return datetime.now(timezone.utc) + timedelta(hours=offset_hours)
    return datetime.combine(date.today() + timedelta(days=offset_days), departure_at, tzinfo=timezone.utc)


def created_datetime(offset_days: int, created_at: time | None = None) -> datetime:
    return datetime.combine(date.today() + timedelta(days=offset_days), created_at or time(9, 0), tzinfo=timezone.utc)


def city_point(city: str) -> str:
    lat, lon = CITY_COORDINATES[city]
    return f"POINT({lon} {lat})"


def mask_database_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.username or 'unknown'}@{parsed.hostname or 'unknown-host'}{f':{parsed.port}' if parsed.port else ''}/{parsed.path.lstrip('/') or 'unknown-db'}"


def assert_non_production() -> None:
    env_candidates = {
        "settings.ENVIRONMENT": settings.ENVIRONMENT,
        "ENVIRONMENT": os.getenv("ENVIRONMENT"),
        "APP_ENV": os.getenv("APP_ENV"),
        "NODE_ENV": os.getenv("NODE_ENV"),
    }
    normalized = {key: (value or "").strip().lower() for key, value in env_candidates.items()}
    if any(value.startswith("prod") for value in normalized.values() if value):
        raise RuntimeError("Seed is intended for development/demo only. Refusing to run because environment looks like production.")
    if normalized["settings.ENVIRONMENT"] not in SAFE_ENVIRONMENTS:
        raise RuntimeError(f"Seed is intended for development/demo only. Current settings.ENVIRONMENT={settings.ENVIRONMENT!r} is not allowed.")


def verify_connection() -> None:
    print("Seed is intended for development/demo only.")
    print(f"Target database: {mask_database_url(settings.DATABASE_URL)}")
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("Database connection check: SELECT 1 OK")


def find_by_unique(session: Session, model: type[Any], **filters: Any) -> Any | None:
    query = session.query(model)
    for field_name, value in filters.items():
        query = query.filter(getattr(model, field_name) == value)
    return query.first()


def upsert_user(session: Session, payload: dict[str, Any], hashed_password: str) -> tuple[User, bool]:
    user_id = seed_uuid("user", payload["key"])
    user = session.get(User, user_id) or find_by_unique(session, User, phone=payload["phone"])
    created = user is None
    if user is None:
        user = User(id=user_id)
        session.add(user)
    user.phone = payload["phone"]
    user.email = payload["email"]
    user.first_name = payload["first_name"]
    user.last_name = payload["last_name"]
    user.hashed_password = hashed_password
    user.avatar_url = payload.get("avatar_url")
    user.language = payload["language"]
    user.role = payload["role"]
    user.city = payload["city"]
    user.bio = payload["bio"]
    user.is_blocked = payload["is_blocked"]
    user.is_verified = payload["is_verified"]
    user.is_email_verified = payload["is_email_verified"]
    user.verification_status = payload["verification_status"]
    user.document_url = payload["document_url"]
    user.rating = BASE_RATINGS.get(payload["key"], 0.0)
    user.total_rides = 0
    session.flush()
    return user, created


def upsert_vehicle(session: Session, payload: dict[str, Any], owner_id: uuid.UUID) -> tuple[Vehicle, bool]:
    vehicle_id = seed_uuid("vehicle", payload["key"])
    vehicle = session.get(Vehicle, vehicle_id) or find_by_unique(session, Vehicle, plate_number=payload["plate_number"])
    created = vehicle is None
    if vehicle is None:
        vehicle = Vehicle(id=vehicle_id)
        session.add(vehicle)
    vehicle.user_id = owner_id
    vehicle.brand = payload["brand"]
    vehicle.model = payload["model"]
    vehicle.year = payload["year"]
    vehicle.color = payload["color"]
    vehicle.plate_number = payload["plate_number"]
    session.flush()
    return vehicle, created


def upsert_ride(session: Session, payload: RideSeed, driver_id: uuid.UUID, vehicle_id: uuid.UUID) -> tuple[Ride, bool]:
    ride_id = seed_uuid("ride", payload.key)
    ride = session.get(Ride, ride_id)
    created = ride is None
    if ride is None:
        ride = Ride(id=ride_id)
        session.add(ride)
    ride.driver_id = driver_id
    ride.vehicle_id = vehicle_id
    ride.origin_location = city_point(payload.origin_city)
    ride.origin_city = payload.origin_city
    ride.destination_location = city_point(payload.destination_city)
    ride.destination_city = payload.destination_city
    ride.intermediate_cities = payload.intermediate_cities
    ride.departure_time = departure_datetime(payload.departure_offset_days, payload.departure_at, payload.departure_offset_hours)
    ride.total_seats = payload.total_seats
    ride.available_seats = payload.total_seats
    ride.price_per_seat = Decimal(str(payload.price_per_seat)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    ride.status = payload.status
    ride.description = payload.description
    ride.smoking_allowed = payload.smoking_allowed
    ride.pets_allowed = payload.pets_allowed
    ride.music_allowed = payload.music_allowed
    ride.female_only = payload.female_only
    session.flush()
    return ride, created


def upsert_booking(session: Session, payload: BookingSeed, ride_id: uuid.UUID, passenger_id: uuid.UUID, total_price: Decimal) -> tuple[Booking, bool]:
    booking_id = seed_uuid("booking", payload.key)
    booking = session.get(Booking, booking_id)
    created = booking is None
    if booking is None:
        booking = Booking(id=booking_id)
        session.add(booking)
    booking.ride_id = ride_id
    booking.passenger_id = passenger_id
    booking.seats_booked = payload.seats_booked
    booking.total_price = Decimal(str(total_price)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    booking.status = payload.status
    booking.created_at = created_datetime(payload.created_offset_days)
    if payload.payment_deadline_offset_hours is not None:
        booking.payment_deadline = datetime.now(timezone.utc) + timedelta(hours=payload.payment_deadline_offset_hours)
    else:
        booking.payment_deadline = None
    session.flush()
    return booking, created


def upsert_review(session: Session, payload: ReviewSeed, ride_id: uuid.UUID, author_id: uuid.UUID, target_id: uuid.UUID) -> tuple[Review, bool]:
    review_id = seed_uuid("review", payload.key)
    review = session.get(Review, review_id)
    created = review is None
    if review is None:
        review = Review(id=review_id)
        session.add(review)
    review.ride_id = ride_id
    review.author_id = author_id
    review.target_id = target_id
    review.rating = payload.rating
    review.comment = payload.comment
    review.created_at = created_datetime(payload.created_offset_days)
    session.flush()
    return review, created


def upsert_message(session: Session, payload: MessageSeed, ride_id: uuid.UUID, sender_id: uuid.UUID) -> tuple[Message, bool]:
    message_id = seed_uuid("message", payload.key)
    message = session.get(Message, message_id)
    created = message is None
    if message is None:
        message = Message(id=message_id)
        session.add(message)
    message.ride_id = ride_id
    message.sender_id = sender_id
    message.content = payload.content
    message.created_at = created_datetime(payload.created_offset_days, time(8, 45))
    session.flush()
    return message, created


def upsert_payment(session: Session, payload: PaymentSeed, booking_id: uuid.UUID) -> tuple[Payment, bool]:
    payment_id = seed_uuid("payment", payload.key)
    payment = session.get(Payment, payment_id) or find_by_unique(session, Payment, transaction_id=f"dev-seed-{payload.key}")
    booking = session.get(Booking, booking_id)
    ride = session.get(Ride, booking.ride_id) if booking else None
    created = payment is None
    if payment is None:
        payment = Payment(id=payment_id)
        session.add(payment)
    amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    service_fee = (amount * Decimal("0.10")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    payment.booking_id = booking_id
    payment.passenger_id = booking.passenger_id if booking else None
    payment.driver_id = ride.driver_id if ride else None
    payment.amount = amount
    payment.service_fee = service_fee
    payment.driver_amount = amount - service_fee
    payment.currency = "AZN"
    payment.provider = "mock"
    payment.provider_payment_id = f"dev-seed-{payload.key}"
    payment.provider_checkout_url = None
    payment.status = payload.status
    payment.transaction_id = f"dev-seed-{payload.key}"
    payment.idempotency_key = f"dev-seed-payment-{payload.key}"
    payment.payment_metadata = {"seed": True}
    payment.updated_at = created_datetime(0)
    session.flush()
    return payment, created


def reconcile_ride_availability(session: Session) -> None:
    ride_ids = [seed_uuid("ride", ride.key) for ride in RIDES]
    booking_ids = [seed_uuid("booking", booking.key) for booking in BOOKINGS]
    rides = session.query(Ride).filter(Ride.id.in_(ride_ids)).all()
    bookings = session.query(Booking).filter(Booking.id.in_(booking_ids)).all()
    occupied_by_ride: dict[Any, int] = defaultdict(int)
    for booking in bookings:
        if booking.status in SEAT_OCCUPYING_BOOKING_STATUSES:
            occupied_by_ride[booking.ride_id] += booking.seats_booked  # type: ignore
    for ride in rides:
        ride.available_seats = max(ride.total_seats - occupied_by_ride.get(ride.id, 0), 0)  # type: ignore


def reconcile_user_metrics(session: Session, users_by_key: dict[str, User]) -> None:
    user_ids = [user.id for user in users_by_key.values()]
    users = list(users_by_key.values())
    rides = session.query(Ride).filter(Ride.driver_id.in_(user_ids)).all()
    bookings = session.query(Booking).filter(Booking.passenger_id.in_(user_ids)).all()
    reviews = session.query(Review).filter(Review.target_id.in_(user_ids)).all()

    completed_rides_by_driver: dict[Any, int] = defaultdict(int)
    for ride in rides:
        if ride.status == RIDE_COMPLETED:
            completed_rides_by_driver[ride.driver_id] += 1  # type: ignore

    completed_bookings_by_passenger: dict[Any, int] = defaultdict(int)
    for booking in bookings:
        if booking.status in {BOOKING_PAID, BOOKING_COMPLETED}:
            completed_bookings_by_passenger[booking.passenger_id] += 1  # type: ignore

    ratings_by_target: dict[Any, list[int]] = defaultdict(list)
    for review in reviews:
        ratings_by_target[review.target_id].append(review.rating)  # type: ignore

    keys_by_user_id: dict[Any, str] = {user.id: key for key, user in users_by_key.items()}
    for user in users:
        rating_list = ratings_by_target.get(user.id, [])  # type: ignore
        user.rating = round(sum(rating_list) / len(rating_list), 2) if rating_list else BASE_RATINGS.get(keys_by_user_id.get(user.id, ""), 0.0)  # type: ignore
        if user.role == "driver":
            user.total_rides = completed_rides_by_driver.get(user.id, 0)  # type: ignore
        elif user.role == "passenger":
            user.total_rides = completed_bookings_by_passenger.get(user.id, 0)  # type: ignore
        else:
            user.total_rides = 0


def seed() -> dict[str, dict[str, int]]:
    assert_non_production()
    verify_connection()
    hashed_password = get_password_hash(DEV_PASSWORD)
    summary: dict[str, dict[str, int]] = defaultdict(lambda: {"created": 0, "existing": 0})
    session = SessionLocal()
    try:
        users_by_key: dict[str, User] = {}
        vehicles_by_key: dict[str, Vehicle] = {}
        rides_by_key: dict[str, Ride] = {}
        bookings_by_key: dict[str, Booking] = {}

        for u_payload in USERS:
            user, created = upsert_user(session, u_payload, hashed_password)
            users_by_key[u_payload["key"]] = user
            summary["users"]["created" if created else "existing"] += 1

        for v_payload in VEHICLES:
            vehicle, created = upsert_vehicle(session, v_payload, users_by_key[v_payload["user_key"]].id)  # type: ignore
            vehicles_by_key[v_payload["key"]] = vehicle
            summary["vehicles"]["created" if created else "existing"] += 1

        for r_payload in RIDES:
            ride, created = upsert_ride(session, r_payload, users_by_key[r_payload.driver_key].id, vehicles_by_key[r_payload.vehicle_key].id)  # type: ignore
            rides_by_key[r_payload.key] = ride
            summary["rides"]["created" if created else "existing"] += 1

        for b_payload in BOOKINGS:
            ride = rides_by_key[b_payload.ride_key]
            passenger = users_by_key[b_payload.passenger_key]
            if ride.driver_id == passenger.id:
                raise RuntimeError(f"Invalid seed data: passenger cannot book own ride ({b_payload.key})")
            booking, created = upsert_booking(session, b_payload, ride.id, passenger.id, ride.price_per_seat * b_payload.seats_booked)  # type: ignore
            bookings_by_key[b_payload.key] = booking
            summary["bookings"]["created" if created else "existing"] += 1

        for rev_payload in REVIEWS:
            _, created = upsert_review(session, rev_payload, rides_by_key[rev_payload.ride_key].id, users_by_key[rev_payload.author_key].id, users_by_key[rev_payload.target_key].id)  # type: ignore
            summary["reviews"]["created" if created else "existing"] += 1

        for m_payload in MESSAGES:
            _, created = upsert_message(session, m_payload, rides_by_key[m_payload.ride_key].id, users_by_key[m_payload.sender_key].id)  # type: ignore
            summary["messages"]["created" if created else "existing"] += 1

        for p_payload in PAYMENTS:
            _, created = upsert_payment(session, p_payload, bookings_by_key[p_payload.booking_key].id)  # type: ignore
            summary["payments"]["created" if created else "existing"] += 1

        reconcile_ride_availability(session)
        reconcile_user_metrics(session, users_by_key)
        session.commit()
        return summary
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def print_summary(summary: dict[str, dict[str, int]]) -> None:
    print("Seed summary:")
    for key in ["users", "vehicles", "rides", "bookings", "reviews", "messages", "payments"]:
        counts = summary.get(key, {"created": 0, "existing": 0})
        print(f"  - {key}: created={counts['created']}, existing={counts['existing']}")
    print(f"Demo login password for seeded accounts: {DEV_PASSWORD}")


if __name__ == "__main__":
    print_summary(seed())
