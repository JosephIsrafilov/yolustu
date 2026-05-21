from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.payments.schemas import PaymentCreateRequest, PaymentSessionResponse, WebhookPayload
from app.domains.payments.services import PaymentService

router = APIRouter()


@router.post("/create", response_model=PaymentSessionResponse)
def create_payment(
    request: PaymentCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PaymentService(db)
    return service.create_payment_session(request.booking_id, current_user)


from fastapi import Request, Header

@router.post("/webhook")
async def payment_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db),
):
    payload = await request.body()
    service = PaymentService(db)
    return service.handle_webhook(payload, stripe_signature)
