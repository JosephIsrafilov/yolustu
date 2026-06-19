from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreateRequest(BaseModel):
    booking_id: UUID


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_id: UUID
    passenger_id: Optional[UUID] = None
    driver_id: Optional[UUID] = None
    amount: Decimal
    service_fee: Decimal
    driver_amount: Decimal
    currency: str
    provider: str
    provider_payment_id: Optional[str] = None
    provider_checkout_url: Optional[str] = None
    status: str
    transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    failure_reason: Optional[str] = None
    metadata: Optional[dict[str, Any]] = Field(
        default=None, validation_alias="payment_metadata"
    )
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None


class PaymentSessionResponse(BaseModel):
    payment_id: UUID
    booking_id: UUID
    amount: Decimal
    service_fee: Decimal
    driver_amount: Decimal
    currency: str
    provider: str
    status: str
    checkout_url: str
    transaction_id: str


class WebhookPayload(BaseModel):
    transaction_id: str
    status: str
    failure_reason: Optional[str] = None


class WalletResponse(BaseModel):
    user_id: UUID
    available_balance: Decimal
    pending_balance: Decimal
    currency: str
    total_earned: Decimal
    total_spent: Decimal
    total_refunded: Decimal


class WalletTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    payment_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None
    ride_id: Optional[UUID] = None
    type: str
    direction: str
    amount: Decimal
    currency: str
    status: str
    description: Optional[str] = None
    idempotency_key: str
    created_at: datetime


class PaymentWebhookResponse(BaseModel):
    detail: str


class PayoutRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    amount: Decimal
    currency: str
    status: str
    method: Optional[str] = None
    metadata: Optional[dict[str, Any]] = Field(
        default=None, validation_alias="payout_metadata"
    )
    created_at: datetime
    processed_at: Optional[datetime] = None


class WalletTopUpRequest(BaseModel):
    amount: Decimal


class WalletTopUpResponse(BaseModel):
    checkout_url: str
    session_id: str
    payment_id: Optional[UUID] = None


class WalletTopUpSessionResponse(BaseModel):
    session_id: str
    status: str
    amount: Decimal
    currency: str
    wallet_balance: Decimal
