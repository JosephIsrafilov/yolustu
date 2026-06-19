from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.payments.schemas import (
    PayoutRequestResponse,
    WalletResponse,
    WalletTransactionResponse,
)
from app.domains.payments.services import PaymentService

router = APIRouter()


class TopupRequest(BaseModel):
    amount: float
    idempotency_key: str = Field(..., min_length=1, max_length=255)


class PayoutCreateRequest(BaseModel):
    amount: float
    idempotency_key: str = Field(..., min_length=1, max_length=255)


@router.get("/me", response_model=WalletResponse)
def get_my_wallet(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).wallet_for_user(current_user)


@router.get(
    "/me/transactions", response_model=PaginatedResponse[WalletTransactionResponse]
)
def get_my_wallet_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    filter: str = Query(
        "all",
        pattern="^(all|payments|refunds|income|topups|reservations)$",
    ),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).wallet_transactions(
        current_user, page=page, limit=limit, filter=filter
    )


@router.post("/me/topup")
def topup_wallet(
    request: TopupRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from decimal import Decimal

    return PaymentService(db).topup_wallet(
        current_user,
        Decimal(str(request.amount)),
        idempotency_key=request.idempotency_key,
    )


@router.post("/me/payouts", response_model=PayoutRequestResponse)
def request_payout(
    request: PayoutCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from decimal import Decimal

    return PaymentService(db).request_payout(
        current_user,
        Decimal(str(request.amount)),
        idempotency_key=request.idempotency_key,
    )


@router.get("/me/payouts", response_model=PaginatedResponse[PayoutRequestResponse])
def get_my_payouts(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).list_user_payouts(current_user, page=page, limit=limit)
