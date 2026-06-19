from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser
from app.domains.lifecycle import BOOKING_PAID, PAYMENT_SUCCEEDED
from app.domains.payments.models import Payment, WalletTransaction
from app.domains.payments.repositories import PaymentRepository, WalletRepository
from app.domains.payments.services import money


ZERO = Decimal("0.00")


class BookingReservationWalletService:
    """Wallet hold/capture workflow for booking reservations.

    A passenger booking first creates a wallet hold: available balance goes down,
    pending balance goes up, and the user sees a reservation transaction. When the
    driver confirms the request, the hold is captured into a normal wallet payment.
    If the driver rejects, the passenger cancels, or the booking expires, the hold
    is released back to the passenger's available balance.
    """

    def __init__(self, db: Session):
        self.db = db
        self.wallets = WalletRepository(db)
        self.payments = PaymentRepository(db)

    def reserve_for_booking(self, booking, ride, current_user: CurrentUser) -> None:
        amount = money(booking.total_price or ZERO)
        if amount <= ZERO:
            raise HTTPException(
                status_code=400, detail="Reservation amount must be positive"
            )

        hold_key = self._hold_key(booking.id)
        existing_hold = self.wallets.get_transaction_by_idempotency_key(hold_key)
        if existing_hold is not None and existing_hold.status == "pending":
            return

        wallet = self.wallets.get_or_create_for_update(
            current_user.id,
            settings.PAYMENT_CURRENCY,
        )
        if money(wallet.available_balance) < amount:  # type: ignore[arg-type]
            raise HTTPException(
                status_code=400,
                detail="Insufficient wallet balance for reservation",
            )

        wallet.available_balance = money(  # type: ignore[assignment,arg-type]
            wallet.available_balance - amount
        )
        wallet.pending_balance = money(  # type: ignore[assignment,arg-type]
            wallet.pending_balance + amount
        )

        self.wallets.add_transaction(
            WalletTransaction(
                user_id=current_user.id,
                booking_id=booking.id,
                ride_id=ride.id,
                type="reservation_hold",
                direction="debit",
                amount=amount,
                currency=settings.PAYMENT_CURRENCY,
                status="pending",
                description=(
                    f"{amount} {settings.PAYMENT_CURRENCY} reserved for booking "
                    "until driver confirmation"
                ),
                idempotency_key=hold_key,
            )
        )

    def capture_for_booking(self, booking, ride) -> Payment:
        amount = money(booking.total_price or ZERO)
        if amount <= ZERO:
            raise HTTPException(
                status_code=400,
                detail="Payment amount must be positive",
            )

        existing_payment = self.payments.get_succeeded_for_booking(booking.id)
        if existing_payment is not None:
            booking.status = BOOKING_PAID  # type: ignore[assignment]
            booking.payment_deadline = None  # type: ignore[assignment]
            return existing_payment

        hold = self.wallets.get_transaction_by_idempotency_key(
            self._hold_key(booking.id)
        )
        wallet = self.wallets.get_or_create_for_update(
            booking.passenger_id,
            settings.PAYMENT_CURRENCY,
        )

        if hold is not None and hold.status == "pending":
            wallet.pending_balance = self._subtract_pending(  # type: ignore[assignment]
                wallet.pending_balance,  # type: ignore[arg-type]
                amount,
            )
            hold.status = "captured"  # type: ignore[assignment]
            hold.description = (  # type: ignore[assignment]
                "Reservation hold captured after driver confirmation"
            )
        else:
            # Backward-compatible fallback for older accepted bookings that were
            # created before wallet holds existed.
            if money(wallet.available_balance) < amount:  # type: ignore[arg-type]
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient wallet balance",
                )
            wallet.available_balance = money(  # type: ignore[assignment,arg-type]
                wallet.available_balance - amount
            )

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
            idempotency_key=f"wallet_capture:{booking.id}",
            paid_at=datetime.now(timezone.utc),
            payment_metadata={"ride_id": str(ride.id), "source": "reservation_hold"},
        )
        self.payments.add(payment)

        self._ledger(
            user_id=payment.passenger_id,  # type: ignore[arg-type]
            payment=payment,
            booking_id=booking.id,  # type: ignore[arg-type]
            ride_id=ride.id,  # type: ignore[arg-type]
            tx_type="passenger_payment",
            direction="debit",
            amount=payment.amount,  # type: ignore[arg-type]
            status="posted",
            description="Passenger payment captured from reserved wallet balance",
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

        booking.status = BOOKING_PAID  # type: ignore[assignment]
        booking.payment_deadline = None  # type: ignore[assignment]
        return payment

    def release_for_booking(self, booking, ride) -> None:
        hold = self.wallets.get_transaction_by_idempotency_key(
            self._hold_key(booking.id)
        )
        if hold is None or hold.status != "pending":
            return

        amount = money(hold.amount)
        wallet = self.wallets.get_or_create_for_update(
            booking.passenger_id,
            hold.currency or settings.PAYMENT_CURRENCY,  # type: ignore[arg-type]
        )
        wallet.pending_balance = self._subtract_pending(  # type: ignore[assignment]
            wallet.pending_balance,  # type: ignore[arg-type]
            amount,
        )
        wallet.available_balance = money(  # type: ignore[assignment,arg-type]
            wallet.available_balance + amount
        )
        hold.status = "reversed"  # type: ignore[assignment]
        hold.description = "Reservation hold released"  # type: ignore[assignment]

        release_key = self._release_key(booking.id)
        if self.wallets.get_transaction_by_idempotency_key(release_key) is None:
            self.wallets.add_transaction(
                WalletTransaction(
                    user_id=booking.passenger_id,
                    booking_id=booking.id,
                    ride_id=ride.id,
                    type="reservation_release",
                    direction="credit",
                    amount=amount,
                    currency=hold.currency or settings.PAYMENT_CURRENCY,
                    status="posted",
                    description="Reserved booking amount returned to wallet",
                    idempotency_key=release_key,
                )
            )

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
            wallet.pending_balance = money(  # type: ignore[assignment,arg-type]
                wallet.pending_balance + amount * sign
            )
        elif balance_bucket == "available":
            wallet.available_balance = money(  # type: ignore[assignment,arg-type]
                wallet.available_balance + amount * sign
            )

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
    def _subtract_pending(current: Decimal, amount: Decimal) -> Decimal:
        current = money(current)
        amount = money(amount)
        if current < amount:
            raise HTTPException(
                status_code=409,
                detail="Wallet pending balance is lower than the reserved amount",
            )
        return money(current - amount)

    @staticmethod
    def _hold_key(booking_id: UUID) -> str:
        return f"booking:{booking_id}:reservation_hold"

    @staticmethod
    def _release_key(booking_id: UUID) -> str:
        return f"booking:{booking_id}:reservation_release"
