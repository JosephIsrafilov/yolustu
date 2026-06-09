from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domains.payments.models import Payment, Wallet, WalletTransaction


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

    def list_transactions(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[WalletTransaction]:
        return (
            self.db.query(WalletTransaction)
            .filter(WalletTransaction.user_id == user_id)
            .order_by(WalletTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_transaction_by_idempotency_key(
        self, idempotency_key: str
    ) -> WalletTransaction | None:
        return (
            self.db.query(WalletTransaction)
            .filter(WalletTransaction.idempotency_key == idempotency_key)
            .first()
        )

    def add_transaction(self, transaction: WalletTransaction) -> WalletTransaction:
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
