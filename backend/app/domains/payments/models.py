import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, JSON, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    passenger_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    service_fee = Column(Numeric(12, 2), nullable=False, default=0)
    driver_amount = Column(Numeric(12, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="AZN")
    provider = Column(String(50), nullable=False, default="mock")
    provider_payment_id = Column(String(255), nullable=True)
    provider_checkout_url = Column(String(1024), nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    transaction_id = Column(String(255), nullable=True)
    idempotency_key = Column(String(255), nullable=True)
    failure_reason = Column(String(500), nullable=True)
    payment_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)

    booking = relationship("Booking")
    passenger = relationship("User", foreign_keys=[passenger_id])
    driver = relationship("User", foreign_keys=[driver_id])
    wallet_transactions = relationship("WalletTransaction", back_populates="payment")


class Wallet(Base):
    __tablename__ = "wallets"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    available_balance = Column(Numeric(12, 2), nullable=False, default=0)
    pending_balance = Column(Numeric(12, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="AZN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), nullable=True)
    type = Column(String(50), nullable=False)
    direction = Column(String(10), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="AZN")
    status = Column(String(20), nullable=False, default="posted")
    description = Column(String(500), nullable=True)
    idempotency_key = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    payment = relationship("Payment", back_populates="wallet_transactions")
    booking = relationship("Booking")
    ride = relationship("Ride")


class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="AZN")
    status = Column(String(20), nullable=False, default="pending")
    method = Column(String(50), nullable=True)
    payout_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


Index("ix_payments_booking_id", Payment.booking_id)
Index("ix_payments_provider_payment_id", Payment.provider_payment_id, unique=True)
Index("ix_payments_transaction_id", Payment.transaction_id, unique=True)
Index("ix_payments_idempotency_key", Payment.idempotency_key, unique=True)
Index("ix_wallet_transactions_user_created", WalletTransaction.user_id, WalletTransaction.created_at)
Index("ix_wallet_transactions_idempotency_key", WalletTransaction.idempotency_key, unique=True)
