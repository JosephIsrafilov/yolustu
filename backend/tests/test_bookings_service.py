from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
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
    from unittest.mock import MagicMock

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

    # Mock wallet behavior so get_or_create_for_update works and ledger works
    wallet_mock = MagicMock()
    wallet_mock.available_balance = Decimal("1000.00")
    wallet_mock.pending_balance = Decimal("0.00")
    wallet_mock.status = "succeeded"  # So it can also act as a payment mock
    wallet_mock.provider = "mock"
    wallet_mock.amount = Decimal("10.00")

    # We'll just mock PaymentService where it matters. But PaymentService itself
    # creates WalletRepository using db_mock.
    # To intercept the query, we can mock the entire PaymentService.

    service = BookingsService(db=db_mock)
    service.bookings = cast(BookingRepository, FakeBookingRepository())
    service.rides = cast(RideLookupPort, FakeRideLookupPort(ride))
    service.notifications = cast(NotificationService, FakeNotificationService())

    # Mock the PaymentService at the module level or inside BookingsService
    # But since create_booking imports PaymentService directly, we might need a patch
    # Or just mock db_mock.query().filter().with_for_update().first() to return a wallet

    db_mock.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = wallet_mock

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
    assert ride.available_seats == 1


def test_confirm_booking_does_not_change_seats():
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )

    confirmed = service.confirm_booking(booking.id, driver)

    assert confirmed.status == "accepted"
    assert ride.available_seats == 1


def test_reject_booking_restores_seats():
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


def test_cannot_create_booking_when_seats_are_insufficient():
    service, _, driver, passenger = make_service(ride_available_seats=1)
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
    from unittest.mock import patch, MagicMock

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
    service, ride, driver, passenger = make_service()
    booking = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=1), passenger
    )

    service.cancel_booking(booking.id, passenger)

    with pytest.raises(HTTPException) as exc:
        service.cancel_booking(booking.id, passenger)

    assert exc.value.status_code == 400
    assert "Booking cannot be cancelled in current status" in str(exc.value.detail)
    assert ride.available_seats == 3
