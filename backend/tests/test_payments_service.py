from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from types import SimpleNamespace
from typing import cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser
from app.domains.payments.models import Payment, WalletTransaction
from app.domains.payments.providers import BasePaymentProvider, PaymentSession
from app.domains.payments.repositories import PaymentRepository, WalletRepository
from app.domains.payments.services import PaymentService, money


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    available_seats: int = 2
    total_seats: int = 3
    departure_time: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=1)
    )
    status: str = "active"


@dataclass
class FakeBooking:
    id: UUID
    ride_id: UUID
    passenger_id: UUID
    seats_booked: int
    total_price: Decimal
    status: str
    payment_deadline: datetime | None = None


class FakePaymentRepository:
    def __init__(self):
        self.payments: dict[UUID, Payment] = {}

    def add(self, payment: Payment) -> Payment:
        payment.id = uuid4()
        self.payments[payment.id] = payment
        return payment

    def get(self, payment_id: UUID) -> Payment | None:
        return self.payments.get(payment_id)

    def get_for_update(self, payment_id: UUID) -> Payment | None:
        return self.get(payment_id)

    def get_by_transaction_id(self, transaction_id: str) -> Payment | None:
        return next(
            (p for p in self.payments.values() if p.transaction_id == transaction_id),
            None,
        )

    def get_active_for_booking(self, booking_id: UUID) -> Payment | None:
        return next(
            (
                p
                for p in self.payments.values()
                if p.booking_id == booking_id and p.status in {"pending", "succeeded"}
            ),
            None,
        )

    def get_succeeded_for_booking(self, booking_id: UUID) -> Payment | None:
        return next(
            (
                p
                for p in self.payments.values()
                if p.booking_id == booking_id and p.status == "succeeded"
            ),
            None,
        )


class FakeWalletRepository:
    def __init__(self):
        self.wallets: dict[UUID, SimpleNamespace] = {}
        self.transactions: dict[str, WalletTransaction] = {}

    def get_or_create(self, user_id: UUID, currency: str = "AZN"):
        if user_id not in self.wallets:
            self.wallets[user_id] = SimpleNamespace(
                user_id=user_id,
                available_balance=Decimal("0.00"),
                pending_balance=Decimal("0.00"),
                currency=currency,
            )
        return self.wallets[user_id]

    def get_transaction_by_idempotency_key(
        self, idempotency_key: str
    ) -> WalletTransaction | None:
        return self.transactions.get(idempotency_key)

    def add_transaction(self, transaction: WalletTransaction) -> WalletTransaction:
        transaction.id = uuid4()
        self.transactions[transaction.idempotency_key] = transaction
        return transaction

    def list_transactions(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[WalletTransaction]:
        return [tx for tx in self.transactions.values() if tx.user_id == user_id][
            skip : skip + limit
        ]

    def sum_by_type(self, user_id: UUID, tx_type: str) -> Decimal:
        return sum(
            (
                tx.amount
                for tx in self.transactions.values()
                if tx.user_id == user_id
                and tx.type == tx_type
                and tx.status == "posted"
            ),
            Decimal("0.00"),
        )


class FakeBookingRepository:
    def __init__(self, booking: FakeBooking):
        self.booking = booking

    def get(self, booking_id: UUID) -> FakeBooking | None:
        return self.booking if self.booking.id == booking_id else None

    def get_for_update(self, booking_id: UUID) -> FakeBooking | None:
        return self.get(booking_id)

    def list_requests_for_driver(self, driver_id: UUID):
        return [self.booking]


class FakeRideLookup:
    def __init__(self, ride: FakeRide):
        self.ride = ride

    def get_ride_for_update(self, ride_id: UUID) -> FakeRide | None:
        return self.ride if self.ride.id == ride_id else None

    def get_ride(self, ride_id: UUID) -> FakeRide | None:
        return self.get_ride_for_update(ride_id)


class FakeProvider:
    provider_name = "mock"

    def create_payment_session(
        self, payment: Payment, return_url: str, cancel_url: str
    ) -> PaymentSession:
        return PaymentSession(
            transaction_id="tx-123",
            checkout_url="http://localhost/mock",
            provider_payment_id="tx-123",
        )

    def verify_webhook_signature(self, headers, body) -> bool:
        return True

    def parse_webhook_event(self, headers, body):
        raise NotImplementedError

    def refund(self, payment: Payment, amount: Decimal):
        return {"refund_id": "refund-1", "amount": str(amount)}


class FakeNotificationService:
    def send_push_notification(self, **kwargs) -> None:
        return None


def make_current_user(user_id: UUID, role: str = "passenger") -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Test",
        last_name="User",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


def make_service(booking_status: str = "accepted"):
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id)
    booking = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=passenger_id,
        seats_booked=1,
        total_price=Decimal("25.00"),
        status=booking_status,
    )
    service = PaymentService(
        db=cast(Session, SimpleNamespace(commit=lambda: None, refresh=lambda x: x))
    )
    payment_repo = FakePaymentRepository()
    wallet_repo = FakeWalletRepository()
    service.payments = cast(PaymentRepository, payment_repo)
    service.wallets = cast(WalletRepository, wallet_repo)
    service.bookings = cast(object, FakeBookingRepository(booking))
    service.rides = cast(object, FakeRideLookup(ride))
    service.provider = cast(BasePaymentProvider, FakeProvider())
    service.notifications = cast(object, FakeNotificationService())
    return service, booking, ride, payment_repo, wallet_repo


@pytest.fixture(autouse=True)
def configure_payment_settings(monkeypatch):
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "mock")
    monkeypatch.setattr(settings, "PAYMENT_CURRENCY", "AZN")
    monkeypatch.setattr(settings, "PLATFORM_FEE_PERCENT", 10)


def test_create_payment_for_confirmed_booking():
    service, booking, _, payment_repo, _ = make_service("accepted")
    response = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )

    payment = next(iter(payment_repo.payments.values()))
    assert response["payment_id"] == payment.id
    assert response["amount"] == Decimal("25.00")
    assert response["service_fee"] == Decimal("2.50")
    assert response["driver_amount"] == Decimal("22.50")
    assert payment.status == "pending"


def test_cannot_pay_someone_else_booking():
    service, booking, _, _, _ = make_service("accepted")
    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(booking.id, make_current_user(uuid4()))
    assert exc.value.status_code == 403


def test_cannot_pay_own_ride():
    service, booking, ride, _, _ = make_service("accepted")
    booking.passenger_id = ride.driver_id
    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(booking.id, make_current_user(ride.driver_id))
    assert exc.value.status_code == 403


@pytest.mark.parametrize("status", ["pending", "rejected", "cancelled"])
def test_cannot_pay_rejected_cancelled_or_unaccepted_booking(status: str):
    service, booking, _, _, _ = make_service(status)
    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(
            booking.id, make_current_user(booking.passenger_id)
        )
    assert exc.value.status_code == 400


def test_cannot_double_pay_same_booking():
    service, booking, _, _, _ = make_service("accepted")
    passenger = make_current_user(booking.passenger_id)

    first = service.create_payment_session(booking.id, passenger)
    second = service.create_payment_session(booking.id, passenger)

    assert second["payment_id"] == first["payment_id"]


def test_mock_success_updates_payment_booking_ledger_and_driver_pending_balance():
    service, booking, ride, payment_repo, wallet_repo = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]

    response = service.mark_payment_succeeded(payment_id)
    payment = payment_repo.get(payment_id)

    assert response["detail"] == "Payment succeeded"
    assert payment is not None
    assert payment.status == "succeeded"
    assert booking.status == "paid"
    assert len(wallet_repo.transactions) == 3
    assert wallet_repo.wallets[ride.driver_id].pending_balance == Decimal("22.50")
    assert any(tx.type == "platform_fee" for tx in wallet_repo.transactions.values())


def test_repeated_mock_success_is_idempotent():
    service, booking, _, _, wallet_repo = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]

    service.mark_payment_succeeded(payment_id)
    service.mark_payment_succeeded(payment_id)

    assert len(wallet_repo.transactions) == 3


def test_refund_reverses_ledger_correctly():
    service, booking, ride, _, wallet_repo = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]
    service.mark_payment_succeeded(payment_id)

    response = service.refund_payment(
        payment_id, make_current_user(uuid4(), role="admin")
    )

    assert response["detail"] == "Payment refunded"
    assert booking.status == "cancelled"
    assert wallet_repo.wallets[ride.driver_id].pending_balance == Decimal("0.00")
    assert any(tx.type == "refund" for tx in wallet_repo.transactions.values())


def test_wallet_me_returns_correct_balances():
    service, booking, ride, _, _ = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]
    service.mark_payment_succeeded(payment_id)

    wallet = service.wallet_for_user(make_current_user(ride.driver_id, role="driver"))

    assert wallet["pending_balance"] == Decimal("22.50")
    assert wallet["available_balance"] == Decimal("0.00")


def test_decimal_precision_rounds_money_values():
    assert money(Decimal("10.005")) == Decimal("10.01")
    assert money("10.004") == Decimal("10.00")
