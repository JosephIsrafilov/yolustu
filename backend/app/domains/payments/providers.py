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
        transaction_id = payment.transaction_id or f"mock_tx_{uuid.uuid4().hex}"
        checkout_url = (
            f"{settings.FRONTEND_URL}/bookings"
            f"?mock_payment={payment.id}&tx={transaction_id}"
        )
        return PaymentSession(
            transaction_id=transaction_id,
            checkout_url=checkout_url,
            provider_payment_id=transaction_id,
        )

    def verify_webhook_signature(self, headers: dict[str, str], body: bytes) -> bool:
        return True

    def parse_webhook_event(
        self, headers: dict[str, str], body: bytes
    ) -> PaymentWebhookEvent:
        try:
            data = json.loads(body or b"{}")
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

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


def get_payment_provider(provider: str | None = None) -> BasePaymentProvider:
    selected = (provider or settings.PAYMENT_PROVIDER or "mock").lower()
    if selected == "mock":
        return MockPaymentProvider()
    if selected == "payriff":
        return PayriffPaymentProvider()
    if selected == "kapital":
        return KapitalPaymentProvider()
    raise HTTPException(status_code=400, detail=f"Unsupported payment provider: {selected}")
