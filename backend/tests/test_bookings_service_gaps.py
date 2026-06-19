"""Service-layer unit tests for BookingsService — covers missed lines."""

import pytest
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, cast
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.bookings.services import BookingsService
from app.domains.bookings.repositories import (
    BookingRepository,
    SeatReservationRepository,
)
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
    status: str = "active"
    departure_time: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=1)
    )
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    origin_city: str = "Baku"
    destination_city: str = "Ganja"
    intermediate_cities: str | None = None
    description: str | None = None
    smoking_allowed: bool = False
    pets_allowed: bool = False
    music_allowed: bool = True
    female_only: bool = False
    origin_location: dict = field(default_factory=lambda: {"lat": 40.0, "lon": 49.0})
    destination_location: dict = field(
        default_factory=lambda: {"lat": 40.6, "lon": 46.3}
    )
    vehicle: object | None = None
    driver: object | None = None
    share_token: str | None = None
    vehicle_id: UUID = field(default_factory=uuid4)
    available_spots: list | None = None


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
    ride: FakeRide | None = None
    passenger: object | None = None
    selected_spots: list | None = None


class FakeBookingRepository:
    def __init__(self, bookings=None):
        self.bookings: dict[UUID, FakeBooking] = {b.id: b for b in (bookings or [])}

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
                and booking.status not in ["cancelled", "rejected", "expired"]
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
        return [
            booking
            for booking in self.bookings.values()
            if booking.ride is None or booking.ride.driver_id == driver_id
        ]

    def save(self, booking: FakeBooking) -> FakeBooking:
        self.bookings[booking.id] = booking
        return booking


class FakeRideLookupPort:
    def __init__(self, rides=None):
        self.rides: dict[UUID, FakeRide] = {r.id: r for r in (rides or [])}

    def get_ride(self, ride_id: UUID) -> FakeRide | None:
        return self.rides.get(ride_id)

    def get_ride_for_update(self, ride_id: UUID) -> FakeRide | None:
        return self.get_ride(ride_id)


class FakeNotificationService:
    def __init__(self):
        self.sent_notifications = []

    def send_push_notification(self, user_id, title, body, data=None):
        self.sent_notifications.append(
            {"user_id": user_id, "title": title, "body": body, "data": data}
        )
        return None


class FakeSeatReservationRepository:
    def __init__(self, rides, bookings):
        self.rides = {ride.id: ride for ride in rides}
        self.available = {
            ride.id: [
                "front_right",
                "back_left",
                "back_middle",
                "back_right",
            ][: ride.available_seats]
            for ride in rides
        }
        self.assignments = {
            booking.id: list(booking.selected_spots)
            if booking.selected_spots
            else (
                [
                    spot
                    for spot in [
                        "front_right",
                        "back_left",
                        "back_middle",
                        "back_right",
                    ][: self.rides[booking.ride_id].total_seats]
                    if spot not in self.available[booking.ride_id]
                ][: booking.seats_booked]
                if booking.ride_id in self.rides
                else []
            )
            for booking in bookings
        }
        self.booking_rides = {booking.id: booking.ride_id for booking in bookings}

    def available_spots(self, ride_id: UUID) -> list[str]:
        return list(self.available.get(ride_id, []))

    def allocate(
        self, booking: FakeBooking, ride_id: UUID, selected_spots: list[str]
    ) -> None:
        available = self.available.get(ride_id, [])
        if any(spot not in available for spot in selected_spots):
            raise ValueError("Selected seat is not available")
        self.assignments[booking.id] = list(selected_spots)
        self.booking_rides[booking.id] = ride_id
        self.available[ride_id] = [
            spot for spot in available if spot not in selected_spots
        ]

    def release(self, booking_id: UUID, released_at: datetime) -> int:
        released = self.assignments.pop(booking_id, [])
        booking_ride_id = self.booking_rides.get(booking_id)
        if booking_ride_id is None:
            return 0
        ride = self.rides[booking_ride_id]
        current = self.available[booking_ride_id]
        self.available[booking_ride_id] = [
            spot
            for spot in [
                "front_right",
                "back_left",
                "back_middle",
                "back_right",
            ][: ride.total_seats]
            if spot in current or spot in released
        ]
        return len(released)


class FakeReservationWalletService:
    def __init__(self) -> None:
        self.reserved: list[UUID] = []
        self.captured: list[UUID] = []
        self.released: list[UUID] = []

    def reserve_for_booking(
        self,
        booking: FakeBooking,
        ride: FakeRide,
        current_user: CurrentUser,
    ) -> None:
        self.reserved.append(booking.id)

    def capture_for_booking(self, booking: FakeBooking, ride: FakeRide) -> None:
        self.captured.append(booking.id)
        booking.status = "paid"
        booking.payment_deadline = None

    def release_for_booking(self, booking: FakeBooking, ride: FakeRide) -> None:
        self.released.append(booking.id)


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


def make_service(rides=None, bookings=None, db=None):
    rides = rides or []
    bookings = bookings or []
    service = BookingsService(db=cast(Session, db))
    ride_repo = FakeRideLookupPort(rides)
    booking_repo = FakeBookingRepository(bookings)
    notification_svc = FakeNotificationService()

    service.bookings = cast(BookingRepository, booking_repo)
    service.seats = cast(
        SeatReservationRepository,
        FakeSeatReservationRepository(rides, bookings),
    )
    service.rides = cast(RideLookupPort, ride_repo)
    cast(Any, service).reservations = FakeReservationWalletService()
    service.notifications = cast(NotificationService, notification_svc)

    return service, booking_repo, ride_repo, notification_svc


# --- create_booking Validation Edge Cases ---


def test_create_booking_zero_seats():
    service, _, _, _ = make_service()
    passenger = make_current_user(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(ride_id=uuid4(), seats_booked=0), passenger
        )
    assert exc.value.status_code == 400
    assert "seats_booked must be at least 1" in exc.value.detail


def test_create_booking_ride_not_found():
    service, _, _, _ = make_service()
    passenger = make_current_user(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(ride_id=uuid4(), seats_booked=1), passenger
        )
    assert exc.value.status_code == 404
    assert "Ride not found" in exc.value.detail


def test_create_booking_ride_not_active():
    driver_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=3,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="completed",
    )
    service, _, _, _ = make_service(rides=[ride])
    passenger = make_current_user(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(ride_id=ride.id, seats_booked=1), passenger
        )
    assert exc.value.status_code == 400
    assert "Ride is not active" in exc.value.detail


def test_create_booking_ride_already_departed():
    driver_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=3,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="active",
        departure_time=datetime.now(timezone.utc) - timedelta(minutes=10),
    )
    service, _, _, _ = make_service(rides=[ride])
    passenger = make_current_user(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        service.create_booking(
            BookingCreate(ride_id=ride.id, seats_booked=1), passenger
        )
    assert exc.value.status_code == 400
    assert "already departed" in exc.value.detail


def test_create_booking_admin_role_forbidden():
    driver_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=3,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="active",
    )
    service, _, _, _ = make_service(rides=[ride])
    admin = make_current_user(uuid4(), "admin")
    with pytest.raises(HTTPException) as exc:
        service.create_booking(BookingCreate(ride_id=ride.id, seats_booked=1), admin)
    assert exc.value.status_code == 403
    assert "Admin cannot book rides" in exc.value.detail


def test_create_booking_db_commit_and_refresh():
    driver_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=3,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="active",
    )
    mock_db = MagicMock(spec=Session)
    service, _, _, notifications = make_service(rides=[ride], db=mock_db)
    passenger = make_current_user(uuid4(), "passenger")

    res = service.create_booking(
        BookingCreate(ride_id=ride.id, seats_booked=2), passenger
    )
    assert res.seats_booked == 2
    assert ride.available_seats == 1
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    mock_db.query.assert_not_called()
    assert len(notifications.sent_notifications) == 1
    assert notifications.sent_notifications[0]["user_id"] == driver_id
    assert notifications.sent_notifications[0]["title"] == "New Booking Request"


# --- get_my_bookings & get_booking_requests with lazy-expires ---


def test_get_my_bookings_lazy_expires():
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=uuid4(),
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="active",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        payment_deadline=datetime.now(timezone.utc) - timedelta(seconds=1),
        ride=ride,
    )

    service, booking_repo, _, notifications = make_service(
        rides=[ride], bookings=[booking]
    )

    passenger = make_current_user(passenger_id, "passenger")
    res = service.get_my_bookings(passenger)

    assert len(res) == 1
    assert res[0].status == "expired"
    assert booking.status == "expired"
    assert ride.available_seats == 4
    assert booking.id in cast(Any, service).reservations.released
    assert len(notifications.sent_notifications) == 1
    assert notifications.sent_notifications[0]["user_id"] == passenger_id
    assert notifications.sent_notifications[0]["title"] == "Rezerv vaxtı bitdi"


def test_get_booking_requests_lazy_expires():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=1,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="active",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        payment_deadline=datetime.now(timezone.utc) - timedelta(seconds=1),
        ride=ride,
    )

    service, _, _, notifications = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    res = service.get_booking_requests(driver)

    assert len(res) == 1
    assert res[0].status == "expired"
    assert booking.status == "expired"
    assert ride.available_seats == 3
    assert booking.id in cast(Any, service).reservations.released
    assert len(notifications.sent_notifications) == 1


# --- confirm_booking Edge Cases ---


def test_confirm_booking_booking_not_found():
    service, _, _, _ = make_service()
    driver = make_current_user(uuid4(), "driver")
    with pytest.raises(HTTPException) as exc:
        service.confirm_booking(uuid4(), driver)
    assert exc.value.status_code == 404
    assert "Booking not found" in exc.value.detail


def test_confirm_booking_unauthorized_driver():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    non_driver = make_current_user(uuid4(), "driver")
    with pytest.raises(HTTPException) as exc:
        service.confirm_booking(booking.id, non_driver)
    assert exc.value.status_code == 403
    assert "Only the driver can confirm" in exc.value.detail


def test_confirm_booking_not_pending():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        service.confirm_booking(booking.id, driver)
    assert exc.value.status_code == 400
    assert "Booking is not pending" in exc.value.detail


def test_confirm_booking_ride_not_active():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="completed",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        service.confirm_booking(booking.id, driver)
    assert exc.value.status_code == 400
    assert "Ride is not active" in exc.value.detail


def test_confirm_booking_invalid_transition():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="active",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    with patch(
        "app.domains.bookings.services.can_transition_booking", return_value=False
    ):
        with pytest.raises(HTTPException) as exc:
            service.confirm_booking(booking.id, driver)
    assert exc.value.status_code == 400
    assert "Invalid booking transition" in exc.value.detail


# --- reject_booking Edge Cases ---


def test_reject_booking_unauthorized_driver():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    non_driver = make_current_user(uuid4(), "driver")
    with pytest.raises(HTTPException) as exc:
        service.reject_booking(booking.id, non_driver)
    assert exc.value.status_code == 403
    assert "Only the driver can reject" in exc.value.detail


def test_reject_booking_not_pending():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        service.reject_booking(booking.id, driver)
    assert exc.value.status_code == 400
    assert "Booking is not pending" in exc.value.detail


def test_reject_booking_invalid_transition():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    with patch(
        "app.domains.bookings.services.can_transition_booking", return_value=False
    ):
        with pytest.raises(HTTPException) as exc:
            service.reject_booking(booking.id, driver)
    assert exc.value.status_code == 400
    assert "Invalid booking transition" in exc.value.detail


def test_reject_booking_ride_completed():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="completed",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, notifications = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    res = service.reject_booking(booking.id, driver)
    assert res.status == "rejected"
    assert ride.available_seats == 2
    assert len(notifications.sent_notifications) == 1
    assert notifications.sent_notifications[0]["user_id"] == passenger_id
    assert notifications.sent_notifications[0]["title"] == "Booking Declined"


# --- cancel_booking Edge Cases ---


def test_cancel_booking_unauthorized_passenger():
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=uuid4(),
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    non_passenger = make_current_user(uuid4(), "passenger")
    with pytest.raises(HTTPException) as exc:
        service.cancel_booking(booking.id, non_passenger)
    assert exc.value.status_code == 403
    assert "Only the passenger can cancel" in exc.value.detail


def test_cancel_booking_invalid_status():
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=uuid4(),
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )

    for status in ["cancelled", "rejected", "completed", "expired"]:
        booking = FakeBooking(
            id=uuid4(),
            ride_id=ride.id,
            passenger_id=passenger_id,
            seats_booked=2,
            total_price=Decimal("20.0"),
            status=status,
            ride=ride,
        )
        service, _, _, _ = make_service(rides=[ride], bookings=[booking])
        passenger = make_current_user(passenger_id, "passenger")
        with pytest.raises(HTTPException) as exc:
            service.cancel_booking(booking.id, passenger)
        assert exc.value.status_code == 400
        assert "Booking cannot be cancelled in current status" in exc.value.detail


def test_cancel_booking_invalid_transition():
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=uuid4(),
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="boarded",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    passenger = make_current_user(passenger_id, "passenger")
    with pytest.raises(HTTPException) as exc:
        service.cancel_booking(booking.id, passenger)
    assert exc.value.status_code == 400
    assert "Invalid booking transition" in exc.value.detail


def test_cancel_booking_paid_refund_success():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="paid",
        ride=ride,
    )

    mock_db = MagicMock(spec=Session)
    service, _, _, _ = make_service(rides=[ride], bookings=[booking], db=mock_db)

    mock_payment = MagicMock()
    mock_payment.id = uuid4()

    passenger = make_current_user(passenger_id, "passenger")

    with patch("app.domains.payments.services.PaymentService") as mock_ps_class:
        mock_ps_instance = mock_ps_class.return_value
        mock_ps_instance.payments.get_succeeded_for_booking.return_value = mock_payment
        mock_ps_instance.refund_payment.return_value = {"detail": "Payment refunded"}

        res = service.cancel_booking(booking.id, passenger)

        mock_ps_instance.refund_payment.assert_called_once_with(mock_payment.id, None)
        assert res.id == booking.id


def test_cancel_booking_paid_no_payment():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="paid",
        ride=ride,
    )

    service, _, _, notifications = make_service(
        rides=[ride], bookings=[booking], db=None
    )

    passenger = make_current_user(passenger_id, "passenger")
    res = service.cancel_booking(booking.id, passenger)

    assert res.status == "cancelled"
    assert ride.available_seats == 4
    assert len(notifications.sent_notifications) == 1
    assert notifications.sent_notifications[0]["user_id"] == driver_id
    assert notifications.sent_notifications[0]["title"] == "Booking Cancelled"


def test_cancel_booking_ride_completed():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="completed",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    passenger = make_current_user(passenger_id, "passenger")
    res = service.cancel_booking(booking.id, passenger)
    assert res.status == "cancelled"
    assert ride.available_seats == 2


# --- Boarding and No Show Status Cases ---


def test_mark_boarded_success():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    res = service.mark_boarded(booking.id, driver)
    assert res.status == "boarded"


def test_mark_no_show_success():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    res = service.mark_no_show(booking.id, driver)
    assert res.status == "no_show"


def test_boarding_status_admin_can_update():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    admin = make_current_user(uuid4(), "admin")
    res = service.mark_boarded(booking.id, admin)
    assert res.status == "boarded"


def test_boarding_status_unauthorized():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    passenger = make_current_user(passenger_id, "passenger")
    with pytest.raises(HTTPException) as exc:
        service.mark_boarded(booking.id, passenger)
    assert exc.value.status_code == 403
    assert "Only the driver can update boarding status" in exc.value.detail


def test_boarding_status_already_target():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="boarded",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    res = service.mark_boarded(booking.id, driver)
    assert res.status == "boarded"


def test_boarding_status_invalid_transition():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=driver_id,
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="pending",
        ride=ride,
    )
    service, _, _, _ = make_service(rides=[ride], bookings=[booking])

    driver = make_current_user(driver_id, "driver")
    with pytest.raises(HTTPException) as exc:
        service.mark_boarded(booking.id, driver)
    assert exc.value.status_code == 400
    assert "Cannot mark booking as" in exc.value.detail


# --- Helper Methods & _lazy_expire_bookings Edge Cases ---


def test_get_booking_not_found():
    service, _, _, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        service._get_booking(uuid4())
    assert exc.value.status_code == 404
    assert "Booking not found" in exc.value.detail


def test_get_booking_for_update_not_found():
    service, _, _, _ = make_service()
    with pytest.raises(HTTPException) as exc:
        service._get_booking_for_update(uuid4())
    assert exc.value.status_code == 404
    assert "Booking not found" in exc.value.detail


def test_get_booking_ride_not_found():
    service, _, _, _ = make_service()
    booking = FakeBooking(
        id=uuid4(),
        ride_id=uuid4(),
        passenger_id=uuid4(),
        seats_booked=1,
        total_price=Decimal("10.0"),
    )
    with pytest.raises(HTTPException) as exc:
        service._get_booking_ride(booking)
    assert exc.value.status_code == 404
    assert "Ride not found" in exc.value.detail


def test_get_booking_ride_for_update_not_found():
    service, _, _, _ = make_service()
    booking = FakeBooking(
        id=uuid4(),
        ride_id=uuid4(),
        passenger_id=uuid4(),
        seats_booked=1,
        total_price=Decimal("10.0"),
    )
    with pytest.raises(HTTPException) as exc:
        service._get_booking_ride_for_update(booking)
    assert exc.value.status_code == 404
    assert "Ride not found" in exc.value.detail


def test_lazy_expire_bookings_no_ride_found():
    passenger_id = uuid4()
    booking = FakeBooking(
        id=uuid4(),
        ride_id=uuid4(),
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        payment_deadline=datetime.now(timezone.utc) - timedelta(seconds=1),
        ride=None,
    )

    service, booking_repo, _, notifications = make_service(bookings=[booking])
    service._lazy_expire_bookings([booking])

    assert booking.status == "expired"
    assert len(notifications.sent_notifications) == 1
    assert notifications.sent_notifications[0]["user_id"] == passenger_id
    assert notifications.sent_notifications[0]["title"] == "Rezerv vaxtı bitdi"


def test_lazy_expire_bookings_no_restore_if_completed():
    passenger_id = uuid4()
    ride = FakeRide(
        id=uuid4(),
        driver_id=uuid4(),
        available_seats=2,
        total_seats=4,
        price_per_seat=Decimal("10.0"),
        status="completed",
    )
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=2,
        total_price=Decimal("20.0"),
        status="accepted",
        payment_deadline=datetime.now(timezone.utc) - timedelta(seconds=1),
        ride=ride,
    )

    service, _, _, _ = make_service(rides=[ride], bookings=[booking])
    service._lazy_expire_bookings([booking])

    assert booking.status == "expired"
    assert ride.available_seats == 2
