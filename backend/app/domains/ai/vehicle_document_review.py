"""AI pre-screening for vehicle documents (registration, insurance, inspection).

Advisory only — humans always make the final approve/reject decision.
Degrades to needs_review on any failure.
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

VLM_MODEL = "meta/llama-3.2-90b-vision-instruct"
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
REQUEST_TIMEOUT = 30.0

SUPPORTED_IMAGE_MIME = {"image/jpeg", "image/png"}

DOCUMENT_TYPE_LABELS = {
    "registration": "vehicle registration certificate (texniki pasport)",
    "insurance": "vehicle insurance policy (OSAGO/sığorta)",
    "inspection": "vehicle technical inspection certificate (texniki baxış)",
}

APPROVAL_CONFIDENCE = 0.85


def _needs_review(reason: str) -> dict[str, Any]:
    return {
        "recommendation": "needs_review",
        "confidence": 0.0,
        "is_document": None,
        "is_azerbaijani": None,
        "document_type_detected": None,
        "plate_number": None,
        "expiry_date": None,
        "is_expired": None,
        "visible_text": [],
        "issues": [reason],
        "model": None,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }


def _parse_model_output(text: str) -> dict[str, Any]:
    clean = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*\}", clean, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError("Could not parse JSON from model response")


def _normalize(data: dict[str, Any], expected_type: str) -> dict[str, Any]:
    try:
        confidence = float(data.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    raw_issues = data.get("issues") or []
    issues = [str(i) for i in raw_issues] if isinstance(raw_issues, list) else []

    def _opt_bool(v: Any) -> bool | None:
        return v if isinstance(v, bool) else None

    def _add(issue: str) -> None:
        if issue not in issues:
            issues.append(issue)

    is_document = _opt_bool(data.get("is_document"))
    is_azerbaijani = _opt_bool(data.get("is_azerbaijani"))
    is_expired = _opt_bool(data.get("is_expired"))
    document_type_detected = (
        str(data.get("document_type_detected") or "").strip().lower() or None
    )
    plate_number = str(data.get("plate_number") or "").strip() or None
    raw_vt = data.get("visible_text") or []
    visible_text = (
        [str(i).strip() for i in raw_vt if str(i).strip()]
        if isinstance(raw_vt, list)
        else []
    )

    rejection = False
    incomplete = False

    if is_document is False:
        _add("not_a_document")
        rejection = True
    elif is_document is None:
        _add("document_not_confirmed")
        incomplete = True

    if is_azerbaijani is False:
        _add("not_azerbaijani")
        rejection = True
    elif is_azerbaijani is None:
        _add("country_not_confirmed")
        incomplete = True

    if document_type_detected and document_type_detected != expected_type:
        _add("document_type_mismatch")
        incomplete = True
    elif not document_type_detected:
        _add("document_type_unreadable")
        incomplete = True

    if is_expired is True:
        _add("expired")
        rejection = True
    elif is_expired is None:
        _add("expiry_not_confirmed")
        incomplete = True

    if confidence < APPROVAL_CONFIDENCE:
        _add("low_confidence")
        incomplete = True

    recommendation = (
        "reject" if rejection else "needs_review" if incomplete else "approve"
    )

    return {
        "recommendation": recommendation,
        "confidence": round(confidence, 3),
        "is_document": is_document,
        "is_azerbaijani": is_azerbaijani,
        "document_type_detected": document_type_detected,
        "plate_number": plate_number,
        "expiry_date": data.get("expiry_date") or None,
        "is_expired": is_expired,
        "visible_text": visible_text,
        "issues": issues,
        "model": VLM_MODEL,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_prompt(document_type: str) -> str:
    label = DOCUMENT_TYPE_LABELS.get(document_type, document_type)
    return (
        f"You are a document pre-screening assistant for the Yolmates carpooling platform in Azerbaijan. "
        f"A driver uploaded an image as vehicle document evidence. "
        f"The expected document type is: {label}.\n\n"
        "Inspect only what is visibly present. Never invent text.\n\n"
        "Return ONLY a valid JSON object, no prose, no markdown:\n"
        "{\n"
        '  "is_document": <true if this looks like an official document, false otherwise>,\n'
        '  "is_azerbaijani": <true if it is an Azerbaijani document, false otherwise>,\n'
        f'  "document_type_detected": "<{document_type} | unknown>",\n'
        '  "plate_number": "<vehicle plate number if visible, else null>",\n'
        '  "expiry_date": "<YYYY-MM-DD if visible, else null>",\n'
        '  "is_expired": <true/false/null>,\n'
        '  "visible_text": ["key readable snippets proving document identity"],\n'
        '  "confidence": <0.0-1.0>,\n'
        '  "issues": ["short flags e.g. blurry, expired, wrong_document_type"]\n'
        "}"
    )


def review_vehicle_document(
    image_bytes: bytes,
    mime_type: str,
    document_type: str,
) -> dict[str, Any]:
    """Pre-screen a vehicle document image. Returns advisory verdict dict."""
    if not settings.NVIDIA_API_KEY:
        return _needs_review("ai_unavailable")

    if (mime_type or "").lower() not in SUPPORTED_IMAGE_MIME:
        return _needs_review("unsupported_format")

    try:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=settings.NVIDIA_API_KEY)
        messages: list[Any] = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _build_prompt(document_type)},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                    },
                ],
            }
        ]
        try:
            completion = client.chat.completions.create(
                model=VLM_MODEL,
                messages=messages,
                temperature=0.0,
                max_tokens=500,
                timeout=REQUEST_TIMEOUT,
                stream=False,
                response_format={"type": "json_object"},
            )
        except Exception:
            completion = client.chat.completions.create(
                model=VLM_MODEL,
                messages=messages,
                temperature=0.0,
                max_tokens=500,
                timeout=REQUEST_TIMEOUT,
                stream=False,
            )
        content = (completion.choices[0].message.content or "").strip()
        data = _parse_model_output(content)
        return _normalize(data, document_type)
    except Exception as exc:
        logger.warning("AI vehicle document review failed: %s", exc)
        return _needs_review("ai_error")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run_vehicle_document_review_task(
    image_bytes: bytes,
    mime_type: str,
    document_id: str,
    document_type: str,
    storage_key: str,
) -> None:
    """Background task: review bytes and persist AI result to VehicleDocument.

    Opens its own DB session. Swallows all errors — upload must never fail
    because pre-screening failed.
    """
    from uuid import UUID

    from app.core.database import SessionLocal
    from app.domains.trips.models import VehicleDocument

    review = review_vehicle_document(image_bytes, mime_type, document_type)

    db = SessionLocal()
    try:
        doc = db.get(VehicleDocument, UUID(document_id))
        if doc is not None and doc.storage_key == storage_key:
            doc.ai_recommendation = review.get("recommendation")  # type: ignore[assignment]
            doc.ai_confidence = review.get("confidence")  # type: ignore[assignment]
            doc.ai_issues = review.get("issues")  # type: ignore[assignment]
            doc.ai_metadata = {
                k: v
                for k, v in review.items()
                if k not in ("recommendation", "confidence", "issues")
            }
            doc.processing_status = "completed"  # type: ignore[assignment]
            db.commit()
    except Exception as exc:
        logger.warning(
            "AI vehicle review persist failed for doc %s: %s", document_id, exc
        )
        db.rollback()
    finally:
        db.close()
