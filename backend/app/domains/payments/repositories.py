from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domains.payments.models import (
    Payment,
    PayoutRequest,
    TRANSACTION_TYPES,
    Wallet,
    WalletTransaction,
)


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment

    def get(self, payment_id: UUID) -> Payment | None:
        return self.db.query(Payment).filter(Payment.id == payment_id).first()

    def get_for_update(self, payment_id: UUID) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.id == payment_id)
            .with_for_update()
            .first()
        )

    def get_by_transaction_id(self, transaction_id: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.transaction_id == transaction_id)
            .first()
        )

    def get_active_for_booking(self, booking_id: UUID) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(
                Payment.booking_id == booking_id,
                Payment.status.in_(["pending", "succeeded"]),
            )
            .order_by(Payment.created_at.desc())
            .first()
        )

    def get_succeeded_for_booking(self, booking_id: UUID) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.booking_id == booking_id, Payment.status == "succeeded")
            .order_by(Payment.created_at.desc())
            .first()
        )

    def list_admin(
        self,
        status: str | None = None,
        provider: str | None = None,
        user_id: UUID | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Payment]:
        query = self.db.query(Payment)
        if status:
            query = query.filter(Payment.status == status)
        if provider:
            query = query.filter(Payment.provider == provider)
        if user_id:
            query = query.filter(
                (Payment.passenger_id == user_id) | (Payment.driver_id == user_id)
            )
        return query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

    def count_admin(
        self,
        status: str | None = None,
        provider: str | None = None,
        user_id: UUID | None = None,
    ) -> int:
        query = self.db.query(Payment)
        if status:
            query = query.filter(Payment.status == status)
        if provider:
            query = query.filter(Payment.provider == provider)
        if user_id:
            query = query.filter(
                (Payment.passenger_id == user_id) | (Payment.driver_id == user_id)
            )
        return query.count()


class WalletRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, user_id: UUID, currency: str = "AZN") -> Wallet:
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if wallet:
            return wallet
        wallet = Wallet(
            user_id=user_id,
            available_balance=Decimal("0.00"),
            pending_balance=Decimal("0.00"),
            currency=currency,
        )
        self.db.add(wallet)
        self.db.flush()
        return wallet

    def get_or_create_for_update(self, user_id: UUID, currency: str = "AZN") -> Wallet:
        wallet = (
            self.db.query(Wallet)
            .filter(Wallet.user_id == user_id)
            .with_for_update()
            .first()
        )
        if wallet:
            return wallet
        # If not found, create without lock. The calling service will commit.
        wallet = Wallet(
            user_id=user_id,
            available_balance=Decimal("0.00"),
            pending_balance=Decimal("0.00"),
            currency=currency,
        )
        self.db.add(wallet)
        self.db.flush()
        return wallet

    def _filtered_transactions_query(self, user_id: UUID, filter: str = "all"):
        query = self.db.query(WalletTransaction).filter(
            WalletTransaction.user_id == user_id
        )
        if filter == "refunds":
            query = query.filter(WalletTransaction.type == "refund")
        elif filter == "income":
            query = query.filter(
                WalletTransaction.direction == "credit",
                WalletTransaction.type != "refund",
            )
        elif filter == "payments":
            query = query.filter(
                WalletTransaction.direction == "debit",
                WalletTransaction.type != "refund",
            )
        elif filter == "topups":
            query = query.filter(WalletTransaction.type == "adjustment")
        return query

    def list_transactions(
        self, user_id: UUID, skip: int = 0, limit: int = 50, filter: str = "all"
    ) -> list[WalletTransaction]:
        return (
            self._filtered_transactions_query(user_id, filter)
            .order_by(WalletTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_transactions(self, user_id: UUID, filter: str = "all") -> int:
        return self._filtered_transactions_query(user_id, filter).count()

    def get_transaction_by_idempotency_key(
        self, idempotency_key: str
    ) -> WalletTransaction | None:
        return (
            self.db.query(WalletTransaction)
            .filter(WalletTransaction.idempotency_key == idempotency_key)
            .first()
        )

    def get_transaction_for_update(self, transaction_id: UUID) -> WalletTransaction | None:
        return (
            self.db.query(WalletTransaction)
            .filter(WalletTransaction.id == transaction_id)
            .with_for_update()
            .first()
        )

    def add_transaction(self, transaction: WalletTransaction) -> WalletTransaction:
        if transaction.type not in TRANSACTION_TYPES:
            raise ValueError(f"Unknown wallet transaction type: {transaction.type!r}")
        self.db.add(transaction)
        self.db.flush()
        return transaction

    def sum_by_type(self, user_id: UUID, tx_type: str) -> Decimal:
        value = (
            self.db.query(func.coalesce(func.sum(WalletTransaction.amount), 0))
            .filter(
                WalletTransaction.user_id == user_id,
                WalletTransaction.type == tx_type,
                WalletTransaction.status == "posted",
            )
            .scalar()
        )
        return Decimal(value or 0)


class PayoutRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, payout: PayoutRequest) -> PayoutRequest:
        self.db.add(payout)
        self.db.flush()
        return payout

    def get_for_update(self, payout_id: UUID) -> PayoutRequest | None:
        return (
            self.db.query(PayoutRequest)
            .filter(PayoutRequest.id == payout_id)
            .with_for_update()
            .first()
        )

    def get_by_idempotency_key(self, idempotency_key: str) -> PayoutRequest | None:
        return (
            self.db.query(PayoutRequest)
            .filter(
                PayoutRequest.payout_metadata["idempotency_key"].astext
                == idempotency_key
            )
            .first()
        )

    def list_for_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[PayoutRequest]:
        return (
            self.db.query(PayoutRequest)
            .filter(PayoutRequest.user_id == user_id)
            .order_by(PayoutRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_for_user(self, user_id: UUID) -> int:
        return (
            self.db.query(PayoutRequest)
            .filter(PayoutRequest.user_id == user_id)
            .count()
        )

    def list_by_status(
        self, status: str, skip: int = 0, limit: int = 50
    ) -> list[PayoutRequest]:
        return (
            self.db.query(PayoutRequest)
            .filter(PayoutRequest.status == status)
            .order_by(PayoutRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_status(self, status: str) -> int:
        return (
            self.db.query(PayoutRequest)
            .filter(PayoutRequest.status == status)
            .count()
        )
