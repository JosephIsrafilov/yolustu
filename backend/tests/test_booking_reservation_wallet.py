from dataclasses import dataclass
from decimal import Decimal
from types import SimpleNamespace
from typing import Any, cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser
from app.domains.payments.models import Payment, WalletTransaction
from app.domains.payments.repositories import PaymentRepository, WalletRepository
from app.domains.payments.reservations import BookingReservationWalletService


@dataclass
class FakeWallet:
    user_id: UUID
    available_balance: Decimal
    pending_balance: Decimal
    currency: str = "AZN"


class FakeWalletRepository:
    def __init__(self) -> None:
        self.wallets: dict[UUID, FakeWallet] = {}
        self.transactions: dict[str, WalletTransaction] = {}

    def get_or_create_for_update(
        self, user_id: UUID, currency: str = "AZN"
    ) -> FakeWallet:
        return self.wallets.setdefault(
            user_id,
            FakeWallet(
                user_id=user_id,
                available_balance=Decimal("0.00"),
                pending_balance=Decimal("0.00"),
                currency=currency,
            ),
        )

    def get_transaction_by_idempotency_key(
        self, idempotency_key: str
    ) -> WalletTransaction | None:
        return self.transactions.get(idempotency_key)

    def add_transaction(self, transaction: WalletTransaction) -> WalletTransaction:
        cast(Any, transaction).id = uuid4()
        self.transactions[cast(str, transaction.idempotency_key)] = transaction
        return transaction


class FakePaymentRepository:
    def __init__(self) -> None:
        self.payments: dict[UUID, Payment] = {}

    def add(self, payment: Payment) -> Payment:
        cast(Any, payment).id = uuid4()
        self.payments[cast(UUID, payment.id)] = payment
        return payment

    def get_succeeded_for_booking(self, booking_id: UUID) -> Payment | None:
        return next(
            (
                payment
                for payment in self.payments.values()
                if payment.booking_id == booking_id and payment.status == "succeeded"
            ),
            None,
        )


def make_current_user(user_id: UUID) -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Test",
        last_name="Passenger",
        role="passenger",
        is_verified=True,
        is_blocked=False,
    )


def make_service():
    service = BookingReservationWalletService(cast(Any, SimpleNamespace()))
    wallets = FakeWalletRepository()
    payments = FakePaymentRepository()
    cast(Any, service).wallets = cast(WalletRepository, wallets)
    cast(Any, service).payments = cast(PaymentRepository, payments)

    passenger_id = uuid4()
    driver_id = uuid4()
    ride = SimpleNamespace(id=uuid4(), driver_id=driver_id)
    booking = SimpleNamespace(
        id=uuid4(),
        passenger_id=passenger_id,
        total_price=Decimal("20.00"),
        status="pending",
        payment_deadline=object(),
    )
    wallets.wallets[passenger_id] = FakeWallet(
        user_id=passenger_id,
        available_balance=Decimal("100.00"),
        pending_balance=Decimal("0.00"),
    )
    return service, wallets, payments, booking, ride


@pytest.fixture(autouse=True)
def configure_payment_settings(monkeypatch):
    monkeypatch.setattr(settings, "PAYMENT_CURRENCY", "AZN")
    monkeypatch.setattr(settings, "PLATFORM_FEE_PERCENT", 10)


def test_booking_reservation_moves_available_balance_to_pending():
    service, wallets, _, booking, ride = make_service()

    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )

    wallet = wallets.wallets[booking.passenger_id]
    hold = wallets.transactions[f"booking:{booking.id}:reservation_hold"]
    assert wallet.available_balance == Decimal("80.00")
    assert wallet.pending_balance == Decimal("20.00")
    assert hold.type == "reservation_hold"
    assert hold.status == "pending"
    assert hold.booking_id == booking.id
    assert hold.ride_id == ride.id
    assert "20.00 AZN reserved" in cast(str, hold.description)


def test_driver_confirmation_captures_hold_and_credits_pending_earning():
    service, wallets, payments, booking, ride = make_service()
    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )

    payment = service.capture_for_booking(booking, ride)

    passenger_wallet = wallets.wallets[booking.passenger_id]
    driver_wallet = wallets.wallets[ride.driver_id]
    hold = wallets.transactions[f"booking:{booking.id}:reservation_hold"]
    assert passenger_wallet.available_balance == Decimal("80.00")
    assert passenger_wallet.pending_balance == Decimal("0.00")
    assert driver_wallet.pending_balance == Decimal("18.00")
    assert payment is payments.get_succeeded_for_booking(booking.id)
    assert payment.amount == Decimal("20.00")
    assert payment.service_fee == Decimal("2.00")
    assert payment.driver_amount == Decimal("18.00")
    assert booking.status == "paid"
    assert booking.payment_deadline is None
    assert hold.status == "captured"
    assert any(
        tx.type == "passenger_payment" and tx.booking_id == booking.id
        for tx in wallets.transactions.values()
    )


def test_release_returns_held_amount_to_available_balance():
    service, wallets, _, booking, ride = make_service()
    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )

    service.release_for_booking(booking, ride)

    wallet = wallets.wallets[booking.passenger_id]
    hold = wallets.transactions[f"booking:{booking.id}:reservation_hold"]
    release = wallets.transactions[f"booking:{booking.id}:reservation_release"]
    assert wallet.available_balance == Decimal("100.00")
    assert wallet.pending_balance == Decimal("0.00")
    assert hold.status == "reversed"
    assert release.type == "reservation_release"
    assert release.status == "posted"


def test_release_uses_ledger_ride_id_when_ride_is_unavailable():
    service, wallets, _, booking, ride = make_service()
    booking.ride_id = ride.id
    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )

    service.release_for_booking(booking)

    release = wallets.transactions[f"booking:{booking.id}:reservation_release"]
    assert release.ride_id == ride.id
    assert wallets.wallets[booking.passenger_id].available_balance == Decimal("100.00")


def test_reservation_rejects_insufficient_wallet_balance():
    service, wallets, _, booking, ride = make_service()
    wallets.wallets[booking.passenger_id].available_balance = Decimal("19.99")

    with pytest.raises(HTTPException) as exc:
        service.reserve_for_booking(
            booking,
            ride,
            make_current_user(booking.passenger_id),
        )

    assert exc.value.status_code == 400
    assert "Insufficient wallet balance" in str(exc.value.detail)
    assert wallets.wallets[booking.passenger_id].available_balance == Decimal("19.99")
    assert wallets.wallets[booking.passenger_id].pending_balance == Decimal("0.00")
    assert wallets.transactions == {}


def test_release_reconciles_historical_pending_balance_mismatch():
    service, wallets, _, booking, ride = make_service()
    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )
    wallets.wallets[booking.passenger_id].pending_balance = Decimal("10.00")

    service.release_for_booking(booking, ride)

    wallet = wallets.wallets[booking.passenger_id]
    hold = wallets.transactions[f"booking:{booking.id}:reservation_hold"]
    assert wallet.available_balance == Decimal("100.00")
    assert wallet.pending_balance == Decimal("0.00")
    assert hold.status == "reversed"
    assert "reconciled" in str(hold.description)


def test_reconciled_release_is_idempotent():
    service, wallets, _, booking, ride = make_service()
    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )
    wallets.wallets[booking.passenger_id].pending_balance = Decimal("10.00")

    first = service.release_for_booking(booking, ride)
    second = service.release_for_booking(booking, ride)

    wallet = wallets.wallets[booking.passenger_id]
    releases = [
        tx for tx in wallets.transactions.values() if tx.type == "reservation_release"
    ]
    assert first is True
    assert second is False
    assert wallet.available_balance == Decimal("100.00")
    assert wallet.pending_balance == Decimal("0.00")
    assert len(releases) == 1


def test_capture_reconciles_historical_pending_balance_mismatch():
    service, wallets, _, booking, ride = make_service()
    service.reserve_for_booking(
        booking,
        ride,
        make_current_user(booking.passenger_id),
    )
    wallets.wallets[booking.passenger_id].pending_balance = Decimal("10.00")

    service.capture_for_booking(booking, ride)

    wallet = wallets.wallets[booking.passenger_id]
    hold = wallets.transactions[f"booking:{booking.id}:reservation_hold"]
    assert wallet.available_balance == Decimal("80.00")
    assert wallet.pending_balance == Decimal("0.00")
    assert hold.status == "captured"
    assert "reconciled" in str(hold.description)
