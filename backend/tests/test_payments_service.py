from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from types import SimpleNamespace
from typing import Any, cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser
from app.domains.payments.models import Payment, PayoutRequest, WalletTransaction
from app.domains.payments.repositories import (
    PaymentRepository,
    PayoutRepository,
    WalletRepository,
)
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


@dataclass
class FakePayment:
    id: UUID
    booking_id: UUID
    passenger_id: UUID | None
    driver_id: UUID | None
    amount: Decimal
    service_fee: Decimal
    driver_amount: Decimal
    currency: str
    provider: str
    status: str
    transaction_id: str | None = None
    provider_payment_id: str | None = None
    provider_checkout_url: str | None = None
    paid_at: datetime | None = None
    payment_metadata: dict[str, Any] | None = None
    refunded_at: datetime | None = None


@dataclass
class FakeWallet:
    user_id: UUID
    available_balance: Decimal
    pending_balance: Decimal
    currency: str


@dataclass
class FakeWalletTransaction:
    id: UUID
    user_id: UUID
    payment_id: UUID | None
    booking_id: UUID | None
    ride_id: UUID | None
    transaction_type: str
    direction: str
    amount: Decimal
    currency: str
    status: str
    description: str | None
    idempotency_key: str

    @property
    def type(self) -> str:
        return self.transaction_type


class FakePaymentRepository:
    def __init__(self) -> None:
        self.payments: dict[UUID, FakePayment] = {}

    def add(self, payment: Payment) -> Payment:
        cast(Any, payment).id = uuid4()
        self.payments[cast(Any, payment).id] = cast(Any, payment)
        return payment

    def get(self, payment_id: UUID) -> FakePayment | None:
        return self.payments.get(payment_id)

    def get_for_update(self, payment_id: UUID) -> FakePayment | None:
        return self.get(payment_id)

    def get_by_transaction_id(self, transaction_id: str) -> FakePayment | None:
        return next(
            (p for p in self.payments.values() if p.transaction_id == transaction_id),
            None,
        )

    def get_active_for_booking(self, booking_id: UUID) -> FakePayment | None:
        return next(
            (
                p
                for p in self.payments.values()
                if p.booking_id == booking_id and p.status in {"pending", "succeeded"}
            ),
            None,
        )

    def get_succeeded_for_booking(self, booking_id: UUID) -> FakePayment | None:
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
        self.wallets: dict[UUID, FakeWallet] = {}
        self.transactions: dict[str, FakeWalletTransaction] = {}

    def get_or_create(self, user_id: UUID, currency: str = "AZN") -> FakeWallet:
        if user_id not in self.wallets:
            self.wallets[user_id] = FakeWallet(
                user_id=user_id,
                available_balance=Decimal("0.00"),
                pending_balance=Decimal("0.00"),
                currency=currency,
            )
        return self.wallets[user_id]

    def get_or_create_for_update(
        self, user_id: UUID, currency: str = "AZN"
    ) -> FakeWallet:
        # In memory fake doesn't need to lock
        return self.get_or_create(user_id, currency)

    def get_transaction_by_idempotency_key(
        self, idempotency_key: str
    ) -> FakeWalletTransaction | None:
        return self.transactions.get(idempotency_key)

    def add_transaction(self, transaction: WalletTransaction) -> FakeWalletTransaction:
        stored = FakeWalletTransaction(
            id=uuid4(),
            user_id=cast(UUID, transaction.user_id),
            payment_id=cast(UUID | None, transaction.payment_id),
            booking_id=cast(UUID | None, transaction.booking_id),
            ride_id=cast(UUID | None, transaction.ride_id),
            transaction_type=cast(str, transaction.type),
            direction=cast(str, transaction.direction),
            amount=Decimal(str(transaction.amount)),
            currency=cast(str, transaction.currency),
            status=cast(str, transaction.status),
            description=cast(str | None, transaction.description),
            idempotency_key=cast(str, transaction.idempotency_key),
        )
        self.transactions[stored.idempotency_key] = stored
        return stored

    def _filtered(
        self, user_id: UUID, filter: str = "all"
    ) -> list[FakeWalletTransaction]:
        txs = [tx for tx in self.transactions.values() if tx.user_id == user_id]
        if filter == "refunds":
            return [tx for tx in txs if tx.type == "refund"]
        if filter == "income":
            return [
                tx for tx in txs if tx.direction == "credit" and tx.type != "refund"
            ]
        if filter == "payments":
            return [tx for tx in txs if tx.direction == "debit" and tx.type != "refund"]
        if filter == "topups":
            return [tx for tx in txs if tx.type == "adjustment"]
        return txs

    def list_transactions(
        self, user_id: UUID, skip: int = 0, limit: int = 50, filter: str = "all"
    ) -> list[FakeWalletTransaction]:
        return self._filtered(user_id, filter)[skip : skip + limit]

    def count_transactions(self, user_id: UUID, filter: str = "all") -> int:
        return len(self._filtered(user_id, filter))

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


class FakePayoutRepository:
    def __init__(self) -> None:
        self.payouts: dict[UUID, PayoutRequest] = {}

    def add(self, payout: PayoutRequest) -> PayoutRequest:
        cast(Any, payout).id = uuid4()
        self.payouts[cast(Any, payout).id] = payout
        return payout

    def get_for_update(self, payout_id: UUID) -> PayoutRequest | None:
        return self.payouts.get(payout_id)

    def get_by_idempotency_key(self, idempotency_key: str) -> PayoutRequest | None:
        return next(
            (
                p
                for p in self.payouts.values()
                if (cast(Any, p).payout_metadata or {}).get("idempotency_key")
                == idempotency_key
            ),
            None,
        )

    def _for_user(self, user_id: UUID) -> list[PayoutRequest]:
        return [p for p in self.payouts.values() if cast(Any, p).user_id == user_id]

    def list_for_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[PayoutRequest]:
        return self._for_user(user_id)[skip : skip + limit]

    def count_for_user(self, user_id: UUID) -> int:
        return len(self._for_user(user_id))

    def _by_status(self, status: str) -> list[PayoutRequest]:
        return [p for p in self.payouts.values() if cast(Any, p).status == status]

    def list_by_status(
        self, status: str, skip: int = 0, limit: int = 50
    ) -> list[PayoutRequest]:
        return self._by_status(status)[skip : skip + limit]

    def count_by_status(self, status: str) -> int:
        return len(self._by_status(status))


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


class FakeNotificationService:
    def send_push_notification(self, **kwargs) -> None:
        return None


class FakeSeatReservationRepository:
    def __init__(self, ride: FakeRide, booking: FakeBooking):
        self.ride = ride
        self.booking = booking
        self.released = False

    def release(self, booking_id: UUID, released_at: datetime) -> int:
        if booking_id != self.booking.id or self.released:
            return 0
        self.released = True
        return self.booking.seats_booked

    def available_spots(self, ride_id: UUID) -> list[str]:
        count = self.ride.available_seats
        if self.released:
            count += self.booking.seats_booked
        return ["front_right", "back_left", "back_middle", "back_right"][:count]


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


def make_service(
    booking_status: str = "accepted",
) -> tuple[
    PaymentService,
    FakeBooking,
    FakeRide,
    FakePaymentRepository,
    FakeWalletRepository,
]:
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
        db=cast(
            Session,
            SimpleNamespace(
                commit=lambda: None,
                refresh=lambda x: x,
                flush=lambda: None,
            ),
        )
    )
    payment_repo = FakePaymentRepository()
    wallet_repo = FakeWalletRepository()
    payout_repo = FakePayoutRepository()
    service_any = cast(Any, service)
    service_any.payments = cast(PaymentRepository, payment_repo)
    service_any.wallets = cast(WalletRepository, wallet_repo)
    service_any.payouts = cast(PayoutRepository, payout_repo)
    service_any.bookings = FakeBookingRepository(booking)
    service_any.seats = FakeSeatReservationRepository(ride, booking)
    service_any.rides = FakeRideLookup(ride)
    service_any.notifications = FakeNotificationService()
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


@pytest.mark.parametrize("inactive_status", ["cancelled", "rejected", "expired"])
def test_late_payment_cannot_revive_inactive_booking(inactive_status):
    service, booking, _, payment_repo, _ = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]
    booking.status = inactive_status

    with pytest.raises(HTTPException) as exc:
        service.mark_payment_succeeded(payment_id)

    assert exc.value.status_code == 409
    assert booking.status == inactive_status
    assert payment_repo.get(payment_id).status == "cancelled"


def test_late_payment_expires_booking_and_releases_exact_seat():
    service, booking, ride, payment_repo, _ = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]
    booking.payment_deadline = datetime.now(timezone.utc) - timedelta(seconds=1)

    with pytest.raises(HTTPException) as exc:
        service.mark_payment_succeeded(payment_id)

    assert exc.value.status_code == 409
    assert booking.status == "expired"
    assert payment_repo.get(payment_id).status == "cancelled"
    assert ride.available_seats == 3


def test_late_wallet_payment_expires_booking_before_debit():
    service, booking, ride, _, wallet_repo = make_service("accepted")
    wallet = wallet_repo.get_or_create(booking.passenger_id)
    wallet.available_balance = Decimal("100.00")
    booking.payment_deadline = datetime.now(timezone.utc) - timedelta(seconds=1)

    with pytest.raises(HTTPException) as exc:
        service.pay_booking_from_wallet(
            booking.id, make_current_user(booking.passenger_id)
        )

    assert exc.value.status_code == 409
    assert booking.status == "expired"
    assert wallet.available_balance == Decimal("100.00")
    assert ride.available_seats == 3


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


@pytest.mark.parametrize("booking_status", ["paid", "boarded"])
def test_completed_ride_releases_earning_and_completes_paid_booking(booking_status):
    service, booking, ride, _, wallet_repo = make_service("accepted")
    payment_id = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )["payment_id"]
    service.mark_payment_succeeded(payment_id)
    booking.status = booking_status

    service.release_driver_earnings_for_ride(ride.id)

    driver_wallet = wallet_repo.wallets[ride.driver_id]
    assert booking.status == "completed"
    assert driver_wallet.pending_balance == Decimal("0.00")
    assert driver_wallet.available_balance == Decimal("22.50")
    assert any(
        tx.type == "driver_available_earning"
        for tx in wallet_repo.transactions.values()
    )


def test_decimal_precision_rounds_money_values():
    assert money(Decimal("10.005")) == Decimal("10.01")
    assert money("10.004") == Decimal("10.00")


def test_topup_is_idempotent_with_same_key():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4())

    first = service.topup_wallet(user, Decimal("25.00"), idempotency_key="abc-123")
    second = service.topup_wallet(user, Decimal("25.00"), idempotency_key="abc-123")

    assert first["new_balance"] == Decimal("25.00")
    assert second["new_balance"] == Decimal("25.00")
    assert wallet_repo.wallets[user.id].available_balance == Decimal("25.00")
    user_txs = [tx for tx in wallet_repo.transactions.values() if tx.user_id == user.id]
    assert len(user_txs) == 1


def test_topup_distinct_keys_credit_separately():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4())

    service.topup_wallet(user, Decimal("25.00"), idempotency_key="key-1")
    service.topup_wallet(user, Decimal("25.00"), idempotency_key="key-2")

    assert wallet_repo.wallets[user.id].available_balance == Decimal("50.00")


def test_topup_writes_adjustment_type():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4())

    service.topup_wallet(user, Decimal("10.00"), idempotency_key="k")

    tx = next(iter(wallet_repo.transactions.values()))
    assert tx.type == "adjustment"
    assert tx.direction == "credit"


def _seed_filter_transactions(wallet_repo, user_id: UUID) -> None:
    rows = [
        ("passenger_payment", "debit"),
        ("platform_fee", "debit"),
        ("driver_pending_earning", "credit"),
        ("driver_available_earning", "credit"),
        ("refund", "credit"),
        ("adjustment", "credit"),
    ]
    for tx_type, direction in rows:
        wallet_repo.add_transaction(
            WalletTransaction(
                user_id=user_id,
                type=tx_type,
                direction=direction,
                amount=Decimal("5.00"),
                currency="AZN",
                status="posted",
                description=tx_type,
                idempotency_key=f"seed:{user_id}:{tx_type}",
            )
        )


@pytest.mark.parametrize(
    "filter_value,expected_types",
    [
        (
            "all",
            {
                "passenger_payment",
                "platform_fee",
                "driver_pending_earning",
                "driver_available_earning",
                "refund",
                "adjustment",
            },
        ),
        ("refunds", {"refund"}),
        (
            "income",
            {"driver_pending_earning", "driver_available_earning", "adjustment"},
        ),
        ("payments", {"passenger_payment", "platform_fee"}),
        ("topups", {"adjustment"}),
    ],
)
def test_wallet_transactions_filter_returns_right_rows(filter_value, expected_types):
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4())
    _seed_filter_transactions(wallet_repo, user.id)

    result = service.wallet_transactions(user, page=1, limit=50, filter=filter_value)

    returned_types = {tx.type for tx in result.items}
    assert returned_types == expected_types
    assert result.total == len(expected_types)


def test_request_payout_debits_balance_and_creates_pending_records():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")

    payout = service.request_payout(user, Decimal("40.00"), idempotency_key="p-1")

    assert payout.status == "pending"
    assert payout.amount == Decimal("40.00")
    assert wallet_repo.wallets[user.id].available_balance == Decimal("60.00")
    txs = [tx for tx in wallet_repo.transactions.values() if tx.user_id == user.id]
    assert len(txs) == 1
    assert txs[0].type == "payout"
    assert txs[0].direction == "debit"
    assert txs[0].status == "pending"


def test_request_payout_rejects_amount_above_balance():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("10.00")

    with pytest.raises(HTTPException) as exc:
        service.request_payout(user, Decimal("25.00"), idempotency_key="p-2")

    assert exc.value.status_code == 400
    assert wallet_repo.wallets[user.id].available_balance == Decimal("10.00")
    assert len(wallet_repo.transactions) == 0


def test_request_payout_rejects_non_positive_amount():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("10.00")

    with pytest.raises(HTTPException) as exc:
        service.request_payout(user, Decimal("0.00"), idempotency_key="p-3")

    assert exc.value.status_code == 400


def test_request_payout_is_idempotent_with_same_key():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")

    first = service.request_payout(user, Decimal("40.00"), idempotency_key="dup")
    second = service.request_payout(user, Decimal("40.00"), idempotency_key="dup")

    assert first.id == second.id
    assert wallet_repo.wallets[user.id].available_balance == Decimal("60.00")
    txs = [tx for tx in wallet_repo.transactions.values() if tx.user_id == user.id]
    assert len(txs) == 1


def test_admin_list_pending_payouts_requires_admin():
    service, _, _, _, _ = make_service("accepted")
    with pytest.raises(HTTPException) as exc:
        service.list_admin_payouts(make_current_user(uuid4(), role="driver"))
    assert exc.value.status_code == 403


def test_admin_list_pending_payouts_returns_only_pending():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")
    service.request_payout(user, Decimal("10.00"), idempotency_key="a")
    service.request_payout(user, Decimal("20.00"), idempotency_key="b")

    result = service.list_admin_payouts(make_current_user(uuid4(), role="admin"))

    assert result.total == 2
    assert all(item.status == "pending" for item in result.items)


def test_admin_approve_payout_marks_completed_and_posts_transaction():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")
    payout = service.request_payout(user, Decimal("40.00"), idempotency_key="ap")

    approved = service.approve_payout(
        payout.id, make_current_user(uuid4(), role="admin")
    )

    assert approved.status == "completed"
    assert approved.processed_at is not None
    assert wallet_repo.wallets[user.id].available_balance == Decimal("60.00")
    tx = next(iter(wallet_repo.transactions.values()))
    assert tx.status == "posted"


def test_admin_approve_payout_requires_admin():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")
    payout = service.request_payout(user, Decimal("40.00"), idempotency_key="ap2")

    with pytest.raises(HTTPException) as exc:
        service.approve_payout(payout.id, make_current_user(uuid4(), role="driver"))
    assert exc.value.status_code == 403


def test_admin_reject_payout_reverses_balance_and_marks_reversed():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")
    payout = service.request_payout(user, Decimal("40.00"), idempotency_key="rj")
    assert wallet_repo.wallets[user.id].available_balance == Decimal("60.00")

    rejected = service.reject_payout(
        payout.id, make_current_user(uuid4(), role="admin")
    )

    assert rejected.status == "rejected"
    assert rejected.processed_at is not None
    assert wallet_repo.wallets[user.id].available_balance == Decimal("100.00")
    tx = next(iter(wallet_repo.transactions.values()))
    assert tx.status == "reversed"


def test_admin_approve_nonexistent_payout_returns_404():
    service, _, _, _, _ = make_service("accepted")
    with pytest.raises(HTTPException) as exc:
        service.approve_payout(uuid4(), make_current_user(uuid4(), role="admin"))
    assert exc.value.status_code == 404


def test_admin_cannot_approve_already_processed_payout():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")
    payout = service.request_payout(user, Decimal("40.00"), idempotency_key="twice")
    admin = make_current_user(uuid4(), role="admin")
    service.approve_payout(payout.id, admin)

    with pytest.raises(HTTPException) as exc:
        service.approve_payout(payout.id, admin)
    assert exc.value.status_code == 400


def test_list_user_payouts_returns_only_own():
    service, _, _, _, wallet_repo = make_service("accepted")
    user = make_current_user(uuid4(), role="driver")
    wallet_repo.get_or_create(user.id).available_balance = Decimal("100.00")
    service.request_payout(user, Decimal("10.00"), idempotency_key="u1")
    service.request_payout(user, Decimal("20.00"), idempotency_key="u2")

    result = service.list_user_payouts(user)

    assert result.total == 2
    assert all(item.user_id == user.id for item in result.items)
