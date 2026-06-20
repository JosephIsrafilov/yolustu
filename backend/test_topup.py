import os
import sys

# Append backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.domains.payments.services import PaymentService

# We just want to try creating a stripe topup session using dummy data
import stripe
from decimal import Decimal

stripe.api_key = settings.STRIPE_SECRET_KEY

print("STRIPE_CHECKOUT_SUCCESS_URL:", settings.STRIPE_CHECKOUT_SUCCESS_URL)
print("STRIPE_CHECKOUT_CANCEL_URL:", settings.STRIPE_CHECKOUT_CANCEL_URL)

try:
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": settings.STRIPE_CURRENCY.lower(),
                    "product_data": {
                        "name": "Yolmates wallet top-up",
                    },
                    "unit_amount": int(Decimal("10.00") * 100),
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=settings.STRIPE_CHECKOUT_SUCCESS_URL,
        cancel_url=settings.STRIPE_CHECKOUT_CANCEL_URL,
        client_reference_id="dummy_user_id",
        metadata={
            "type": "wallet_top_up",
            "user_id": "dummy_user_id",
            "amount": "10.00",
            "currency": settings.STRIPE_CURRENCY.upper(),
        },
    )
    print("SUCCESS", session.url)
except Exception as e:
    print("STRIPE EXCEPTION:", str(e))
