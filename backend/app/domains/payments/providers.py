import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any

import stripe
from app.core.config import settings


class BasePaymentProvider(ABC):
    @abstractmethod
    def create_payment_session(
        self, amount: float, booking_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Creates a payment session and returns a checkout URL and transaction ID.
        """
        pass


class StripePaymentProvider(BasePaymentProvider):
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_payment_session(
        self, amount: float, booking_id: uuid.UUID
    ) -> Dict[str, Any]:
        if not settings.STRIPE_SECRET_KEY:
            # Fallback if key is empty
            transaction_id = f"mock_tx_{uuid.uuid4().hex[:8]}"
            return {
                "transaction_id": transaction_id,
                "checkout_url": f"http://localhost:3000/mock-checkout?tx={transaction_id}&amount={amount}",
            }

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "azn",
                        "product_data": {
                            "name": "YolUstu Gediş Ödənişi",
                            "description": f"Rezerv ID: {booking_id}",
                        },
                        "unit_amount": int(amount * 100),  # Stripe uses cents/qepiks
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{settings.FRONTEND_URL}/bookings?payment=success&booking={booking_id}",
            cancel_url=f"{settings.FRONTEND_URL}/bookings?payment=cancelled",
            client_reference_id=str(booking_id),
            metadata={"booking_id": str(booking_id)},
        )

        return {"transaction_id": session.id, "checkout_url": session.url}


def get_payment_provider() -> BasePaymentProvider:
    return StripePaymentProvider()
