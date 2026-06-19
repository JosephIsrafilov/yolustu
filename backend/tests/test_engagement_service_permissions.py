from dataclasses import dataclass, field
from datetime import datetime, timezone
import asyncio
from types import SimpleNamespace
from typing import Any, cast
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.bookings.ports import BookingParticipantPort
from app.domains.engagement.schemas import ChatMessageCreate, ReviewCreate
from app.domains.engagement.services import EngagementService
from app.domains.engagement.repositories import MessageRepository, ReviewRepository
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.ports import UserLookupPort
from app.domains.trips.ports import RideLookupPort


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    status: str


@dataclass
class FakeReview:
    id: UUID
    author_id: UUID
    target_id: UUID
    ride_id: UUID
    rating: int
    comment: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class FakeRideLookupPort:
    def __init__(self, ride: FakeRide):
        self.ride = ride

    def get_ride(self, ride_id: UUID) -> FakeRide | None:
        return self.ride if ride_id == self.ride.id else None


class FakeBookingParticipantPort:
    def __init__(self, statuses_by_user: dict[UUID, str]):
        self.statuses_by_user = statuses_by_user

    def is_accepted_passenger(self, ride_id: UUID, user_id: UUID) -> bool:
        status = self.statuses_by_user.get(user_id)
        return status in {"accepted", "paid", "completed"}

    def get_accepted_passenger_ids(self, ride_id: UUID) -> list[UUID]:
        return [
            user_id
            for user_id, status in self.statuses_by_user.items()
            if status in {"accepted", "paid", "completed"}
        ]


class FakeUserLookupPort:
    def __init__(self, users: dict[UUID, SimpleNamespace]):
        self.users = users

    def get_user(self, user_id: UUID):
        return self.users.get(user_id)


class FakeReviewRepository:
    def __init__(self, duplicate_exists: bool = False, existing_target_reviews=None):
        self.duplicate_exists = duplicate_exists
        self.existing_target_reviews = list(existing_target_reviews or [])
        self.saved_reviews: list[FakeReview] = []

    def exists_for_author_target_ride(
        self, author_id: UUID, target_id: UUID, ride_id: UUID
    ) -> bool:
        return self.duplicate_exists

    def list_for_target(self, user_id: UUID):
        return self.existing_target_reviews

    def create(self, author_id: UUID, review_in: ReviewCreate) -> FakeReview:
        return FakeReview(
            id=uuid4(),
            author_id=author_id,
            target_id=review_in.target_id,
            ride_id=review_in.ride_id,
            rating=review_in.rating,
            comment=review_in.comment,
        )

    def save(self, review: FakeReview) -> FakeReview:
        self.saved_reviews.append(review)
        return review


class FakeMessageRepository:
    def __init__(self, messages: list[SimpleNamespace] | None = None):
        self.messages = messages or [
            SimpleNamespace(
                id=uuid4(),
                ride_id=uuid4(),
                sender_id=uuid4(),
                content="hello",
                created_at=datetime.now(timezone.utc),
            )
        ]

    def list_for_ride(self, ride_id: UUID):
        return self.messages


class FakeConversationRepository:
    def __init__(self, conversation):
        self.conversation = conversation

    def get(self, conversation_id: UUID):
        if conversation_id == self.conversation.id:
            return self.conversation
        return None

    def list_visible_conversations(self, user_id: UUID, user_role: str):
        if user_role == "admin" and self.conversation.type == "support":
            return [self.conversation]
        if any(part.user_id == user_id for part in self.conversation.participants):
            return [self.conversation]
        return []


class FakeChatMessageRepository(FakeMessageRepository):
    def create_for_conversation(
        self,
        conversation_id: UUID,
        sender_id: UUID,
        content: str,
        message_type: str = "text",
        attachments: list[str] | None = None,
        ride_id: UUID | None = None,
    ):
        message = SimpleNamespace(
            id=uuid4(),
            conversation_id=conversation_id,
            ride_id=ride_id,
            sender_id=sender_id,
            content=content,
            message_type=message_type,
            attachments=attachments or [],
            created_at=datetime.now(timezone.utc),
            sender_name="Test User",
        )
        self.messages.append(message)
        return message

    def list_for_conversation(self, conversation_id: UUID, limit=50, before=None):
        return [
            message
            for message in self.messages
            if message.conversation_id == conversation_id
        ]

    def mark_read(self, conversation_id: UUID, user_id: UUID):
        return None


class FakeQuery:
    def filter(self, *args, **kwargs):
        return self

    def count(self) -> int:
        return 1


class FakeDb:
    def query(self, *args, **kwargs):
        return FakeQuery()


class FakeNotificationService:
    def send_push_notification(self, **kwargs):
        return None


def make_current_user(user_id: UUID, role: str = "passenger") -> CurrentUser:
    return CurrentUser(
        id=user_id,
        phone="+994000000000",
        first_name="Test",
        last_name="User",
        role=role,
        is_verified=True,
        is_blocked=False,
    )


def make_service(
    *,
    ride_status: str = "completed",
    passenger_status: str | None = "accepted",
    duplicate_exists: bool = False,
) -> tuple[EngagementService, FakeRide, CurrentUser, CurrentUser, CurrentUser]:
    driver_id = uuid4()
    passenger_id = uuid4()
    outsider_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status=ride_status)

    statuses_by_user: dict[UUID, str] = {}
    if passenger_status is not None:
        statuses_by_user[passenger_id] = passenger_status

    users = {
        driver_id: SimpleNamespace(id=driver_id, rating=4.0),
        passenger_id: SimpleNamespace(id=passenger_id, rating=4.2),
        outsider_id: SimpleNamespace(id=outsider_id, rating=3.8),
    }

    service = EngagementService(db=cast(Session, None))
    service.rides = cast(RideLookupPort, FakeRideLookupPort(ride))
    service.bookings = cast(
        BookingParticipantPort, FakeBookingParticipantPort(statuses_by_user)
    )
    service.users = cast(UserLookupPort, FakeUserLookupPort(users))
    service.reviews = cast(
        ReviewRepository,
        FakeReviewRepository(
            duplicate_exists=duplicate_exists,
            existing_target_reviews=[],
        ),
    )
    service.messages = cast(MessageRepository, FakeMessageRepository())

    driver = make_current_user(driver_id, role="driver")
    passenger = make_current_user(passenger_id, role="passenger")
    outsider = make_current_user(outsider_id, role="passenger")
    return service, ride, driver, passenger, outsider


def test_review_before_trip_completion_is_forbidden():
    service, ride, driver, passenger, _ = make_service(ride_status="active")

    with pytest.raises(HTTPException) as exc:
        service.create_review(
            ReviewCreate(
                rating=5,
                comment="too early",
                target_id=driver.id,
                ride_id=ride.id,
            ),
            passenger,
        )

    assert exc.value.status_code == 400
    assert "after trip completion" in str(exc.value.detail)


def test_duplicate_review_for_same_ride_is_forbidden():
    service, ride, driver, passenger, _ = make_service(
        ride_status="completed", duplicate_exists=True
    )

    with pytest.raises(HTTPException) as exc:
        service.create_review(
            ReviewCreate(
                rating=5,
                comment="duplicate",
                target_id=driver.id,
                ride_id=ride.id,
            ),
            passenger,
        )

    assert exc.value.status_code == 400
    assert "already reviewed" in str(exc.value.detail)


def test_self_review_is_forbidden():
    service, ride, _, passenger, _ = make_service(ride_status="completed")

    with pytest.raises(HTTPException) as exc:
        service.create_review(
            ReviewCreate(
                rating=5,
                comment="self",
                target_id=passenger.id,
                ride_id=ride.id,
            ),
            passenger,
        )

    assert exc.value.status_code == 400
    assert "cannot review yourself" in str(exc.value.detail)


def test_participant_can_review_after_trip_completed():
    service, ride, driver, passenger, _ = make_service(ride_status="completed")

    review = service.create_review(
        ReviewCreate(
            rating=5,
            comment="great ride",
            target_id=driver.id,
            ride_id=ride.id,
        ),
        passenger,
    )

    assert review.author_id == passenger.id
    assert review.target_id == driver.id
    assert review.ride_id == ride.id
    assert review.rating == 5
    assert review.comment == "great ride"


def test_non_participant_cannot_create_review():
    service, ride, driver, _, outsider = make_service(
        ride_status="completed", passenger_status=None
    )

    with pytest.raises(HTTPException) as exc:
        service.create_review(
            ReviewCreate(
                rating=2,
                comment="not allowed",
                target_id=driver.id,
                ride_id=ride.id,
            ),
            outsider,
        )

    assert exc.value.status_code == 403
    assert "Only participants" in str(exc.value.detail)


def test_chat_access_allowed_for_accepted_booking():
    service, ride, _, passenger, _ = make_service(
        ride_status="active", passenger_status="accepted"
    )

    messages = service.get_ride_messages(ride.id, passenger)

    assert len(messages) == 1


def test_chat_access_allowed_for_paid_booking():
    service, ride, _, passenger, _ = make_service(
        ride_status="active", passenger_status="paid"
    )

    messages = service.get_ride_messages(ride.id, passenger)

    assert len(messages) == 1


@pytest.mark.parametrize("status", ["cancelled", "rejected"])
def test_chat_access_denied_for_non_active_booking_status(status: str):
    service, ride, _, passenger, _ = make_service(
        ride_status="active", passenger_status=status
    )

    with pytest.raises(HTTPException) as exc:
        service.get_ride_messages(ride.id, passenger)

    assert exc.value.status_code == 403
    assert "Only participants can read messages" in str(exc.value.detail)


def make_conversation(conversation_type: str = "support"):
    user_id = uuid4()
    conversation = SimpleNamespace(
        id=uuid4(),
        type=conversation_type,
        ride_id=uuid4() if conversation_type == "ride" else None,
        booking_id=uuid4() if conversation_type == "ride" else None,
        created_by_user_id=user_id,
        status="open",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        participants=[SimpleNamespace(user_id=user_id, role="user")],
    )
    return conversation, make_current_user(user_id)


def make_chat_service(conversation) -> EngagementService:
    service = EngagementService(db=cast(Session, FakeDb()))
    service_any = cast(Any, service)
    service_any.conversations = FakeConversationRepository(conversation)
    service_any.messages = FakeChatMessageRepository([])
    service_any.notifications = FakeNotificationService()
    return service


def test_user_can_read_own_support_conversation():
    conversation, user = make_conversation("support")
    service = make_chat_service(conversation)

    result = service.get_conversation(conversation.id, user)

    assert result.id == conversation.id


def test_admin_can_read_support_conversation_without_participant():
    conversation, _ = make_conversation("support")
    service = make_chat_service(conversation)
    admin = make_current_user(uuid4(), role="admin")

    result = service.get_conversation(conversation.id, admin)

    assert result.id == conversation.id


def test_outsider_cannot_read_support_conversation():
    conversation, _ = make_conversation("support")
    service = make_chat_service(conversation)
    outsider = make_current_user(uuid4())

    with pytest.raises(HTTPException) as exc:
        service.get_conversation(conversation.id, outsider)

    assert exc.value.status_code == 403


def test_participant_can_send_chat_message():
    conversation, user = make_conversation("support")
    service = make_chat_service(conversation)

    message = asyncio.run(
        service.send_chat_message(
            conversation.id, ChatMessageCreate(content="Need help"), user
        )
    )

    assert message.conversation_id == conversation.id
    assert message.content == "Need help"


@pytest.mark.parametrize("content", ["x" * 2001])
def test_chat_message_body_validation(content: str):
    with pytest.raises(ValueError):
        ChatMessageCreate(content=content)
