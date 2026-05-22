from uuid import UUID
from sqlalchemy.orm import Session
from app.domains.payments.models import Payment


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, booking_id: UUID, amount: float, transaction_id: str) -> Payment:
        payment = Payment(
            booking_id=booking_id,
            amount=amount,
            status="pending",
            transaction_id=transaction_id,
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_by_transaction_id(self, transaction_id: str) -> Payment | None:
        return (
            self.db.query(Payment)
            .filter(Payment.transaction_id == transaction_id)
            .first()
        )

    def update_status(self, payment: Payment, status: str) -> Payment:
        payment.status = status
        self.db.commit()
        self.db.refresh(payment)
        return payment
