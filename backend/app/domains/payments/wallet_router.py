from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.payments.schemas import WalletResponse, WalletTransactionResponse
from app.domains.payments.services import PaymentService

router = APIRouter()


@router.get("/me", response_model=WalletResponse)
def get_my_wallet(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).wallet_for_user(current_user)


@router.get("/me/transactions", response_model=PaginatedResponse[WalletTransactionResponse])
def get_my_wallet_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PaymentService(db).wallet_transactions(current_user, page=page, limit=limit)
