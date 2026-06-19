"""Phase 4 — wallet/payment hardening tests.

Covers: webhook idempotency (provider_events), the split refund paths
(webhook must NOT re-call the provider), wallet refunds crediting the wallet,
and the ride-cancellation cascade. Uses the in-memory fakes from
``test_payments_service`` plus a few cascade-specific fakes.
"""

import json
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from typing import Any, cast
from uuid import UUID, uuid4

import pytest
from sqlalchemy.orm import Session

from app.domains.payments import providers as providers_module
from app.domains.payments.services import PaymentService

from tests.test_payments_service import (
    FakeBooking,
    FakeNotificationService,
    FakePayment,
    FakePaymentRepository,
    FakeRide,
    FakeWalletRepository,
    make_current_user,
    make_service,
)


def _stub_provider_events(service: PaymentService) -> set:
    """Replace DB-backed event recording with an in-memory dedupe set."""
    seen: set = set()

    def fake_record(provider_name: str, event, payment) -> bool:
        if event.event_key in seen:
            return False
        seen.add(event.event_key)
        return True

    cast(Any, service)._record_provider_event = fake_record
    return seen


# PLACEHOLDER_CASCADE_FAKES


class MultiBookingRepository:
    """Booking repo fake that holds several bookings for one ride."""

    def __init__(self, bookings: list[FakeBooking]):
        self.bookings = {b.id: b for b in bookings}

    def get(self, booking_id: UUID) -> FakeBooking | None:
        return self.bookings.get(booking_id)

    def get_for_update(self, booking_id: UUID) -> FakeBooking | None:
        return self.get(booking_id)

    def list_active_for_ride(self, ride_id: UUID) -> list[FakeBooking]:
        terminal = {"cancelled", "rejected", "expired", "no_show"}
        return [
            b
            for b in self.bookings.values()
            if b.ride_id == ride_id and b.status not in terminal
        ]


class MultiSeatRepository:
    """Seat repo fake that tracks released seats across many bookings."""

    def __init__(self, ride: FakeRide, bookings: list[FakeBooking]):
        self.ride = ride
        self._base_available = ride.available_seats
        self.bookings = {b.id: b for b in bookings}
        self.released: set[UUID] = set()

    def release(self, booking_id: UUID, released_at: datetime) -> int:
        if booking_id in self.released:
            return 0
        self.released.add(booking_id)
        booking = self.bookings.get(booking_id)
        return booking.seats_booked if booking else 0

    def available_spots(self, ride_id: UUID) -> list[str]:
        count = self._base_available + sum(
            self.bookings[b].seats_booked for b in self.released
        )
        return ["front_right", "back_left", "back_middle", "back_right"][:count]


class MultiPaymentRepository(FakePaymentRepository):
    """Adds explicit payment seeding for cascade scenarios."""

    def seed(self, payment: FakePayment) -> FakePayment:
        self.payments[payment.id] = payment
        return payment


class MultiRideLookup:
    def __init__(self, ride: FakeRide):
        self.ride = ride

    def get_ride_for_update(self, ride_id: UUID) -> FakeRide | None:
        return self.ride if self.ride.id == ride_id else None

    def get_ride(self, ride_id: UUID) -> FakeRide | None:
        return self.get_ride_for_update(ride_id)


def make_cascade_service(ride: FakeRide, bookings: list[FakeBooking]) -> PaymentService:
    service = PaymentService(
        db=cast(
            Session,
            SimpleNamespace(
                commit=lambda: None,
                refresh=lambda x: x,
                flush=lambda: None,
            ),
        )
    )
    s = cast(Any, service)
    s.payments = MultiPaymentRepository()
    s.wallets = FakeWalletRepository()
    s.bookings = MultiBookingRepository(bookings)
    s.seats = MultiSeatRepository(ride, bookings)
    s.rides = MultiRideLookup(ride)
    s.notifications = FakeNotificationService()
    return service


# --- Webhook idempotency + split refund paths ---


def _succeed_via_session(service, booking):
    """Create a pending payment session and return its transaction_id."""
    session = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    return session["transaction_id"], session["payment_id"]


def test_webhook_refund_does_not_recall_provider(monkeypatch):
    service, booking, ride, payment_repo, wallet_repo = make_service("accepted")
    _stub_provider_events(service)
    tx_id, payment_id = _succeed_via_session(service, booking)
    service.mark_payment_succeeded(payment_id)

    # Spy: provider.refund must NEVER be called on the webhook path.
    called = {"refund": False}
    real_get = providers_module.get_payment_provider

    def spy_get(name=None):
        provider = real_get(name)
        original = provider.refund

        def wrapped(*a, **k):
            called["refund"] = True
            return original(*a, **k)

        provider.refund = wrapped  # type: ignore[method-assign]
        return provider

    monkeypatch.setattr("app.domains.payments.services.get_payment_provider", spy_get)

    body = json.dumps({"transaction_id": tx_id, "status": "refunded"}).encode()
    result = service.handle_webhook("mock", {}, body)

    assert result["detail"] == "Payment refunded"
    assert called["refund"] is False, "webhook refund must not re-call provider"
    assert payment_repo.get(payment_id).status == "refunded"
    assert booking.status == "cancelled"
    # Driver pending earning reversed.
    assert wallet_repo.wallets[ride.driver_id].pending_balance == Decimal("0.00")


def test_duplicate_webhook_is_noop(monkeypatch):
    service, booking, ride, payment_repo, _ = make_service("accepted")
    _stub_provider_events(service)
    tx_id, payment_id = _succeed_via_session(service, booking)

    body = json.dumps({"transaction_id": tx_id, "status": "succeeded"}).encode()
    first = service.handle_webhook("mock", {}, body)
    second = service.handle_webhook("mock", {}, body)

    assert first["detail"] == "Payment succeeded"
    assert second["detail"] == "Webhook already processed"
    assert payment_repo.get(payment_id).status == "succeeded"


def test_reordered_refund_then_duplicate_succeed(monkeypatch):
    """A late duplicate 'succeeded' after a refund must not revive the payment."""
    service, booking, _, payment_repo, _ = make_service("accepted")
    _stub_provider_events(service)
    tx_id, payment_id = _succeed_via_session(service, booking)
    service.mark_payment_succeeded(payment_id)

    refund_body = json.dumps({"transaction_id": tx_id, "status": "refunded"}).encode()
    service.handle_webhook("mock", {}, refund_body)
    assert payment_repo.get(payment_id).status == "refunded"

    # Duplicate succeed event (distinct event_key, so it is processed) must be
    # rejected by the payment status guard, not resurrect the payment.
    succeed_body = json.dumps({"transaction_id": tx_id, "status": "succeeded"}).encode()

    with pytest.raises(Exception):
        service.handle_webhook("mock", {}, succeed_body)
    assert payment_repo.get(payment_id).status == "refunded"


# --- Wallet refund credits the wallet (no external provider) ---


def test_wallet_payment_refund_credits_wallet():
    service, booking, ride, payment_repo, wallet_repo = make_service("accepted")
    passenger_id = booking.passenger_id
    # Fund and pay from wallet so the payment provider is "wallet".
    wallet_repo.get_or_create(passenger_id).available_balance = Decimal("100.00")
    service.pay_booking_from_wallet(booking.id, make_current_user(passenger_id))
    assert wallet_repo.wallets[passenger_id].available_balance == Decimal("75.00")

    payment = next(iter(payment_repo.payments.values()))
    # Admin refund: must NOT hit get_payment_provider("wallet") (would 400).
    service.refund_payment(payment.id, make_current_user(uuid4(), role="admin"))

    assert payment.status == "refunded"
    assert booking.status == "cancelled"
    # Passenger's wallet credited back to full.
    assert wallet_repo.wallets[passenger_id].available_balance == Decimal("100.00")
    # Driver pending earning reversed.
    assert wallet_repo.wallets[ride.driver_id].pending_balance == Decimal("0.00")


# --- Ride cancellation cascade ---


def _seed_paid_booking(service, ride, booking, *, provider="mock") -> FakePayment:
    payment = FakePayment(
        id=uuid4(),
        booking_id=booking.id,
        passenger_id=booking.passenger_id,
        driver_id=ride.driver_id,
        amount=Decimal("25.00"),
        service_fee=Decimal("2.50"),
        driver_amount=Decimal("22.50"),
        currency="AZN",
        provider=provider,
        status="succeeded",
    )
    cast(Any, service).payments.seed(payment)
    # Mirror the pending earning that mark_payment_succeeded would have created.
    cast(Any, service).wallets.get_or_create(ride.driver_id).pending_balance = Decimal(
        "22.50"
    )
    return payment


def test_cancel_cascade_refunds_paid_and_releases_pending():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, available_seats=0, total_seats=4)
    paid = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=uuid4(),
        seats_booked=1,
        total_price=Decimal("25.00"),
        status="paid",
    )
    pending = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=uuid4(),
        seats_booked=1,
        total_price=Decimal("25.00"),
        status="accepted",
    )
    service = make_cascade_service(ride, [paid, pending])
    payment = _seed_paid_booking(service, ride, paid)
    wallet_repo = cast(Any, service).wallets

    affected = service.cancel_ride_bookings(ride)

    assert affected == 2
    assert paid.status == "cancelled"
    assert pending.status == "cancelled"
    assert payment.status == "refunded"
    # Two seats freed back.
    assert ride.available_seats == 2
    # Driver pending earning reversed to zero.
    assert wallet_repo.wallets[driver_id].pending_balance == Decimal("0.00")
    # Refund recorded for the passenger.
    assert any(tx.type == "refund" for tx in wallet_repo.transactions.values())


def test_cancel_cascade_skips_terminal_bookings():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, available_seats=2, total_seats=4)
    already_cancelled = FakeBooking(
        id=uuid4(),
        ride_id=ride.id,
        passenger_id=uuid4(),
        seats_booked=1,
        total_price=Decimal("25.00"),
        status="cancelled",
    )
    service = make_cascade_service(ride, [already_cancelled])

    affected = service.cancel_ride_bookings(ride)

    assert affected == 0
    assert already_cancelled.status == "cancelled"


# --- Scheduler distributed lock ---


def test_expiry_lock_only_one_winner(monkeypatch):
    from app.core.redis import InMemoryRedis
    import app.core.scheduler as scheduler

    shared = InMemoryRedis()
    monkeypatch.setattr(scheduler, "get_redis", lambda: shared)

    first = scheduler._acquire_expiry_lock()
    second = scheduler._acquire_expiry_lock()

    assert first is True
    assert second is False


def test_expiry_lock_fails_open_when_redis_down(monkeypatch):
    import app.core.scheduler as scheduler

    def boom():
        raise RuntimeError("redis down")

    monkeypatch.setattr(scheduler, "get_redis", boom)
    assert scheduler._acquire_expiry_lock() is True
