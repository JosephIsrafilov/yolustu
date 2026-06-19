import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, JSON, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

# Canonical set of wallet transaction types. The ``type`` column stays a plain
# String(50) (changing it to a DB enum is risky with existing data), but this
# tuple is the single source of truth for validation at the Python level.
TRANSACTION_TYPES: tuple[str, ...] = (
    "passenger_payment",
    "platform_fee",
    "driver_pending_earning",
    "driver_available_earning",
    "refund",
    "payout",
    "adjustment",
    "reservation_hold",
    "reservation_release",
)

# Filters exposed on the transactions listing endpoint.
TRANSACTION_FILTERS: tuple[str, ...] = (
    "all",
    "payments",
    "refunds",
    "income",
    "topups",
    "reservations",
)


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


class ProviderEvent(Base):
    """Append-only log of inbound provider webhook events.

    The ``event_key`` is the provider's native event id when available, falling
    back to ``{transaction_id}:{status}``. The unique index on it is the
    database-level guard against duplicate/reordered webhook deliveries.
    """

    __tablename__ = "provider_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False)
    event_key = Column(String(255), nullable=False)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    status = Column(String(50), nullable=False)
    raw = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    payment = relationship("Payment")


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
Index("ix_payments_status", Payment.status)
Index("ix_payments_passenger_id", Payment.passenger_id)
Index("ix_payments_driver_id", Payment.driver_id)
Index("ix_payments_created_at", Payment.created_at)
Index("ix_payments_provider_payment_id", Payment.provider_payment_id, unique=True)
Index("ix_payments_transaction_id", Payment.transaction_id, unique=True)
Index("ix_payments_idempotency_key", Payment.idempotency_key, unique=True)
Index(
    "ix_wallet_transactions_user_created",
    WalletTransaction.user_id,
    WalletTransaction.created_at,
)
Index("ix_wallet_transactions_type", WalletTransaction.type)
Index("ix_wallet_transactions_status", WalletTransaction.status)
Index(
    "ix_wallet_transactions_idempotency_key",
    WalletTransaction.idempotency_key,
    unique=True,
)
Index("ix_provider_events_payment_id", ProviderEvent.payment_id)
Index(
    "ix_provider_events_provider_event_key",
    ProviderEvent.provider,
    ProviderEvent.event_key,
    unique=True,
)
