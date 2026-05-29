from uuid import UUID
from sqlalchemy.orm import Session
from .models import Badge, UserBadge
from .schemas import BadgeResponse
from app.core.websocket import manager


def check_and_award_badge(db: Session | None, user_id: UUID, badge_code: str):
    if db is None:
        return None

    existing = (
        db.query(UserBadge)
        .join(Badge)
        .filter(UserBadge.user_id == user_id, Badge.code == badge_code)
        .first()
    )

    if existing:
        return None

    badge = db.query(Badge).filter(Badge.code == badge_code).first()
    if not badge:
        return None

    user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
    db.add(user_badge)
    db.commit()
    db.refresh(user_badge)

    # send notification
    badge_data = BadgeResponse.model_validate(badge).model_dump(mode="json")

    manager.send_personal_notification_sync(
        user_id, {"type": "badge_unlocked", "badge": badge_data}
    )

    return user_badge


async def check_and_award_badge_async(
    db: Session | None, user_id: UUID, badge_code: str
):
    # Sometimes we are in an async context but db is sync, so we can wrap the sync logic
    return check_and_award_badge(db, user_id, badge_code)
