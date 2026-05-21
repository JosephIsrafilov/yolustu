from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.payments.repositories import PaymentRepository
from app.domains.payments.providers import get_payment_provider
from app.domains.bookings.repositories import BookingRepository
from app.domains.trips.ports import RideLookupPort
from app.core.notifications import NotificationService
from app.domains.identity.dependencies import CurrentUser

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.payments = PaymentRepository(db)
        self.bookings = BookingRepository(db)
        self.rides = RideLookupPort(db)
        self.provider = get_payment_provider()
        self.notifications = NotificationService(db)

    def create_payment_session(self, booking_id: UUID, current_user: CurrentUser) -> dict:
        booking = self.bookings.get(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking.passenger_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only pay for your own bookings")

        if booking.status != "accepted":
            raise HTTPException(status_code=400, detail="Booking must be accepted before payment")

        # 1. Create a session with the payment provider
        session_data = self.provider.create_payment_session(
            amount=booking.total_price,
            booking_id=booking.id
        )

        # 2. Save pending payment to DB
        self.payments.create(
            booking_id=booking.id,
            amount=booking.total_price,
            transaction_id=session_data["transaction_id"]
        )

        return session_data

    def handle_webhook(self, payload: bytes, stripe_signature: str) -> dict:
        import stripe
        from app.core.config import settings
        
        if not settings.STRIPE_WEBHOOK_SECRET:
            # Fallback for mock environment
            import json
            data = json.loads(payload)
            transaction_id = data.get("transaction_id")
            status = data.get("status")
        else:
            try:
                event = stripe.Webhook.construct_event(
                    payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
                
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                transaction_id = session.get('id')
                status = "success"
            elif event['type'] == 'checkout.session.expired':
                session = event['data']['object']
                transaction_id = session.get('id')
                status = "failed"
            else:
                return {"detail": "Unhandled event type"}

        payment = self.payments.get_by_transaction_id(transaction_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        if status == "success":
            self.payments.update_status(payment, "completed")
            booking = self.bookings.get(payment.booking_id)
            if booking:
                booking.status = "paid"
                self.bookings.save(booking)
                
                # Notify driver
                ride = self.rides.get_ride(booking.ride_id)
                if ride:
                    self.notifications.send_push_notification(
                        user_id=ride.driver_id,
                        title="Ödəniş qəbul edildi",
                        body=f"Rezerv {booking.id} üçün {payment.amount} AZN ödəniş aldınız.",
                        data={"booking_id": str(booking.id), "type": "payment_received"}
                    )
        else:
            self.payments.update_status(payment, "failed")

        return {"detail": "Webhook processed"}
