from dataclasses import dataclass
from datetime import datetime, timezone
from typing import cast
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.identity.services import IdentityService


@dataclass
class FakeUser:
    id: UUID
    phone: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime
    verification_status: str = "none"
    document_url: str | None = None
    is_blocked: bool = False
    is_verified: bool = True
    rating: float = 5.0
    total_rides: int = 0
    avatar_url: str | None = None
    language: str = "az"
    city: str | None = None
    bio: str | None = None


class FakeUserRepository:
    def __init__(self, user: FakeUser):
        self.user = user

    def get_by_id(self, user_id: UUID) -> FakeUser | None:
        return self.user if self.user.id == user_id else None

    def update_verification_status(
        self, user: FakeUser, status: str, document_url: str | None = None
    ) -> FakeUser:
        user.verification_status = status
        if document_url is not None:
            user.document_url = document_url
        return user


def make_current_user(user_id: UUID, role: str = "driver") -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994500000000",
        first_name="Test",
        last_name="User",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


def test_submit_verification_sets_pending_status_and_document_url():
    user = FakeUser(
        id=uuid4(),
        phone="+994500000010",
        first_name="Driver",
        last_name="User",
        role="driver",
        created_at=datetime.now(timezone.utc),
    )
    service = IdentityService(db=cast(Session, None))
    service.users = cast(UserRepository, FakeUserRepository(user))
    current_user = make_current_user(user.id, role="driver")

    updated = service.submit_verification(current_user, "/uploads/test-file.pdf")

    assert updated.verification_status == "pending"
    assert updated.document_url == "/uploads/test-file.pdf"
