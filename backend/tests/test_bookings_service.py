from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.bookings.services import BookingsService
from app.domains.bookings.repositories import BookingRepository
from app.domains.bookings.schemas import BookingCreate
from app.domains.identity.dependencies import CurrentUser
from app.domains.trips.ports import RideLookupPort
from app.core.notifications import NotificationService


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    available_seats: int
    total_seats: int
    price_per_seat: float
    status: str = "active"


@dataclass
class FakeBooking:
    id: UUID
    ride_id: UUID
    passenger_id: UUID
    seats_booked: int
    total_price: float
    status: str = "pending"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ride: object | None = None
    passenger: object | None = None


class FakeBookingRepository:
    def __init__(self):
        self.bookings: dict[UUID, FakeBooking] = {}

    def create(
        self, ride_id: UUID, passenger_id: UUID, seats_booked: int, total_price: float
    ) -> FakeBooking:
        booking = FakeBooking(
            id=uuid4(),
            ride_id=ride_id,
            passenger_id=passenger_id,
            seats_booked=seats_booked,
            total_price=total_price,
        )
        self.bookings[booking.id] = booking
        return booking

    def get(self, booking_id: UUID) -> FakeBooking | None:
        return self.bookings.get(booking_id)

    def get_for_update(self, booking_id: UUID) -> FakeBooking | None:
        return self.get(booking_id)

    def get_active_for_ride_and_passenger(
        self, ride_id: UUID, passenger_id: UUID
    ) -> FakeBooking | None:
        for booking in self.bookings.values():
            if (
                booking.ride_id == ride_id
                and booking.passenger_id == passenger_id
                and booking.status not in ["cancelled", "rejected"]
            ):
                return booking
        return None

    def list_for_passenger(self, passenger_id: UUID) -> list[FakeBooking]:
        return [
            booking
            for booking in self.bookings.values()
            if booking.passenger_id == passenger_id
        ]

    def list_requests_for_driver(self, driver_id: UUID) -> list[FakeBooking]:
        return list(self.bookings.values())

    def save(self, booking: FakeBooking) -> FakeBooking:
        self.bookings[booking.id] = booking
        return booking


class FakeRideLookupPort:
    def __init__(self, ride: FakeRide):
        self.ride = ride

    def get_ride(self, ride_id: UUID) -> FakeRide | None:
        return self.ride if self.ride.id == ride_id else None

    def get_ride_for_update(self, ride_id: UUID) -> FakeRide | None:
        return self.get_ride(ride_id)


class FakeNotificationService:
    def send_push_notification(self, **kwargs):
        return None


def make_current_user(user_id: UUID, role: str) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994000000000",
        first_name="Test",
        last_name="User",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


def make_service(
    ride_available_seats: int = 3,
) -> tuple[BookingsService, FakeRide, CurrentUser, CurrentUser]:
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=ride_available_seats,
        total_seats=4,
        price_per_seat=10.0,
        status="active",
    )

    service = BookingsService(db=cast(Session, None))  # db is replaced with fakes below
    service.bookings = cast(BookingRepository, FakeBookingRepository())
    service.rides = cast(RideLookupPort, FakeRideLookupPort(ride))
    service.notifications = cast(NotificationService, FakeNotificationService())

    driver = make_current_user(driver_id, role="driver")
    passenger = make_current_user(passenger_id, role="passenger")
    return service, ride, driver, passenger


def test_passenger_cannot_book_own_ride():
    service, ride, driver, _ = make_service()

    with pytest.raises(HTTPException) as exc:
        service.create_booking(BookingCreate(ride_id=ride.id, seats_booked=1), driver)

    assert exc.value.status_code == 400
    assert "own ride" in str(exc.value.detail)


def test_create_pending_booking_does_not_decrement_seats():
    service, ride, _, passenger = make_service()

    response = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    assert response.status == "pending"
    assert ride.available_seats == 3


def test_confirm_booking_decrements_seats():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    confirmed = service.confirm_booking(booking.id, driver)

    assert confirmed.status == "accepted"
    assert ride.available_seats == 1


def test_reject_booking_does_not_decrement_seats():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )

    rejected = service.reject_booking(booking.id, driver)

    assert rejected.status == "rejected"
    assert ride.available_seats == 3


def test_cancel_accepted_booking_restores_seats():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )
    service.confirm_booking(booking.id, driver)

    cancelled = service.cancel_booking(booking.id, passenger)

    assert cancelled.status == "cancelled"
    assert ride.available_seats == 3


def test_cannot_confirm_booking_when_seats_are_insufficient():
    service, _, driver, passenger = make_service(ride_available_seats=1)
    booking = service.create_booking(
        BookingCreate(ride_id=service.rides.ride.id, seats_booked=1), passenger
    )

    other_passenger = make_current_user(uuid4(), role="passenger")
    service.create_booking(
        BookingCreate(ride_id=service.rides.ride.id, seats_booked=1), other_passenger
    )
    service.confirm_booking(booking.id, driver)

    second_booking = service.bookings.get_active_for_ride_and_passenger(
        service.rides.ride.id, other_passenger.id
    )
    with pytest.raises(HTTPException) as exc:
        service.confirm_booking(second_booking.id, driver)

    assert exc.value.status_code == 400
    assert "Not enough seats" in str(exc.value.detail)


def test_duplicate_booking_is_forbidden():
    service, ride, _, passenger = make_service()
    service.create_booking(BookingCreate(ride_id=ride.id, seats_booked=1), passenger)

    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(ride_id=ride.id, seats_booked=1), passenger
        )

    assert exc.value.status_code == 400
    assert "already exists" in str(exc.value.detail)


def test_cancel_paid_booking_restores_seats_if_ride_not_completed():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )
    service.confirm_booking(booking.id, driver)

    stored = service.bookings.get(booking.id)
    stored.status = "paid"

    cancelled = service.cancel_booking(booking.id, passenger)

    assert cancelled.status == "cancelled"
    assert ride.available_seats == 3
