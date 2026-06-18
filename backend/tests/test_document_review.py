import sys
import os
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.domains.ai import document_review as dr


def _mock_completion(content: str) -> MagicMock:
    completion = MagicMock()
    completion.choices = [MagicMock(message=MagicMock(content=content))]
    return completion


def _png_image(width: int = 800, height: int = 520) -> bytes:
    return (
        b"\x89PNG\r\n\x1a\n"
        + b"\x00\x00\x00\rIHDR"
        + width.to_bytes(4, "big")
        + height.to_bytes(4, "big")
    )


def test_no_api_key_returns_needs_review(monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "")
    result = dr.review_verification_document(b"x", "image/jpeg", "Elvin", "Mammadov")
    assert result["recommendation"] == "needs_review"
    assert result["confidence"] == 0.0
    assert "ai_unavailable" in result["issues"]


def test_pdf_unsupported_format(monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    result = dr.review_verification_document(b"%PDF", "application/pdf", "A", "B")
    assert result["recommendation"] == "needs_review"
    assert "unsupported_format" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_successful_review_parsed_and_normalized(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        '{"is_document": true, "is_azerbaijani": true, '
        '"document_type": "drivers_license", '
        '"extracted_name": "Elvin Mammadov", "expiry_date": "2030-01-01", '
        '"is_expired": false, "portrait_present": true, '
        '"document_number_present": true, '
        '"license_title_present": true, "license_categories": ["B"], '
        '"visible_text": ["AZƏRBAYCAN", "Sürücülük vəsiqəsi"], '
        '"confidence": 0.91, "issues": [], "recommendation": "approve"}'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(
        _png_image(), "image/png", "Elvin", "Mammadov"
    )

    assert result["recommendation"] == "approve"
    assert result["confidence"] == 0.91
    assert result["is_document"] is True
    assert result["document_type"] == "drivers_license"
    assert result["name_matches_profile"] is True
    assert result["is_expired"] is False
    assert result["model"] == dr.VLM_MODEL


@patch("app.domains.ai.document_review.OpenAI")
def test_invalid_recommendation_coerced(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = '{"confidence": 5, "recommendation": "definitely_yes"}'
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(b"img", "image/jpeg", "A", "B")

    assert result["recommendation"] == "needs_review"
    assert result["confidence"] == 1.0  # clamped to [0,1]


@patch("app.domains.ai.document_review.OpenAI")
def test_json_in_markdown_fence(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        '```json\n{"is_document": false, "recommendation": "approve", '
        '"confidence": 0.2}\n```'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(b"img", "image/jpeg", "A", "B")

    assert result["recommendation"] == "reject"
    assert "not_a_document" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_json_after_answer_prefix_is_parsed(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        "The image appears valid.\n\n"
        '*Answer*: {"is_document": true, "is_azerbaijani": true, '
        '"document_type": "drivers_license", "confidence": 0.95, '
        '"issues": [], "recommendation": "approve"}'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(
        _png_image(), "image/png", "Elvin", "Mammadov"
    )

    assert result["is_document"] is True
    assert result["confidence"] == 0.95


@patch("app.domains.ai.document_review.OpenAI")
def test_prose_only_vision_response_is_conservatively_parsed(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        "The image is a valid Azerbaijani driver's license. "
        'The text "AZƏRBAYCAN RESPUBLİKASI" is visible. '
        "The portrait, license number, and categories A, B, C are present. "
        "The license is not expired.\n\n**Answer:** true"
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(
        _png_image(), "image/png", "Elvin", "Mammadov"
    )

    assert result["is_document"] is True
    assert result["is_azerbaijani"] is True
    assert result["document_type"] == "drivers_license"
    assert result["portrait_present"] is True
    assert result["document_number_present"] is True
    assert result["license_categories"] == ["A", "B", "C"]
    assert result["recommendation"] == "needs_review"
    assert "structured_output_unavailable" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_api_failure_falls_back(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    mock_openai.return_value.chat.completions.create.side_effect = Exception("boom")

    result = dr.review_verification_document(b"img", "image/jpeg", "A", "B")

    assert result["recommendation"] == "needs_review"
    assert "ai_error" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_garbage_response_falls_back(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        "I cannot help with that."
    )

    result = dr.review_verification_document(b"img", "image/jpeg", "A", "B")

    assert result["recommendation"] == "needs_review"
    assert "ai_error" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_markdown_keyvalue_output_is_parsed(mock_openai, monkeypatch):
    """11B vision model often ignores 'JSON only' and emits **key**: value."""
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        "Based on the image, I assess the document as follows:\n\n"
        "**is_document**: true\n"
        "**is_azerbaijani**: false\n"
        "**document_type**: unknown\n"
        "**extracted_name**: null\n"
        "**name_matches_profile**: null\n"
        "**confidence**: 0.0\n"
        '**issues**: ["not_a_document", "name_mismatch"]\n'
        "**recommendation**: needs_review\n"
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(b"img", "image/png", "Test", "User")

    # parsed, NOT ai_error
    assert "ai_error" not in result["issues"]
    assert result["is_azerbaijani"] is False
    # non-AZ safety net forces reject + flag
    assert result["recommendation"] == "reject"
    assert "not_azerbaijani" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_non_azerbaijani_document_downgraded_from_approve(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        '{"is_document": true, "is_azerbaijani": false, '
        '"document_type": "drivers_license", "extracted_name": "John Smith", '
        '"name_matches_profile": true, "confidence": 0.95, "issues": [], '
        '"recommendation": "approve"}'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(b"img", "image/jpeg", "John", "Smith")

    # model said approve, but it is not Azerbaijani -> safety net rejects
    assert result["recommendation"] == "reject"
    assert "not_azerbaijani" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_valid_azerbaijani_document_approved(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        '{"is_document": true, "is_azerbaijani": true, '
        '"document_type": "drivers_license", "extracted_name": "Elvin Mammadov", '
        '"is_expired": false, "portrait_present": true, '
        '"document_number_present": true, '
        '"license_title_present": true, "license_categories": ["B"], '
        '"visible_text": ["AZƏRBAYCAN", "Sürücülük vəsiqəsi"], "confidence": 0.9, '
        '"issues": [], "recommendation": "approve"}'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(
        _png_image(), "image/png", "Elvin", "Mammadov"
    )

    assert result["recommendation"] == "approve"
    assert result["is_azerbaijani"] is True
    assert result["issues"] == []


@patch("app.domains.ai.document_review.OpenAI")
def test_random_logo_cannot_be_approved(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        '{"is_document": false, "is_azerbaijani": false, '
        '"document_type": "unknown", "extracted_name": null, '
        '"is_expired": null, "portrait_present": false, '
        '"document_number_present": false, "visible_text": ["Yolmates"], '
        '"confidence": 0.95, "issues": [], "recommendation": "approve"}'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(
        b"logo", "image/jpeg", "Yusif", "Israfilov"
    )

    assert result["recommendation"] == "reject"
    assert "not_a_document" in result["issues"]
    assert "not_azerbaijani" in result["issues"]
    assert result["name_matches_profile"] is None


@patch("app.domains.ai.document_review.OpenAI")
def test_claimed_name_is_not_sent_to_model(mock_openai, monkeypatch):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        '{"is_document": false, "confidence": 1}'
    )

    dr.review_verification_document(b"img", "image/jpeg", "Yusif", "Israfilov")

    call = mock_openai.return_value.chat.completions.create.call_args
    prompt = call.kwargs["messages"][0]["content"][0]["text"]
    assert "Yusif" not in prompt
    assert "Israfilov" not in prompt


def test_name_match_is_computed_server_side_with_azerbaijani_letters():
    data = {
        "is_document": True,
        "is_azerbaijani": True,
        "document_type": "drivers_license",
        "extracted_name": "Yusif İsrafilov",
        "is_expired": False,
        "portrait_present": True,
        "document_number_present": True,
        "license_title_present": True,
        "license_categories": ["B"],
        "visible_text": ["AZƏRBAYCAN RESPUBLİKASI"],
        "confidence": 0.95,
    }

    result = dr._normalize(data, "Yusif", "Israfilov", image_dimensions=(800, 520))

    assert result["recommendation"] == "approve"
    assert result["name_matches_profile"] is True


def test_national_id_cannot_auto_approve_driver_verification():
    data = {
        "is_document": True,
        "is_azerbaijani": True,
        "document_type": "national_id",
        "extracted_name": "Yusif Israfilov",
        "is_expired": False,
        "portrait_present": True,
        "document_number_present": True,
        "license_title_present": False,
        "license_categories": [],
        "visible_text": ["AZƏRBAYCAN RESPUBLİKASI"],
        "confidence": 0.99,
    }

    result = dr._normalize(data, "Yusif", "Israfilov", image_dimensions=(856, 540))

    assert result["recommendation"] == "reject"
    assert "unsupported_document_type" in result["issues"]
    assert "license_title_missing" in result["issues"]


@patch("app.domains.ai.document_review.OpenAI")
def test_square_logo_stays_manual_even_if_model_hallucinates_license(
    mock_openai, monkeypatch
):
    monkeypatch.setattr(dr.settings, "NVIDIA_API_KEY", "key")
    content = (
        '{"is_document": true, "is_azerbaijani": true, '
        '"document_type": "drivers_license", "extracted_name": "Yusif Israfilov", '
        '"is_expired": false, "portrait_present": true, '
        '"document_number_present": true, "license_title_present": true, '
        '"license_categories": ["B"], '
        '"visible_text": ["AZƏRBAYCAN", "SÜRÜCÜLÜK VƏSİQƏSİ"], '
        '"confidence": 0.99, "issues": [], "recommendation": "approve"}'
    )
    mock_openai.return_value.chat.completions.create.return_value = _mock_completion(
        content
    )

    result = dr.review_verification_document(
        _png_image(1024, 1024), "image/png", "Yusif", "Israfilov"
    )

    assert result["recommendation"] == "needs_review"
    assert result["image_geometry_plausible"] is False
    assert "implausible_document_geometry" in result["issues"]


def test_prompt_describes_modern_and_legacy_azerbaijani_licences():
    prompt = dr._build_prompt()

    assert "Modern layout" in prompt
    assert "pink/lilac" in prompt
    assert "Legacy layout" in prompt
    assert "two-sided" in prompt
    assert "national ID card, passport" in prompt
