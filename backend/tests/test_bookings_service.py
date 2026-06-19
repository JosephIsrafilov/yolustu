from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, cast
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.notifications import NotificationService
from app.domains.bookings.repositories import (
    BookingRepository,
    SeatReservationRepository,
)
from app.domains.bookings.schemas import BookingCreate
from app.domains.bookings.services import BookingsService
from app.domains.identity.dependencies import CurrentUser
from app.domains.trips.ports import RideLookupPort


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    available_seats: int
    total_seats: int
    price_per_seat: Decimal
    departure_time: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=1)
    )
    status: str = "active"
    available_spots: list[str] | None = None


@dataclass
class FakeBooking:
    id: UUID
    ride_id: UUID
    passenger_id: UUID
    seats_booked: int
    total_price: Decimal
    status: str = "pending"
    payment_deadline: datetime | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ride: object | None = None
    passenger: object | None = None
    selected_spots: object | None = None


class FakeBookingRepository:
    def __init__(self):
        self.bookings: dict[UUID, FakeBooking] = {}

    def create(
        self,
        ride_id: UUID,
        passenger_id: UUID,
        seats_booked: int,
        total_price: Decimal,
        selected_spots: list[str] | None = None,
    ) -> FakeBooking:
        booking = FakeBooking(
            id=uuid4(),
            ride_id=ride_id,
            passenger_id=passenger_id,
            seats_booked=seats_booked,
            total_price=total_price,
            selected_spots=selected_spots,
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

    def list_active_for_ride(self, ride_id: UUID) -> list[FakeBooking]:
        return [
            booking
            for booking in self.bookings.values()
            if booking.ride_id == ride_id
            and booking.status not in ["cancelled", "rejected", "expired", "no_show"]
        ]

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


class FakeSeatReservationRepository:
    def __init__(self, ride: FakeRide):
        self.ride = ride
        self.available = [
            "front_right",
            "back_left",
            "back_middle",
            "back_right",
        ][: ride.available_seats]
        self.assignments: dict[UUID, list[str]] = {}

    def available_spots(self, ride_id: UUID) -> list[str]:
        return list(self.available) if ride_id == self.ride.id else []

    def allocate(
        self, booking: FakeBooking, ride_id: UUID, selected_spots: list[str]
    ) -> None:
        if ride_id != self.ride.id or any(
            spot not in self.available for spot in selected_spots
        ):
            raise ValueError("Selected seat is not available")
        self.assignments[booking.id] = list(selected_spots)
        self.available = [spot for spot in self.available if spot not in selected_spots]

    def release(self, booking_id: UUID, released_at: datetime) -> int:
        released = self.assignments.pop(booking_id, [])
        layout = ["front_right", "back_left", "back_middle", "back_right"]
        self.available = [
            spot
            for spot in layout[: self.ride.total_seats]
            if spot in self.available or spot in released
        ]
        return len(released)


class FakeReservationWalletService:
    def __init__(self):
        self.reserved: list[tuple[UUID, Decimal]] = []
        self.captured: list[UUID] = []
        self.released: list[UUID] = []

    def reserve_for_booking(
        self, booking: FakeBooking, ride: FakeRide, current_user: CurrentUser
    ) -> None:
        self.reserved.append((booking.id, booking.total_price))

    def capture_for_booking(self, booking: FakeBooking, ride: FakeRide) -> None:
        self.captured.append(booking.id)
        booking.status = "paid"
        booking.payment_deadline = None

    def release_for_booking(self, booking: FakeBooking, ride: FakeRide) -> None:
        self.released.append(booking.id)


def make_current_user(user_id: UUID, role: str) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+10000000000",
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
        price_per_seat=Decimal("10.00"),
        status="active",
    )

    db_mock = MagicMock(spec=Session)
    service = BookingsService(db=db_mock)
    service.bookings = cast(BookingRepository, FakeBookingRepository())
    service.seats = cast(SeatReservationRepository, FakeSeatReservationRepository(ride))
    service.rides = cast(RideLookupPort, FakeRideLookupPort(ride))
    cast(Any, service).reservations = FakeReservationWalletService()
    service.notifications = cast(NotificationService, FakeNotificationService())

    driver = make_current_user(driver_id, role="driver")
    passenger = make_current_user(passenger_id, role="passenger")
    return service, ride, driver, passenger


def test_passenger_cannot_book_own_ride():
    service, ride, driver, _ = make_service()

    with pytest.raises(HTTPException) as exc:
        service.create_booking(BookingCreate(ride_id=ride.id, seats_booked=1), driver)

    assert exc.value.status_code == 403
    assert "own ride" in str(exc.value.detail)


def test_create_booking_decrements_seats():
    service, ride, _, passenger = make_service()

    response = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    assert response.status == "pending"
    assert response.selected_spots == ["front_right", "back_left"]
    assert ride.available_seats == 1
    assert response.payment_deadline is not None


def test_create_booking_reserves_wallet_amount():
    service, ride, _, passenger = make_service()

    response = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    reservations = cast(Any, service).reservations
    assert reservations.reserved == [(response.id, Decimal("20.00"))]


def test_selected_spot_count_must_match_seats_booked():
    service, ride, _, passenger = make_service()

    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(
                ride_id=ride.id,
                seats_booked=2,
                selected_spots=["front_right"],
            ),
            passenger,
        )

    assert exc.value.status_code == 400
    assert "count must match" in str(exc.value.detail)


def test_exact_seat_conflict_returns_409():
    service, ride, _, passenger = make_service()
    service.create_booking(
        BookingCreate(
            ride_id=ride.id,
            seats_booked=1,
            selected_spots=["front_right"],
        ),
        passenger,
    )

    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(
                ride_id=ride.id,
                seats_booked=1,
                selected_spots=["front_right"],
            ),
            make_current_user(uuid4(), role="passenger"),
        )

    assert exc.value.status_code == 409


def test_confirm_booking_captures_wallet_hold_without_changing_seats():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    confirmed = service.confirm_booking(booking.id, driver)

    reservations = cast(Any, service).reservations
    assert confirmed.status == "paid"
    assert booking.id in reservations.captured
    assert ride.available_seats == 1


def test_reject_booking_restores_seats_and_releases_wallet_hold():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )

    rejected = service.reject_booking(booking.id, driver)

    reservations = cast(Any, service).reservations
    assert rejected.status == "rejected"
    assert booking.id in reservations.released
    assert ride.available_seats == 3


def test_cancel_pending_booking_restores_seats_and_releases_wallet_hold():
    service, ride, _, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    cancelled = service.cancel_booking(booking.id, passenger)

    reservations = cast(Any, service).reservations
    assert cancelled.status == "cancelled"
    assert booking.id in reservations.released
    assert ride.available_seats == 3


def test_cannot_create_booking_when_seats_are_insufficient():
    service, _, _, passenger = make_service(ride_available_seats=1)
    service.create_booking(
        BookingCreate(ride_id=service.rides.ride.id, seats_booked=1), passenger
    )

    other_passenger = make_current_user(uuid4(), role="passenger")
    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(ride_id=service.rides.ride.id, seats_booked=1),
            other_passenger,
        )

    assert exc.value.status_code == 400
    assert "Not enough available seats" in str(exc.value.detail)


def test_multiple_bookings_allowed_for_passenger():
    service, ride, _, passenger = make_service()
    b1 = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )
    b2 = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )

    assert b1.id != b2.id
    assert ride.available_seats == 1


def test_cancel_paid_booking_restores_seats_if_ride_not_completed():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )
    service.confirm_booking(booking.id, driver)

    stored = service.bookings.get(booking.id)
    stored.status = "paid"

    with patch("app.domains.payments.services.PaymentService") as mock_ps_class:
        mock_ps_instance = mock_ps_class.return_value
        mock_payment = MagicMock()
        mock_payment.id = uuid4()
        mock_ps_instance.payments.get_succeeded_for_booking.return_value = mock_payment

        def mock_refund(*args, **kwargs):
            stored.status = "cancelled"
            ride.available_seats += stored.seats_booked
            return {"detail": "Mock refund"}

        mock_ps_instance.refund_payment.side_effect = mock_refund
        cancelled = service.cancel_booking(booking.id, passenger)

    assert cancelled.status == "cancelled"
    assert ride.available_seats == 3


def test_double_reject_booking_fails():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )

    service.reject_booking(booking.id, driver)

    with pytest.raises(HTTPException) as exc:
        service.reject_booking(booking.id, driver)

    assert exc.value.status_code == 400
    assert "Booking is not pending" in str(exc.value.detail)
    assert ride.available_seats == 3


def test_double_cancel_booking_fails():
    service, ride, _, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )

    service.cancel_booking(booking.id, passenger)

    with pytest.raises(HTTPException) as exc:
        service.cancel_booking(booking.id, passenger)

    assert exc.value.status_code == 400
    assert "Booking cannot be cancelled in current status" in str(exc.value.detail)
    assert ride.available_seats == 3
