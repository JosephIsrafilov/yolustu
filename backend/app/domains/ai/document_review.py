"""AI pre-screening for driver verification documents.

Sends an uploaded license/ID image to an NVIDIA-hosted vision-language model
(same OpenAI-compatible seam as the pricing route) and returns a structured,
advisory verdict. This NEVER changes verification_status on its own — a human
admin always makes the final approve/reject decision. On any failure (no key,
timeout, bad JSON, unsupported file) it degrades gracefully to "needs_review".
"""

from __future__ import annotations

import base64
import json
import logging
import re
import unicodedata
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

VLM_MODEL = "meta/llama-3.2-11b-vision-instruct"
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
REQUEST_TIMEOUT = 30.0

# VLMs read raster images, not PDFs. PDF uploads skip AI and go to manual review.
SUPPORTED_IMAGE_MIME = {"image/jpeg", "image/png"}

VALID_DOCUMENT_TYPES = {"drivers_license"}
APPROVAL_CONFIDENCE = 0.9


def _needs_review(reason: str) -> dict[str, Any]:
    """Fallback verdict when AI is unavailable or fails. Admin handles manually."""
    return {
        "recommendation": "needs_review",
        "confidence": 0.0,
        "is_document": None,
        "is_azerbaijani": None,
        "document_type": None,
        "extracted_name": None,
        "expiry_date": None,
        "name_matches_profile": None,
        "is_expired": None,
        "portrait_present": None,
        "document_number_present": None,
        "license_title_present": None,
        "license_categories": [],
        "image_dimensions": None,
        "image_geometry_plausible": None,
        "visible_text": [],
        "issues": [reason],
        "model": None,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }


def _coerce_scalar(raw: str) -> Any:
    """Turn a markdown value string into bool/None/number/list/str."""
    v = raw.strip().strip(",").strip()
    # strip surrounding quotes/backticks
    if len(v) >= 2 and v[0] in "\"'`" and v[-1] in "\"'`":
        v = v[1:-1].strip()
    low = v.lower()
    if low in {"true", "yes"}:
        return True
    if low in {"false", "no"}:
        return False
    if low in {"null", "none", "n/a", "", "unknown"}:
        return None
    # list e.g. ["a", "b"]
    if v.startswith("[") and v.endswith("]"):
        try:
            return json.loads(v)
        except json.JSONDecodeError:
            inner = v[1:-1]
            return [p.strip().strip("\"'") for p in inner.split(",") if p.strip()]
    try:
        return float(v) if "." in v else int(v)
    except ValueError:
        return v


def _parse_markdown_block(text: str) -> dict[str, Any]:
    """Fallback: parse `**key**: value` or `key: value` lines the model emits
    when it ignores the JSON-only instruction. Returns {} if nothing matched."""
    result: dict[str, Any] = {}
    keys = {
        "is_document",
        "document_type",
        "extracted_name",
        "expiry_date",
        "name_matches_profile",
        "is_expired",
        "is_azerbaijani",
        "portrait_present",
        "document_number_present",
        "license_title_present",
        "license_categories",
        "visible_text",
        "confidence",
        "issues",
        "recommendation",
    }
    # matches: optional **/__/quotes around key, then : value (rest of line)
    pattern = re.compile(
        r"^\s*[*_\"'`#-]*\s*([a-zA-Z_ ]+?)\s*[*_\"'`]*\s*[:=]\s*(.+?)\s*$",
        re.MULTILINE,
    )
    for raw_key, raw_val in pattern.findall(text):
        key = raw_key.strip().lower().replace(" ", "_")
        if key in keys and key not in result:
            result[key] = _coerce_scalar(raw_val)
    return result


def _parse_model_output(text: str) -> dict[str, Any]:
    """Parse model output: strict JSON first, then markdown fallback."""
    clean = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*\}", clean, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    parsed = _parse_markdown_block(clean)
    if parsed:
        return parsed
    raise ValueError("Could not parse JSON or key-value pairs from model response")


def _normalize_name(value: str) -> list[str]:
    transliterated = value.lower().translate(
        str.maketrans(
            {
                "ə": "a",
                "ö": "o",
                "ü": "u",
                "ç": "c",
                "ş": "s",
                "ğ": "g",
                "ı": "i",
            }
        )
    )
    decomposed = unicodedata.normalize("NFKD", transliterated)
    ascii_text = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.findall(r"[a-z0-9]+", ascii_text)


def _name_matches(
    extracted_name: str | None, first_name: str, last_name: str
) -> bool | None:
    if not extracted_name:
        return None
    claimed = _normalize_name(f"{first_name} {last_name}")
    extracted = set(_normalize_name(extracted_name))
    if not claimed or not extracted:
        return None
    return all(token in extracted for token in claimed)


def _has_azerbaijani_marker(visible_text: list[str]) -> bool:
    normalized = " ".join(_normalize_name(" ".join(visible_text)))
    markers = {
        "aze",
        "azarbaycan",
        "azerbaycan",
        "azerbaijan",
        "azarbaycan respublikasi",
        "azerbaycan respublikasi",
        "republic of azerbaijan",
        "suruculuk vasiqasi",
        "suruculuk vesiqesi",
        "sexsiyyat vasiqasi",
        "sexsiyyet vesiqesi",
    }
    words = set(normalized.split())
    return any(
        marker in normalized if " " in marker else marker in words for marker in markers
    )


def _image_dimensions(image_bytes: bytes, mime_type: str) -> tuple[int, int] | None:
    if mime_type == "image/png" and image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        if len(image_bytes) >= 24:
            width = int.from_bytes(image_bytes[16:20], "big")
            height = int.from_bytes(image_bytes[20:24], "big")
            return (width, height) if width and height else None
        return None

    if mime_type != "image/jpeg" or not image_bytes.startswith(b"\xff\xd8"):
        return None

    offset = 2
    sof_markers = {
        0xC0,
        0xC1,
        0xC2,
        0xC3,
        0xC5,
        0xC6,
        0xC7,
        0xC9,
        0xCA,
        0xCB,
        0xCD,
        0xCE,
        0xCF,
    }
    while offset + 4 <= len(image_bytes):
        if image_bytes[offset] != 0xFF:
            offset += 1
            continue
        marker = image_bytes[offset + 1]
        offset += 2
        if marker in {0xD8, 0xD9}:
            continue
        if offset + 2 > len(image_bytes):
            break
        segment_length = int.from_bytes(image_bytes[offset : offset + 2], "big")
        if segment_length < 2 or offset + segment_length > len(image_bytes):
            break
        if marker in sof_markers and segment_length >= 7:
            height = int.from_bytes(image_bytes[offset + 3 : offset + 5], "big")
            width = int.from_bytes(image_bytes[offset + 5 : offset + 7], "big")
            return (width, height) if width and height else None
        offset += segment_length
    return None


def _plausible_document_geometry(dimensions: tuple[int, int] | None) -> bool | None:
    if dimensions is None:
        return None
    width, height = dimensions
    long_side, short_side = max(width, height), min(width, height)
    aspect_ratio = long_side / short_side
    return short_side >= 180 and long_side >= 300 and 1.2 <= aspect_ratio <= 2.2


def _normalize(
    data: dict[str, Any],
    first_name: str,
    last_name: str,
    *,
    image_dimensions: tuple[int, int] | None = None,
) -> dict[str, Any]:
    """Coerce observations and compute a fail-closed server-side recommendation."""
    try:
        confidence = float(data.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    raw_issues = data.get("issues") or []
    if isinstance(raw_issues, str):
        raw_issues = [raw_issues]
    issues = [str(item) for item in raw_issues] if isinstance(raw_issues, list) else []

    def _opt_bool(value: Any) -> bool | None:
        if isinstance(value, bool):
            return value
        return None

    def _add_issue(issue: str) -> None:
        if issue not in issues:
            issues.append(issue)

    is_document = _opt_bool(data.get("is_document"))
    is_azerbaijani = _opt_bool(data.get("is_azerbaijani"))
    is_expired = _opt_bool(data.get("is_expired"))
    portrait_present = _opt_bool(data.get("portrait_present"))
    document_number_present = _opt_bool(data.get("document_number_present"))
    license_title_present = _opt_bool(data.get("license_title_present"))
    document_type = str(data.get("document_type") or "").strip().lower() or None
    extracted_name = str(data.get("extracted_name") or "").strip() or None
    name_matches_profile = _name_matches(extracted_name, first_name, last_name)
    raw_categories = data.get("license_categories") or []
    license_categories = (
        [str(item).strip().upper() for item in raw_categories if str(item).strip()]
        if isinstance(raw_categories, list)
        else []
    )
    raw_visible_text = data.get("visible_text") or []
    visible_text = (
        [str(item).strip() for item in raw_visible_text if str(item).strip()]
        if isinstance(raw_visible_text, list)
        else []
    )

    rejection = False
    incomplete = False
    image_geometry_plausible = _plausible_document_geometry(image_dimensions)

    if is_document is False:
        _add_issue("not_a_document")
        rejection = True
    elif is_document is None:
        _add_issue("document_not_confirmed")
        incomplete = True

    if is_azerbaijani is False:
        _add_issue("not_azerbaijani")
        rejection = True
    elif is_azerbaijani is None:
        _add_issue("country_not_confirmed")
        incomplete = True

    if document_type not in VALID_DOCUMENT_TYPES:
        _add_issue("unsupported_document_type")
        incomplete = True

    if name_matches_profile is False:
        _add_issue("name_mismatch")
        rejection = True
    elif name_matches_profile is None:
        _add_issue("name_not_readable")
        incomplete = True

    if is_expired is True:
        _add_issue("expired")
        rejection = True
    elif is_expired is None:
        _add_issue("expiry_not_confirmed")
        incomplete = True

    if portrait_present is False:
        _add_issue("portrait_missing")
        rejection = True
    elif portrait_present is None:
        _add_issue("portrait_not_confirmed")
        incomplete = True

    if document_number_present is False:
        _add_issue("document_number_missing")
        rejection = True
    elif document_number_present is None:
        _add_issue("document_number_not_confirmed")
        incomplete = True

    if license_title_present is False:
        _add_issue("license_title_missing")
        rejection = True
    elif license_title_present is None:
        _add_issue("license_title_not_confirmed")
        incomplete = True

    if not license_categories:
        _add_issue("license_category_not_readable")
        incomplete = True

    if image_geometry_plausible is False:
        _add_issue("implausible_document_geometry")
        incomplete = True
    elif image_geometry_plausible is None:
        _add_issue("image_dimensions_unreadable")
        incomplete = True

    if not visible_text or not _has_azerbaijani_marker(visible_text):
        _add_issue("country_marker_not_readable")
        incomplete = True

    if confidence < APPROVAL_CONFIDENCE:
        _add_issue("low_confidence")
        incomplete = True

    recommendation = (
        "reject" if rejection else "needs_review" if incomplete else "approve"
    )

    return {
        "recommendation": recommendation,
        "confidence": round(confidence, 2),
        "is_document": is_document,
        "is_azerbaijani": is_azerbaijani,
        "document_type": document_type,
        "extracted_name": extracted_name,
        "expiry_date": data.get("expiry_date") or None,
        "name_matches_profile": name_matches_profile,
        "is_expired": is_expired,
        "portrait_present": portrait_present,
        "document_number_present": document_number_present,
        "license_title_present": license_title_present,
        "license_categories": license_categories,
        "image_dimensions": (
            {"width": image_dimensions[0], "height": image_dimensions[1]}
            if image_dimensions
            else None
        ),
        "image_geometry_plausible": image_geometry_plausible,
        "visible_text": visible_text,
        "issues": issues,
        "model": VLM_MODEL,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_prompt() -> str:
    return (
        "You are a KYC pre-screening assistant for the Yolmates carpooling "
        "platform in Azerbaijan. A user is applying to become a verified driver "
        "and uploaded an image as identity evidence.\n\n"
        "You ONLY accept an official Azerbaijani driver's licence. A national ID "
        "card, passport, logo, screenshot, selfie, or unrelated image is not valid "
        "driver evidence.\n\n"
        "Recognize both common Azerbaijani licence layouts:\n"
        "1. Modern layout: pink/lilac landscape card with AZ/flag, the headings "
        "'AZƏRBAYCAN RESPUBLİKASI', 'SÜRÜCÜLÜK VƏSİQƏSİ', 'Republic of Azerbaijan' "
        "and 'Driving licence', numbered fields such as 1, 2, 3, 4a-4d, 5-9, "
        "holder portrait, licence number and vehicle categories.\n"
        "2. Legacy layout: grey/blue two-sided landscape card with holder portrait, "
        "oval AZ and flag, multilingual driving-licence heading on the front, and "
        "issued/validity dates plus categories A/B/C/D/E on the reverse.\n\n"
        "Inspect only what is visibly present. Never infer or invent a name, "
        "document number, country marker, portrait, or expiry value. Transcribe "
        "visible text exactly as it appears.\n\n"
        "Return ONLY a valid JSON object, no prose, no markdown, EXACTLY these keys:\n"
        "{\n"
        '  "is_document": <true if image is an ID/licence/passport, false if selfie/random/blurry>,\n'
        '  "is_azerbaijani": <true if it is an Azerbaijani document, false otherwise>,\n'
        '  "document_type": "<drivers_license | unknown>",\n'
        '  "extracted_name": "<full name visible on the document, or null>",\n'
        '  "expiry_date": "<YYYY-MM-DD if visible, else null>",\n'
        '  "is_expired": <true/false/null: is the document past its expiry date>,\n'
        '  "portrait_present": <true/false/null>,\n'
        '  "document_number_present": <true/false/null>,\n'
        '  "license_title_present": <true only if a driving-licence heading is readable>,\n'
        '  "license_categories": ["readable categories such as A, B, C, D, E"],\n'
        '  "visible_text": ["exact readable snippets proving document and country"],\n'
        '  "confidence": <0.0-1.0 confidence in this assessment>,\n'
        '  "issues": ["short flags e.g. blurry, cropped, expired, name_mismatch, '
        'not_a_document, not_azerbaijani, foreign_document"]\n'
        "}\n\n"
        "Rules:\n"
        "- A logo, screenshot, selfie, blank template, ID card, passport, or unrelated "
        "image is not acceptable driver evidence.\n"
        "- Set a field to null when it is not clearly visible.\n"
        "- visible_text must contain only text you can actually read in the image.\n"
        "- If not Azerbaijani, set is_azerbaijani=false and add not_azerbaijani."
    )


def review_verification_document(
    image_bytes: bytes,
    mime_type: str,
    first_name: str,
    last_name: str,
) -> dict[str, Any]:
    """Pre-screen a verification document. Returns an advisory verdict dict.

    Always returns a dict; degrades to needs_review on any failure.
    """
    if not settings.NVIDIA_API_KEY:
        return _needs_review("ai_unavailable")

    mime = (mime_type or "").lower()
    if mime not in SUPPORTED_IMAGE_MIME:
        return _needs_review("unsupported_format")

    try:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=settings.NVIDIA_API_KEY)
        completion = client.chat.completions.create(
            model=VLM_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": _build_prompt()},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{b64}"},
                        },
                    ],
                }
            ],
            temperature=0.2,
            max_tokens=400,
            timeout=REQUEST_TIMEOUT,
            stream=False,
        )
        content = (completion.choices[0].message.content or "").strip()
        data = _parse_model_output(content)
        return _normalize(
            data,
            first_name,
            last_name,
            image_dimensions=_image_dimensions(image_bytes, mime),
        )
    except Exception as exc:  # noqa: BLE001 - any failure degrades to manual review
        logger.warning("AI document review failed, falling back to manual: %s", exc)
        return _needs_review("ai_error")


def run_document_review_task(
    file_path: str,
    mime_type: str,
    user_id: str,
    first_name: str,
    last_name: str,
) -> None:
    """Background task: read stored doc, run AI review, persist to the user.

    Opens its own DB session (the request session is closed by the time this
    runs). Swallows all errors — verification submission must never fail because
    pre-screening failed.
    """
    from uuid import UUID

    from app.core.database import SessionLocal
    from app.domains.identity.models import User

    try:
        with open(file_path, "rb") as f:
            image_bytes = f.read()
    except OSError as exc:
        logger.warning("AI review could not read %s: %s", file_path, exc)
        review = _needs_review("file_unreadable")
        image_bytes = b""
    else:
        review = review_verification_document(
            image_bytes, mime_type, first_name, last_name
        )

    db = SessionLocal()
    try:
        user = db.get(User, UUID(user_id))
        if user is not None:
            user.verification_ai_review = review
            db.commit()
    except Exception as exc:  # noqa: BLE001 - never raise from a background task
        logger.warning("AI review persist failed for user %s: %s", user_id, exc)
        db.rollback()
    finally:
        db.close()
