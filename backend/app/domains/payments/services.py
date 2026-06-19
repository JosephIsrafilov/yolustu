from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, cast
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.notifications import NotificationService
from app.core.pagination import create_paginated_response
from app.domains.bookings.repositories import (
    BookingRepository,
    SeatReservationRepository,
)
from app.domains.identity.dependencies import CurrentUser
from app.domains.lifecycle import (
    BOOKING_ACCEPTED,
    BOOKING_BOARDED,
    BOOKING_CANCELLED,
    BOOKING_COMPLETED,
    BOOKING_EXPIRED,
    BOOKING_PAID,
    PAYMENT_CANCELLED,
    PAYMENT_FAILED,
    PAYMENT_PENDING,
    PAYMENT_REFUNDED,
    PAYMENT_SUCCEEDED,
    RIDE_COMPLETED,
)
from app.domains.payments.models import (
    Payment,
    PayoutRequest,
    ProviderEvent,
    WalletTransaction,
)
from app.domains.payments.providers import get_payment_provider
from app.domains.payments.repositories import (
    PaymentRepository,
    PayoutRepository,
    WalletRepository,
)
from app.domains.trips.ports import RideLookupPort

MONEY = Decimal("0.01")


def money(value: Decimal | int | str) -> Decimal:
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.payments = PaymentRepository(db)
        self.wallets = WalletRepository(db)
        self.payouts = PayoutRepository(db)
        self.bookings = BookingRepository(db)
        self.seats = SeatReservationRepository(db)
        self.rides = RideLookupPort(db)
        self.notifications = NotificationService(db)

    def create_payment_session(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> dict:
        booking = self.bookings.get_for_update(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        ride = self.rides.get_ride_for_update(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        if booking.passenger_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="You can only pay for your own bookings"
            )
        if ride.driver_id == current_user.id:
            raise HTTPException(status_code=403, detail="You cannot pay your own ride")
        if booking.status != BOOKING_ACCEPTED:
            raise HTTPException(
                status_code=400, detail="Booking must be accepted before payment"
            )
        if ride.departure_time <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Cannot pay for a ride that has already departed",
            )
        if ride.available_seats < 0:
            raise HTTPException(status_code=400, detail="Booking has no reserved seats")

        existing = self.payments.get_active_for_booking(booking.id)  # type: ignore[arg-type]
        if existing:
            if existing.status == PAYMENT_SUCCEEDED:
                raise HTTPException(status_code=400, detail="Booking is already paid")
            return self._session_response(existing)

        amount = money(booking.total_price or 0)  # type: ignore[arg-type]
        if amount <= 0:
            raise HTTPException(
                status_code=400, detail="Payment amount must be positive"
            )
        fee_percent = Decimal(str(settings.PLATFORM_FEE_PERCENT))
        service_fee = money(amount * fee_percent / Decimal("100"))
        driver_amount = money(amount - service_fee)
        provider = get_payment_provider()
        payment = Payment(
            booking_id=booking.id,
            passenger_id=booking.passenger_id,
            driver_id=ride.driver_id,
            amount=amount,
            service_fee=service_fee,
            driver_amount=driver_amount,
            currency=settings.PAYMENT_CURRENCY,
            provider=provider.provider_name,
            status=PAYMENT_PENDING,
            idempotency_key=f"payment:create:{booking.id}",
            payment_metadata={"ride_id": str(ride.id)},
        )
        self.payments.add(payment)

        session = provider.create_payment_session(
            payment,
            settings.PAYMENT_SUCCESS_URL or f"{settings.FRONTEND_URL}/bookings",
            settings.PAYMENT_CANCEL_URL or f"{settings.FRONTEND_URL}/bookings",
        )
        payment.transaction_id = session.transaction_id  # type: ignore[assignment]
        payment.provider_payment_id = session.provider_payment_id  # type: ignore[assignment]
        payment.provider_checkout_url = session.checkout_url  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(payment)
        return self._session_response(payment)

    def get_payment(self, payment_id: UUID, current_user: CurrentUser) -> Payment:
        payment = self.payments.get(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if (
            current_user.role != "admin"
            and payment.passenger_id != current_user.id
            and payment.driver_id != current_user.id
        ):
            raise HTTPException(status_code=403, detail="Not authorized")
        return payment

    def handle_webhook(
        self, provider_name: str, headers: dict[str, str], body: bytes
    ) -> dict:
        provider = get_payment_provider(provider_name)
        if not provider.verify_webhook_signature(headers, body):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        event = provider.parse_webhook_event(headers, body)
        if event.status == "ignored":
            return {"detail": "Webhook ignored"}
        payment = self.payments.get_by_transaction_id(event.transaction_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        # Database-level idempotency: a unique (provider, event_key) row makes
        # duplicate/reordered deliveries a no-op. We insert it in its own nested
        # transaction so a duplicate raises IntegrityError without poisoning the
        # outer session.
        if not self._record_provider_event(provider.provider_name, event, payment):
            return {"detail": "Webhook already processed"}

        if event.status == PAYMENT_SUCCEEDED:
            return self.mark_payment_succeeded(payment.id)  # type: ignore[arg-type]
        if event.status == PAYMENT_FAILED:
            return self.mark_payment_failed(payment.id, event.failure_reason)  # type: ignore[arg-type]
        if event.status == PAYMENT_REFUNDED:
            # Provider already moved the money; do NOT call provider.refund again.
            refunded = self.payments.get_for_update(payment.id)  # type: ignore[arg-type]
            if not refunded:
                raise HTTPException(status_code=404, detail="Payment not found")
            return self._apply_refund(refunded, call_provider=False)
        return {"detail": "Webhook processed"}

    def _record_provider_event(
        self, provider_name: str, event, payment: Payment
    ) -> bool:
        """Insert a provider event row. Returns False if already seen."""
        existing = (
            self.db.query(ProviderEvent)
            .filter(
                ProviderEvent.provider == provider_name,
                ProviderEvent.event_key == event.event_key,
            )
            .first()
        )
        if existing:
            return False
        record = ProviderEvent(
            provider=provider_name,
            event_key=event.event_key,
            payment_id=payment.id,
            status=event.status,
            raw=event.raw,
        )
        self.db.add(record)
        try:
            self.db.flush()
        except IntegrityError:
            # Concurrent delivery won the race on the unique index.
            self.db.rollback()
            return False
        return True

    def mark_payment_succeeded(self, payment_id: UUID) -> dict:
        payment = self.payments.get_for_update(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status == PAYMENT_SUCCEEDED:
            return {"detail": "Payment already succeeded"}
        if payment.status != PAYMENT_PENDING:
            raise HTTPException(status_code=400, detail="Payment cannot be succeeded")

        booking = self.bookings.get_for_update(payment.booking_id)  # type: ignore[arg-type]
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        ride = self.rides.get_ride_for_update(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        now = datetime.now(timezone.utc)
        if booking.status != BOOKING_ACCEPTED or (
            booking.payment_deadline is not None and booking.payment_deadline < now
        ):
            if booking.status == BOOKING_ACCEPTED:
                booking.status = BOOKING_EXPIRED  # type: ignore[assignment]
                if ride.status != RIDE_COMPLETED:
                    self._release_booking_seats(booking.id, ride)  # type: ignore[arg-type]
            payment.status = PAYMENT_CANCELLED  # type: ignore[assignment]
            payment.failure_reason = "Booking is no longer payable"  # type: ignore[assignment]
            self.db.commit()
            raise HTTPException(status_code=409, detail="Booking is no longer payable")

        payment.status = PAYMENT_SUCCEEDED  # type: ignore[assignment]
        payment.paid_at = now  # type: ignore[assignment]
        booking.status = BOOKING_PAID  # type: ignore[assignment]

        self._ledger(
            user_id=payment.passenger_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="passenger_payment",
            direction="debit",
            amount=payment.amount,  # type: ignore[arg-type]
            status="posted",
            description="Passenger payment for booking",
            idempotency_key=f"payment:{payment.id}:passenger_payment",
        )
        self._ledger(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="driver_pending_earning",
            direction="credit",
            amount=payment.driver_amount,  # type: ignore[arg-type]
            status="pending",
            description="Driver pending earning",
            idempotency_key=f"payment:{payment.id}:driver_pending_earning",
            balance_bucket="pending",
        )
        self._ledger(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="platform_fee",
            direction="debit",
            amount=payment.service_fee,  # type: ignore[arg-type]
            status="posted",
            description="Platform service fee",
            idempotency_key=f"payment:{payment.id}:platform_fee",
        )

        self.db.commit()
        self.notifications.send_push_notification(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            title="Ödəniş qəbul edildi",
            body=f"Rezerv {booking.id} üçün {payment.amount} AZN ödəniş alındı.",
            data={"booking_id": str(booking.id), "type": "payment_received"},
        )
        return {"detail": "Payment succeeded"}

    def mark_payment_failed(self, payment_id: UUID, reason: str | None = None) -> dict:
        payment = self.payments.get_for_update(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status == PAYMENT_FAILED:
            return {"detail": "Payment already failed"}
        if payment.status != PAYMENT_PENDING:
            raise HTTPException(status_code=400, detail="Payment cannot be failed")
        payment.status = PAYMENT_FAILED  # type: ignore[assignment]
        payment.failure_reason = reason  # type: ignore[assignment]
        self.db.commit()
        return {"detail": "Payment failed"}

    def refund_payment(
        self, payment_id: UUID, current_user: CurrentUser | None
    ) -> dict:
        """Admin/cancel-initiated refund. Calls the provider to move money."""
        payment = self.payments.get_for_update(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if current_user is not None and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return self._apply_refund(payment, call_provider=True)

    def _apply_refund(
        self, payment: Payment, *, call_provider: bool, commit: bool = True
    ) -> dict:
        """Shared refund core.

        ``call_provider=True`` triggers the provider refund (admin/cancel flow).
        ``call_provider=False`` is for inbound provider webhooks where the money
        already moved at the provider — calling refund again would double-refund.
        ``commit=False`` lets a caller (e.g. the ride-cancel cascade) batch
        several refunds into one transaction and own the final commit.
        """
        if payment.status == PAYMENT_REFUNDED:
            return {"detail": "Payment already refunded"}
        if payment.status != PAYMENT_SUCCEEDED:
            raise HTTPException(
                status_code=400, detail="Only succeeded payments can refund"
            )

        booking = self.bookings.get_for_update(payment.booking_id)  # type: ignore[arg-type]
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        ride = self.rides.get_ride_for_update(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        # Wallet payments never have an external provider; the money sits in our
        # own ledger, so we credit the passenger's available balance back rather
        # than calling a non-existent "wallet" provider (which would 400).
        is_wallet = payment.provider == "wallet"
        refund_data: dict[str, Any] | None = None
        if call_provider and not is_wallet:
            provider = get_payment_provider(payment.provider)  # type: ignore[arg-type]
            refund_data = provider.refund(payment, money(payment.amount))  # type: ignore[arg-type]
        payment.status = PAYMENT_REFUNDED  # type: ignore[assignment]
        payment.refunded_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        payment.payment_metadata = {  # type: ignore[assignment]
            **(payment.payment_metadata or {}),
            "refund": (
                refund_data
                if refund_data is not None
                else {
                    "provider": payment.provider,
                    "via": "wallet" if is_wallet else "webhook",
                }
            ),
        }
        booking.status = BOOKING_CANCELLED  # type: ignore[assignment]
        if ride.status != RIDE_COMPLETED:
            self._release_booking_seats(booking.id, ride)  # type: ignore[arg-type]

        self._ledger(
            user_id=payment.passenger_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="refund",
            direction="credit",
            amount=payment.amount,  # type: ignore[arg-type]
            status="posted",
            description="Passenger refund",
            idempotency_key=f"payment:{payment.id}:refund",
            balance_bucket="available" if is_wallet else None,
        )
        self._ledger(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="driver_pending_earning",
            direction="debit",
            amount=payment.driver_amount,  # type: ignore[arg-type]
            status="reversed",
            description="Reverse driver pending earning",
            idempotency_key=f"payment:{payment.id}:driver_pending_earning:reverse",
            balance_bucket="pending",
        )

        if commit:
            self.db.commit()
        return {"detail": "Payment refunded"}

    def cancel_ride_bookings(self, ride) -> int:
        """Cascade a ride cancellation across its active bookings.

        Refunds paid bookings, releases held seats, and reverses pending driver
        earnings — all WITHOUT committing. The caller (TripsService.cancel_ride)
        owns the single transaction so the ride status flip and every booking
        change land atomically. Returns the count of affected bookings.

        Assumes the ride row is already locked FOR UPDATE by the caller.
        """
        from app.domains.payments.reservations import BookingReservationWalletService

        reservations = BookingReservationWalletService(self.db)
        reservations.wallets = self.wallets
        reservations.payments = self.payments
        active = self.bookings.list_active_for_ride(ride.id)
        affected = 0
        for booking in active:
            if booking.status in (BOOKING_PAID, BOOKING_BOARDED):
                payment = self.payments.get_succeeded_for_booking(booking.id)  # type: ignore[arg-type]
                if payment:
                    locked = self.payments.get_for_update(payment.id)  # type: ignore[arg-type]
                    if locked:
                        self._apply_refund(locked, call_provider=True, commit=False)
                        affected += 1
                        self._notify_cancellation(booking)
                        continue
            # Pending/accepted (or paid without a payment row): just release.
            reservations.release_for_booking(booking, ride)
            booking.status = BOOKING_CANCELLED  # type: ignore[assignment]
            if ride.status != RIDE_COMPLETED:
                self._release_booking_seats(booking.id, ride)  # type: ignore[arg-type]
            affected += 1
            self._notify_cancellation(booking)
        return affected

    def _notify_cancellation(self, booking) -> None:
        self.notifications.send_push_notification(
            user_id=booking.passenger_id,
            title="Səfər ləğv edildi",
            body="Sürücü səfəri ləğv etdi. Ödənişiniz geri qaytarıldı.",
            data={"booking_id": str(booking.id), "type": "ride_cancelled"},
        )

    def release_driver_earnings_for_ride(
        self, ride_id: UUID, *, commit: bool = True
    ) -> None:
        ride = self.rides.get_ride_for_update(ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        paid_bookings = [
            b
            for b in self.bookings.list_requests_for_driver(ride.driver_id)  # type: ignore[arg-type]
            if b.ride_id == ride.id and b.status in (BOOKING_PAID, BOOKING_BOARDED)
        ]
        for booking in paid_bookings:
            payment = self.payments.get_succeeded_for_booking(booking.id)
            if not payment:
                continue
            self._ledger(
                user_id=payment.driver_id,  # type: ignore[arg-type]
                payment=payment,
                booking_id=booking.id,  # type: ignore[arg-type]
                ride_id=ride.id,  # type: ignore[arg-type]
                tx_type="driver_available_earning",
                direction="credit",
                amount=payment.driver_amount,  # type: ignore[arg-type]
                status="posted",
                description="Driver earning released after completed ride",
                idempotency_key=f"payment:{payment.id}:driver_available_earning",
                balance_bucket="available",
                pending_delta=-money(payment.driver_amount),  # type: ignore[arg-type]
            )
            booking.status = BOOKING_COMPLETED
        if commit:
            self.db.commit()

    def topup_wallet(
        self, current_user: CurrentUser, amount: Decimal, idempotency_key: str
    ) -> dict:
        amount = money(amount)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Topup amount must be positive")

        scoped_key = f"topup:{current_user.id}:{idempotency_key}"
        existing = self.wallets.get_transaction_by_idempotency_key(scoped_key)
        if existing:
            wallet = self.wallets.get_or_create(
                current_user.id, settings.PAYMENT_CURRENCY
            )
            return {
                "detail": "Topup successful",
                "new_balance": money(wallet.available_balance),  # type: ignore[arg-type]
            }

        wallet = self.wallets.get_or_create_for_update(
            current_user.id, settings.PAYMENT_CURRENCY
        )
        wallet.available_balance = money(wallet.available_balance + amount)  # type: ignore[assignment,arg-type]

        tx = WalletTransaction(
            user_id=current_user.id,
            type="adjustment",
            direction="credit",
            amount=amount,
            currency=settings.PAYMENT_CURRENCY,
            status="posted",
            description="Wallet top-up (Fake Payment)",
            idempotency_key=scoped_key,
        )
        self.wallets.add_transaction(tx)
        self.db.commit()
        return {"detail": "Topup successful", "new_balance": wallet.available_balance}

    def pay_booking_from_wallet(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> dict:
        import uuid

        booking = self.bookings.get_for_update(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        ride = self.rides.get_ride_for_update(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        if booking.passenger_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if booking.status != BOOKING_ACCEPTED:
            raise HTTPException(status_code=400, detail="Booking must be accepted")
        if (
            booking.payment_deadline is not None
            and booking.payment_deadline < datetime.now(timezone.utc)
        ):
            booking.status = BOOKING_EXPIRED  # type: ignore[assignment]
            if ride.status != RIDE_COMPLETED:
                self._release_booking_seats(booking.id, ride)  # type: ignore[arg-type]
            self.db.commit()
            raise HTTPException(status_code=409, detail="Booking is no longer payable")
        if ride.departure_time <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Cannot pay for a ride that has already departed",
            )

        amount = money(booking.total_price or 0)  # type: ignore[arg-type]
        wallet = self.wallets.get_or_create_for_update(
            current_user.id, settings.PAYMENT_CURRENCY
        )
        if wallet.available_balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        wallet.available_balance = money(wallet.available_balance - amount)

        fee_percent = Decimal(str(settings.PLATFORM_FEE_PERCENT))
        service_fee = money(amount * fee_percent / Decimal("100"))
        driver_amount = money(amount - service_fee)

        payment = Payment(
            booking_id=booking.id,
            passenger_id=booking.passenger_id,
            driver_id=ride.driver_id,
            amount=amount,
            service_fee=service_fee,
            driver_amount=driver_amount,
            currency=settings.PAYMENT_CURRENCY,
            provider="wallet",
            status=PAYMENT_SUCCEEDED,
            idempotency_key=f"wallet_payment:{booking.id}:{uuid.uuid4()}",
            paid_at=datetime.now(timezone.utc),
        )
        self.payments.add(payment)
        self.db.flush()

        booking.status = BOOKING_PAID  # type: ignore[assignment]

        self._ledger(
            user_id=payment.passenger_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="passenger_payment",
            direction="debit",
            amount=payment.amount,  # type: ignore[arg-type]
            status="posted",
            description="Passenger payment from wallet",
            idempotency_key=f"payment:{payment.id}:passenger_payment",
        )

        self._ledger(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="driver_pending_earning",
            direction="credit",
            amount=payment.driver_amount,  # type: ignore[arg-type]
            status="pending",
            description="Driver pending earning",
            idempotency_key=f"payment:{payment.id}:driver_pending_earning",
            balance_bucket="pending",
        )
        self._ledger(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="platform_fee",
            direction="debit",
            amount=payment.service_fee,  # type: ignore[arg-type]
            status="posted",
            description="Platform service fee",
            idempotency_key=f"payment:{payment.id}:platform_fee",
        )

        self.db.commit()
        self.notifications.send_push_notification(
            user_id=payment.driver_id,  # type: ignore[arg-type]
            title="Ödəniş qəbul edildi",
            body=f"Rezerv {booking.id} üçün {payment.amount} AZN ödəniş alındı (Cüzdanla).",
            data={"booking_id": str(booking.id), "type": "payment_received"},
        )
        return {"detail": "Payment succeeded"}

    def wallet_for_user(self, current_user: CurrentUser) -> dict:
        wallet = self.wallets.get_or_create(current_user.id, settings.PAYMENT_CURRENCY)
        return {
            "user_id": wallet.user_id,
            "available_balance": money(wallet.available_balance),  # type: ignore[arg-type]
            "pending_balance": money(wallet.pending_balance),  # type: ignore[arg-type]
            "currency": wallet.currency,
            "total_earned": self.wallets.sum_by_type(
                current_user.id, "driver_available_earning"
            ),
            "total_spent": self.wallets.sum_by_type(
                current_user.id, "passenger_payment"
            ),
            "total_refunded": self.wallets.sum_by_type(current_user.id, "refund"),
        }

    def wallet_transactions(
        self,
        current_user: CurrentUser,
        page: int = 1,
        limit: int = 50,
        filter: str = "all",
    ):
        skip = (page - 1) * limit
        items = self.wallets.list_transactions(
            current_user.id, skip=skip, limit=limit, filter=filter
        )
        total = self.wallets.count_transactions(current_user.id, filter=filter)
        return create_paginated_response(items, total, page, limit)

    def request_payout(
        self, current_user: CurrentUser, amount: Decimal, idempotency_key: str
    ) -> PayoutRequest:
        amount = money(amount)
        if amount <= 0:
            raise HTTPException(
                status_code=400, detail="Payout amount must be positive"
            )

        scoped_key = f"payout:{current_user.id}:{idempotency_key}"
        existing_tx = self.wallets.get_transaction_by_idempotency_key(scoped_key)
        if existing_tx is not None:
            existing_payout = self.payouts.get_by_idempotency_key(scoped_key)
            if existing_payout is not None:
                return existing_payout

        wallet = self.wallets.get_or_create_for_update(
            current_user.id, settings.PAYMENT_CURRENCY
        )
        if money(wallet.available_balance) < amount:  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

        wallet.available_balance = money(wallet.available_balance - amount)  # type: ignore[assignment,arg-type]

        payout = PayoutRequest(
            user_id=current_user.id,
            amount=amount,
            currency=settings.PAYMENT_CURRENCY,
            status="pending",
            method="mock",
            payout_metadata={"idempotency_key": scoped_key},
        )
        self.payouts.add(payout)

        self.wallets.add_transaction(
            WalletTransaction(
                user_id=current_user.id,
                type="payout",
                direction="debit",
                amount=amount,
                currency=settings.PAYMENT_CURRENCY,
                status="pending",
                description="Wallet payout request",
                idempotency_key=scoped_key,
            )
        )
        self.db.commit()
        self.db.refresh(payout)
        return payout

    def list_user_payouts(
        self, current_user: CurrentUser, page: int = 1, limit: int = 50
    ):
        skip = (page - 1) * limit
        items = self.payouts.list_for_user(current_user.id, skip=skip, limit=limit)
        total = self.payouts.count_for_user(current_user.id)
        return create_paginated_response(items, total, page, limit)

    def list_admin_payouts(
        self, current_user: CurrentUser, page: int = 1, limit: int = 50
    ):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        skip = (page - 1) * limit
        items = self.payouts.list_by_status("pending", skip=skip, limit=limit)
        total = self.payouts.count_by_status("pending")
        return create_paginated_response(items, total, page, limit)

    def approve_payout(
        self, payout_id: UUID, current_user: CurrentUser
    ) -> PayoutRequest:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        payout = self.payouts.get_for_update(payout_id)
        if not payout:
            raise HTTPException(status_code=404, detail="Payout request not found")
        if payout.status != "pending":
            raise HTTPException(status_code=400, detail="Payout request is not pending")

        tx = self.wallets.get_transaction_by_idempotency_key(
            self._payout_idempotency_key(payout)
        )
        if tx is not None:
            tx.status = "posted"  # type: ignore[assignment]
        payout.status = "completed"  # type: ignore[assignment]
        payout.processed_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(payout)
        return payout

    def reject_payout(
        self, payout_id: UUID, current_user: CurrentUser
    ) -> PayoutRequest:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        payout = self.payouts.get_for_update(payout_id)
        if not payout:
            raise HTTPException(status_code=404, detail="Payout request not found")
        if payout.status != "pending":
            raise HTTPException(status_code=400, detail="Payout request is not pending")

        wallet = self.wallets.get_or_create_for_update(
            payout.user_id,
            payout.currency,  # type: ignore[arg-type]
        )
        wallet.available_balance = money(  # type: ignore[assignment]
            wallet.available_balance + payout.amount  # type: ignore[arg-type]
        )

        tx = self.wallets.get_transaction_by_idempotency_key(
            self._payout_idempotency_key(payout)
        )
        if tx is not None:
            tx.status = "reversed"  # type: ignore[assignment]
        payout.status = "rejected"  # type: ignore[assignment]
        payout.processed_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(payout)
        return payout

    def list_admin_payments(
        self,
        current_user: CurrentUser,
        status: str | None = None,
        provider: str | None = None,
        user_id: UUID | None = None,
        page: int = 1,
        limit: int = 50,
    ):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        skip = (page - 1) * limit
        items = self.payments.list_admin(status, provider, user_id, skip, limit)
        total = self.payments.count_admin(status, provider, user_id)
        return create_paginated_response(items, total, page, limit)

    def _ledger(
        self,
        *,
        user_id: UUID | None,
        payment: Payment | None,
        booking_id: UUID,
        ride_id: UUID,
        tx_type: str,
        direction: str,
        amount: Decimal,
        status: str,
        description: str,
        idempotency_key: str,
        balance_bucket: str | None = None,
        pending_delta: Decimal | None = None,
    ) -> None:
        if user_id is None:
            raise HTTPException(status_code=500, detail="Ledger user is missing")
        if self.wallets.get_transaction_by_idempotency_key(idempotency_key):
            return
        amount = money(amount)
        currency = payment.currency if payment else settings.PAYMENT_CURRENCY
        wallet = self.wallets.get_or_create_for_update(
            user_id,
            currency,  # type: ignore[arg-type]
        )
        sign = Decimal("1") if direction == "credit" else Decimal("-1")
        if balance_bucket == "pending":
            wallet.pending_balance = money(wallet.pending_balance + amount * sign)  # type: ignore[assignment,arg-type]
        elif balance_bucket == "available":
            wallet.available_balance = money(wallet.available_balance + amount * sign)  # type: ignore[assignment,arg-type]
            if pending_delta is not None:
                wallet.pending_balance = money(wallet.pending_balance + pending_delta)  # type: ignore[assignment,arg-type]

        self.wallets.add_transaction(
            WalletTransaction(
                user_id=user_id,
                payment_id=payment.id if payment else None,
                booking_id=booking_id,
                ride_id=ride_id,
                type=tx_type,
                direction=direction,
                amount=amount,
                currency=currency,
                status=status,
                description=description,
                idempotency_key=idempotency_key,
            )
        )

    @staticmethod
    def _session_response(payment: Payment) -> dict:
        return {
            "payment_id": payment.id,
            "booking_id": payment.booking_id,
            "amount": payment.amount,
            "service_fee": payment.service_fee,
            "driver_amount": payment.driver_amount,
            "currency": payment.currency,
            "provider": payment.provider,
            "status": payment.status,
            "checkout_url": payment.provider_checkout_url or "",
            "transaction_id": payment.transaction_id or "",
        }

    @staticmethod
    def _payout_idempotency_key(payout: PayoutRequest) -> str:
        metadata = cast(dict[str, Any] | None, payout.payout_metadata)
        return str((metadata or {}).get("idempotency_key", ""))

    def _release_booking_seats(self, booking_id: UUID, ride) -> None:
        self.seats.release(booking_id, datetime.now(timezone.utc))
        available = self.seats.available_spots(ride.id)
        ride.available_spots = available  # type: ignore[assignment]
        ride.available_seats = len(available)  # type: ignore[assignment]
