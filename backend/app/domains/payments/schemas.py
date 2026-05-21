from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PaymentCreateRequest(BaseModel):
    booking_id: UUID


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_id: UUID
    amount: float
    status: str
    transaction_id: Optional[str] = None
    created_at: datetime


class PaymentSessionResponse(BaseModel):
    checkout_url: str
    transaction_id: str


class WebhookPayload(BaseModel):
    transaction_id: str
    status: str  # e.g., 'success' or 'failed'
