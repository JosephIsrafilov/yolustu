import asyncio
from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone

from app.domains.gamification.services import (
    check_and_award_badge,
    check_and_award_badge_async,
)
from app.domains.gamification.models import Badge, UserBadge


def test_check_and_award_badge_db_none():
    assert check_and_award_badge(None, uuid4(), "newcomer") is None


def test_check_and_award_badge_already_existing():
    db_mock = MagicMock()
    user_id = uuid4()

    existing_badge = UserBadge(user_id=user_id, badge_id=uuid4())
    db_mock.query.return_value.join.return_value.filter.return_value.first.return_value = existing_badge

    res = check_and_award_badge(db_mock, user_id, "newcomer")
    assert res is None
    db_mock.query.assert_called_once_with(UserBadge)


def test_check_and_award_badge_not_found_badge():
    db_mock = MagicMock()
    user_id = uuid4()

    def mock_query(model):
        m = MagicMock()
        if model == UserBadge:
            m.join.return_value.filter.return_value.first.return_value = None
        elif model == Badge:
            m.filter.return_value.first.return_value = None
        return m

    db_mock.query.side_effect = mock_query

    res = check_and_award_badge(db_mock, user_id, "newcomer")
    assert res is None


def test_check_and_award_badge_success():
    db_mock = MagicMock()
    user_id = uuid4()
    badge_id = uuid4()

    badge_obj = Badge(
        id=badge_id,
        code="newcomer",
        name="Newcomer Badge",
        description="First badge awarded",
        icon_url="http://badge.url",
        created_at=datetime.now(timezone.utc),
    )

    def mock_query(model):
        m = MagicMock()
        if model == UserBadge:
            m.join.return_value.filter.return_value.first.return_value = None
        elif model == Badge:
            m.filter.return_value.first.return_value = badge_obj
        return m

    db_mock.query.side_effect = mock_query

    with patch("app.domains.gamification.services.manager") as mock_ws_manager:
        res = check_and_award_badge(db_mock, user_id, "newcomer")
        assert res is not None
        assert res.user_id == user_id
        assert res.badge_id == badge_id
        db_mock.add.assert_called_once_with(res)
        db_mock.commit.assert_called_once()
        db_mock.refresh.assert_called_once_with(res)

        # Verify send_personal_notification_sync arguments safely
        mock_ws_manager.send_personal_notification_sync.assert_called_once()
        args, kwargs = mock_ws_manager.send_personal_notification_sync.call_args
        assert args[0] == user_id
        assert args[1]["type"] == "badge_unlocked"
        badge_payload = args[1]["badge"]
        assert badge_payload["id"] == str(badge_id)
        assert badge_payload["code"] == "newcomer"
        assert badge_payload["name"] == "Newcomer Badge"
        assert badge_payload["description"] == "First badge awarded"
        assert badge_payload["icon_url"] == "http://badge.url"
        assert "created_at" in badge_payload


def test_check_and_award_badge_async():
    db_mock = MagicMock()
    user_id = uuid4()
    with patch(
        "app.domains.gamification.services.check_and_award_badge", return_value="badge"
    ) as mock_sync:
        res = asyncio.run(check_and_award_badge_async(db_mock, user_id, "newcomer"))
        assert res == "badge"
        mock_sync.assert_called_once_with(db_mock, user_id, "newcomer")
