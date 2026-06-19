import json
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from fastapi import HTTPException

from app.core.config import settings
from app.domains.payments.models import Payment


@dataclass(frozen=True)
class PaymentSession:
    transaction_id: str
    checkout_url: str
    provider_payment_id: str | None = None


@dataclass(frozen=True)
class PaymentWebhookEvent:
    transaction_id: str
    status: str
    failure_reason: str | None = None
    raw: dict[str, Any] | None = None
    event_id: str | None = None

    @property
    def event_key(self) -> str:
        """Stable idempotency key for the event.

        Prefers the provider's native event id; falls back to
        ``{transaction_id}:{status}`` when the provider supplies none.
        """
        return self.event_id or f"{self.transaction_id}:{self.status}"


class BasePaymentProvider(ABC):
    provider_name: str

    @abstractmethod
    def create_payment_session(
        self, payment: Payment, return_url: str, cancel_url: str
    ) -> PaymentSession:
        pass

    @abstractmethod
    def verify_webhook_signature(self, headers: dict[str, str], body: bytes) -> bool:
        pass

    @abstractmethod
    def parse_webhook_event(
        self, headers: dict[str, str], body: bytes
    ) -> PaymentWebhookEvent:
        pass

    @abstractmethod
    def refund(self, payment: Payment, amount: Decimal) -> dict[str, Any]:
        pass


class MockPaymentProvider(BasePaymentProvider):
    provider_name = "mock"

    def create_payment_session(
        self, payment: Payment, return_url: str, cancel_url: str
    ) -> PaymentSession:
        transaction_id = payment.transaction_id or f"mock_tx_{uuid.uuid4().hex}"  # type: ignore[arg-type]
        checkout_url = (
            f"{settings.FRONTEND_URL}/bookings"
            f"?mock_payment={payment.id}&tx={transaction_id}"
        )
        return PaymentSession(
            transaction_id=transaction_id,  # type: ignore[arg-type]
            checkout_url=checkout_url,
            provider_payment_id=transaction_id,  # type: ignore[arg-type]
        )

    def verify_webhook_signature(self, headers: dict[str, str], body: bytes) -> bool:
        return True

    def parse_webhook_event(
        self, headers: dict[str, str], body: bytes
    ) -> PaymentWebhookEvent:
        try:
            data = json.loads(body or b"{}")
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=400, detail="Invalid webhook payload"
            ) from exc

        transaction_id = data.get("transaction_id") or data.get("provider_payment_id")
        status = data.get("status")
        if not transaction_id or status not in {
            "success",
            "succeeded",
            "failed",
            "cancelled",
            "refunded",
            "completed",
        }:
            raise HTTPException(status_code=400, detail="Invalid webhook payload")

        normalized = {
            "success": "succeeded",
            "completed": "succeeded",
        }.get(status, status)
        return PaymentWebhookEvent(
            transaction_id=transaction_id,
            status=normalized,
            failure_reason=data.get("failure_reason"),
            raw=data,
        )

    def refund(self, payment: Payment, amount: Decimal) -> dict[str, Any]:
        return {
            "provider": self.provider_name,
            "refund_id": f"mock_refund_{uuid.uuid4().hex}",
            "amount": str(amount),
        }


class _ProviderStub(BasePaymentProvider):
    provider_name = "stub"

    def create_payment_session(
        self, payment: Payment, return_url: str, cancel_url: str
    ) -> PaymentSession:
        raise HTTPException(
            status_code=503,
            detail=f"{self.provider_name} provider is not configured yet",
        )

    def verify_webhook_signature(self, headers: dict[str, str], body: bytes) -> bool:
        return False

    def parse_webhook_event(
        self, headers: dict[str, str], body: bytes
    ) -> PaymentWebhookEvent:
        raise HTTPException(
            status_code=503,
            detail=f"{self.provider_name} webhook parsing is not implemented yet",
        )

    def refund(self, payment: Payment, amount: Decimal) -> dict[str, Any]:
        raise HTTPException(
            status_code=503,
            detail=f"{self.provider_name} refunds are not implemented yet",
        )


class PayriffPaymentProvider(_ProviderStub):
    provider_name = "payriff"


class KapitalPaymentProvider(_ProviderStub):
    provider_name = "kapital"


class StripePaymentProvider(BasePaymentProvider):
    provider_name = "stripe"

    def __init__(self):
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_payment_session(
        self, payment: Payment, return_url: str, cancel_url: str
    ) -> PaymentSession:
        import stripe

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": settings.PAYMENT_CURRENCY.lower(),
                            "product_data": {
                                "name": "Yolustu Ride Booking",
                                "description": f"Booking ID: {payment.booking_id}",
                            },
                            "unit_amount": int(payment.amount * 100),
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=return_url,
                cancel_url=cancel_url,
                client_reference_id=str(payment.id),
                metadata={
                    "payment_id": str(payment.id),
                    "booking_id": str(payment.booking_id),
                },
            )
            return PaymentSession(
                transaction_id=session.id,
                checkout_url=session.url,
                provider_payment_id=session.id,
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(exc)}")

    def verify_webhook_signature(self, headers: dict[str, str], body: bytes) -> bool:
        import stripe

        signature = headers.get("Stripe-Signature") or headers.get("stripe-signature")
        if not signature:
            return False
        try:
            stripe.WebhookSignature.verify_header(
                body,
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
            return True
        except stripe.error.SignatureVerificationError:
            return False

    def parse_webhook_event(
        self, headers: dict[str, str], body: bytes
    ) -> PaymentWebhookEvent:
        import stripe

        signature = headers.get("Stripe-Signature") or headers.get("stripe-signature")
        event = stripe.Webhook.construct_event(
            body, signature, settings.STRIPE_WEBHOOK_SECRET
        )

        status_mapping = {
            "checkout.session.completed": "succeeded",
            "checkout.session.async_payment_failed": "failed",
            "charge.refunded": "refunded",
        }

        if event.type not in status_mapping:
            return PaymentWebhookEvent(
                transaction_id="",
                status="ignored",
                raw=event.to_dict(),
                event_id=getattr(event, "id", None),
            )

        obj = event.data.object
        transaction_id = obj.get("id")

        return PaymentWebhookEvent(
            transaction_id=transaction_id,
            status=status_mapping[event.type],
            failure_reason=None,
            raw=event.to_dict(),
            event_id=getattr(event, "id", None),
        )

    def refund(self, payment: Payment, amount: Decimal) -> dict[str, Any]:
        import stripe

        try:
            # Note: Refunds in Stripe require the PaymentIntent ID.
            # In checkout.session.completed, we would store the payment_intent on the payment,
            # but for mock purposes we just attempt to refund via payment_intent if present.
            session = stripe.checkout.Session.retrieve(payment.provider_payment_id)
            payment_intent = session.payment_intent

            refund = stripe.Refund.create(
                payment_intent=payment_intent,
                amount=int(amount * 100),
            )
            return {
                "provider": self.provider_name,
                "refund_id": refund.id,
                "amount": str(amount),
            }
        except Exception as exc:
            raise HTTPException(
                status_code=500, detail=f"Stripe refund error: {str(exc)}"
            )


def get_payment_provider(provider: str | None = None) -> BasePaymentProvider:
    selected = (provider or settings.PAYMENT_PROVIDER or "mock").lower()
    if selected == "mock":
        return MockPaymentProvider()
    if selected == "payriff":
        return PayriffPaymentProvider()
    if selected == "kapital":
        return KapitalPaymentProvider()
    if selected == "stripe":
        return StripePaymentProvider()
    raise HTTPException(
        status_code=400, detail=f"Unsupported payment provider: {selected}"
    )
