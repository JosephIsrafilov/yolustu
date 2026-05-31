import json
from dataclasses import dataclass
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.notifications import NotificationService
from app.domains.bookings.repositories import BookingRepository
from app.domains.identity.dependencies import CurrentUser
from app.domains.payments.providers import BasePaymentProvider
from app.domains.payments.repositories import PaymentRepository
from app.domains.payments.services import PaymentService
from app.domains.trips.ports import RideLookupPort


@pytest.fixture(autouse=True)
def use_mock_webhook_payloads(monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "")


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    available_seats: int


@dataclass
class FakeBooking:
    id: UUID
    ride_id: UUID
    passenger_id: UUID
    seats_booked: int
    total_price: float
    status: str


@dataclass
class FakePayment:
    booking_id: UUID
    amount: float
    transaction_id: str
    status: str = "pending"


class FakeBookingRepository:
    def __init__(self, booking: FakeBooking):
        self.booking = booking

    def get(self, booking_id: UUID) -> FakeBooking | None:
        return self.booking if self.booking.id == booking_id else None

    def save(self, booking: FakeBooking) -> FakeBooking:
        self.booking = booking
        return booking


class FakePaymentRepository:
    def __init__(self):
        self.by_transaction: dict[str, FakePayment] = {}

    def create(
        self, booking_id: UUID, amount: float, transaction_id: str
    ) -> FakePayment:
        payment = FakePayment(
            booking_id=booking_id,
            amount=amount,
            transaction_id=transaction_id,
        )
        self.by_transaction[transaction_id] = payment
        return payment

    def get_by_transaction_id(self, transaction_id: str) -> FakePayment | None:
        return self.by_transaction.get(transaction_id)

    def update_status(self, payment: FakePayment, status: str) -> FakePayment:
        payment.status = status
        return payment


class FakeRideLookup:
    def __init__(self, ride: FakeRide):
        self.ride = ride

    def get_ride(self, ride_id: UUID) -> FakeRide | None:
        return self.ride if self.ride.id == ride_id else None


class FakeProvider:
    def __init__(self, transaction_id: str):
        self.transaction_id = transaction_id

    def create_payment_session(self, amount: float, booking_id: UUID) -> dict[str, str]:
        return {
            "transaction_id": self.transaction_id,
            "checkout_url": f"http://localhost/mock?booking={booking_id}&amount={amount}",
        }


class FakeNotificationService:
    def __init__(self):
        self.sent: list[dict[str, object]] = []

    def send_push_notification(self, **kwargs: object) -> None:
        self.sent.append(kwargs)


def make_current_user(user_id: UUID) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Test",
        last_name="User",
        role="passenger",
        is_verified=True,
        is_blocked=False,
    )


def make_service(
    booking_status: str = "accepted",
) -> tuple[
    PaymentService,
    FakeBooking,
    FakeRide,
    FakePaymentRepository,
    FakeNotificationService,
]:
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, available_seats=2)
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=1,
        total_price=25.0,
        status=booking_status,
    )

    payment_repo = FakePaymentRepository()
    notifications = FakeNotificationService()
    service = PaymentService(db=cast(Session, None))
    service.bookings = cast(BookingRepository, FakeBookingRepository(booking))
    service.payments = cast(PaymentRepository, payment_repo)
    service.rides = cast(RideLookupPort, FakeRideLookup(ride))
    service.provider = cast(BasePaymentProvider, FakeProvider(transaction_id="tx-123"))
    service.notifications = cast(NotificationService, notifications)
    return service, booking, ride, payment_repo, notifications


def test_create_payment_session_allowed_for_accepted_booking_owner():
    service, booking, ride, payment_repo, _ = make_service(booking_status="accepted")
    passenger = make_current_user(booking.passenger_id)

    session = service.create_payment_session(booking.id, passenger)

    created = payment_repo.get_by_transaction_id("tx-123")
    assert session["transaction_id"] == "tx-123"
    assert created is not None
    assert created.status == "pending"
    assert created.booking_id == booking.id
    assert booking.status == "accepted"
    assert ride.available_seats == 2


@pytest.mark.parametrize("status", ["pending", "rejected", "cancelled"])
def test_create_payment_session_forbidden_for_non_accepted_status(status: str):
    service, booking, _, _, _ = make_service(booking_status=status)
    passenger = make_current_user(booking.passenger_id)

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(booking.id, passenger)

    assert exc.value.status_code == 400
    assert "accepted" in str(exc.value.detail)


def test_create_payment_session_forbidden_for_other_user():
    service, booking, _, _, _ = make_service(booking_status="accepted")
    other_user = make_current_user(uuid4())

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(booking.id, other_user)

    assert exc.value.status_code == 403
    assert "own bookings" in str(exc.value.detail)


def test_success_webhook_marks_booking_paid_and_keeps_seats():
    service, booking, ride, payment_repo, notifications = make_service(
        booking_status="accepted"
    )
    passenger = make_current_user(booking.passenger_id)
    service.create_payment_session(booking.id, passenger)

    response = service.handle_webhook(
        payload=json.dumps({"transaction_id": "tx-123", "status": "success"}).encode(),
        stripe_signature="",
    )

    payment = payment_repo.get_by_transaction_id("tx-123")
    assert response["detail"] == "Webhook processed"
    assert payment is not None
    assert payment.status == "completed"
    assert booking.status == "paid"
    assert ride.available_seats == 2
    assert len(notifications.sent) == 1


def test_repeated_success_webhook_keeps_state_consistent():
    service, booking, ride, payment_repo, _ = make_service(booking_status="accepted")
    passenger = make_current_user(booking.passenger_id)
    service.create_payment_session(booking.id, passenger)
    payload = json.dumps({"transaction_id": "tx-123", "status": "success"}).encode()

    service.handle_webhook(payload=payload, stripe_signature="")
    service.handle_webhook(payload=payload, stripe_signature="")

    payment = payment_repo.get_by_transaction_id("tx-123")
    assert payment is not None
    assert payment.status == "completed"
    assert booking.status == "paid"
    assert ride.available_seats == 2


def test_unsigned_webhook_is_rejected_outside_development(monkeypatch):
    service, _, _, _, _ = make_service(booking_status="accepted")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    with pytest.raises(HTTPException) as exc:
        service.handle_webhook(
            payload=json.dumps(
                {"transaction_id": "tx-123", "status": "success"}
            ).encode(),
            stripe_signature="",
        )

    assert exc.value.status_code == 503
    assert "not configured" in str(exc.value.detail)
