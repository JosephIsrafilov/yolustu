from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.payments.schemas import (
    PaymentCreateRequest,
    PaymentResponse,
    PaymentSessionResponse,
    PaymentWebhookResponse,
)
from app.domains.payments.services import PaymentService

router = APIRouter()


class WalletPaymentRequest(BaseModel):
    booking_id: UUID


@router.post("/create", response_model=PaymentSessionResponse)
def create_payment(
    request: PaymentCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).create_payment_session(request.booking_id, current_user)


@router.post("/wallet-pay")
def pay_from_wallet(
    request: WalletPaymentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).pay_booking_from_wallet(request.booking_id, current_user)


@router.get("/admin", response_model=PaginatedResponse[PaymentResponse])
def list_payments_admin(
    status: Optional[str] = None,
    provider: Optional[str] = None,
    user_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).list_admin_payments(
        current_user,
        status=status,
        provider=provider,
        user_id=user_id,
        page=page,
        limit=limit,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).get_payment(payment_id, current_user)


@router.post("/mock/{payment_id}/succeed", response_model=PaymentWebhookResponse)
def mock_payment_succeed(
    payment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = PaymentService(db).get_payment(payment_id, current_user)
    return PaymentService(db).mark_payment_succeeded(payment.id)


@router.post("/mock/{payment_id}/fail", response_model=PaymentWebhookResponse)
def mock_payment_fail(
    payment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = PaymentService(db).get_payment(payment_id, current_user)
    return PaymentService(db).mark_payment_failed(payment.id, "Mock failure")


@router.post("/webhook/{provider}", response_model=PaymentWebhookResponse)
async def payment_webhook(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    headers = {key.lower(): value for key, value in request.headers.items()}
    return PaymentService(db).handle_webhook(provider, headers, payload)


@router.post("/webhook", response_model=PaymentWebhookResponse)
async def legacy_payment_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    headers = {key.lower(): value for key, value in request.headers.items()}
    return PaymentService(db).handle_webhook("mock", headers, payload)


@router.post("/{payment_id}/refund", response_model=PaymentWebhookResponse)
def refund_payment(
    payment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).refund_payment(payment_id, current_user)
