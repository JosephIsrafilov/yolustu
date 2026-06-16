"""Engagement service unit tests — covers create_review, send_chat_message, get_conversation, _can_access_conversation."""

import pytest
import asyncio
from dataclasses import dataclass, field
from typing import cast
from unittest.mock import MagicMock, AsyncMock
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.engagement.services import EngagementService
from app.domains.engagement.repositories import (
    ConversationRepository,
    MessageRepository,
    ReviewRepository,
)
from app.domains.engagement.schemas import (
    ReviewCreate,
    ChatMessageCreate,
    MessageCreate,
)
from app.domains.identity.dependencies import CurrentUser


# --- Fake models ---


@dataclass
class FakeParticipant:
    user_id: UUID
    role: str = "passenger"


@dataclass
class FakeConversation:
    id: UUID
    type: str = "ride"
    status: str = "open"
    ride_id: UUID | None = None
    booking_id: UUID | None = None
    created_by_user_id: UUID | None = None
    participants: list = field(default_factory=list)


@dataclass
class FakeMessage:
    id: UUID
    sender_id: UUID
    content: str
    conversation_id: UUID | None = None
    ride_id: UUID | None = None
    message_type: str = "text"
    attachments: list = field(default_factory=list)
    created_at: str = "2026-01-01T00:00:00"


@dataclass
class FakeReview:
    id: UUID
    author_id: UUID
    target_id: UUID
    ride_id: UUID
    rating: int
    comment: str | None = None


@dataclass
class FakeRide:
    id: UUID
    driver_id: UUID
    status: str = "completed"


# --- Fake repos ---


class FakeReviewRepository:
    def __init__(self):
        self.reviews: list[FakeReview] = []

    def exists_for_author_target_ride(self, author_id, target_id, ride_id):
        return any(
            r.author_id == author_id
            and r.target_id == target_id
            and r.ride_id == ride_id
            for r in self.reviews
        )

    def list_for_target(self, target_id):
        return [r for r in self.reviews if r.target_id == target_id]

    def create(self, author_id, review_in):
        r = FakeReview(
            id=uuid4(),
            author_id=author_id,
            target_id=review_in.target_id,
            ride_id=review_in.ride_id,
            rating=review_in.rating,
            comment=review_in.comment,
        )
        self.reviews.append(r)
        return r

    def save(self, review):
        return review


class FakeMessageRepository:
    def __init__(self):
        self.messages: list[FakeMessage] = []

    def create(self, sender_id, message_in):
        m = FakeMessage(
            id=uuid4(),
            sender_id=sender_id,
            content=message_in.content,
            ride_id=getattr(message_in, "ride_id", None),
        )
        self.messages.append(m)
        return m

    def create_for_conversation(
        self, conv_id, sender_id, content, msg_type, attachments, ride_id
    ):
        m = FakeMessage(
            id=uuid4(),
            sender_id=sender_id,
            content=content,
            conversation_id=conv_id,
            message_type=msg_type or "text",
            attachments=attachments or [],
            ride_id=ride_id,
        )
        self.messages.append(m)
        return m

    def list_for_conversation(self, conv_id, limit, before):
        return []

    def list_for_ride(self, ride_id):
        return []

    def mark_read(self, conv_id, user_id):
        pass


class FakeConversationRepository:
    def __init__(self, convs=None):
        self.convs: dict[UUID, FakeConversation] = {c.id: c for c in (convs or [])}

    def get(self, conv_id):
        return self.convs.get(conv_id)

    def list_visible_conversations(self, uid, role):
        return list(self.convs.values())

    def get_open_support_conversation(self, uid):
        return None

    def get_ride_conversation(self, booking_id):
        return None

    def create(self, conv):
        self.convs[conv.id] = conv

    def add_participant(self, conv_id, user_id, role):
        pass


class FakeRideLookup:
    def __init__(self, rides=None):
        self.rides = {r.id: r for r in (rides or [])}

    def get_ride(self, ride_id):
        return self.rides.get(ride_id)


class FakeBookingParticipantPort:
    def __init__(self, accepted=None):
        self.accepted: set[tuple] = set(accepted or [])

    def is_accepted_passenger(self, ride_id, user_id):
        return (ride_id, user_id) in self.accepted


class FakeUserLookup:
    def __init__(self, users=None):
        self.users = {u.id: u for u in (users or [])}

    def get_user(self, uid):
        return self.users.get(uid)


@dataclass
class FakeTargetUser:
    id: UUID
    rating: float = 5.0


# --- Service factory ---


def make_cu(uid, role="passenger", is_blocked=False):
    return CurrentUser(
        id=uid,
        phone="+994000000000",
        first_name="T",
        last_name="U",
        role=role,
        is_verified=True,
        is_blocked=is_blocked,
    )


def make_service(rides=None, convs=None, target_users=None, accepted_passengers=None):
    svc = EngagementService(db=cast(Session, MagicMock()))
    svc.reviews = cast(ReviewRepository, FakeReviewRepository())
    svc.messages = cast(MessageRepository, FakeMessageRepository())
    svc.conversations = cast(ConversationRepository, FakeConversationRepository(convs))
    svc.rides = cast(object, FakeRideLookup(rides))
    svc.bookings = cast(object, FakeBookingParticipantPort(accepted_passengers))
    svc.users = cast(object, FakeUserLookup(target_users))
    svc.notifications = MagicMock()
    svc.db = MagicMock()
    return svc


# ---- create_review tests ----


def test_create_review_ride_not_found():
    svc = make_service()
    driver_id = uuid4()
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=uuid4(), target_id=driver_id, rating=5),
            make_cu(uuid4()),
        )
    assert exc.value.status_code == 404


def test_create_review_ride_not_completed():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="active")
    svc = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
            make_cu(uuid4()),
        )
    assert exc.value.status_code == 400


def test_create_review_not_participant():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="completed")
    svc = make_service(rides=[ride])
    outsider = uuid4()
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
            make_cu(outsider),
        )
    assert exc.value.status_code == 403


def test_create_review_target_not_in_ride():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="completed")
    svc = make_service(rides=[ride], accepted_passengers=[(ride.id, passenger_id)])
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=ride.id, target_id=uuid4(), rating=5),
            make_cu(passenger_id),
        )
    assert exc.value.status_code == 400


def test_create_review_self_review():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="completed")
    svc = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
            make_cu(driver_id),
        )
    assert exc.value.status_code == 400


def test_create_review_target_user_not_found():
    driver_id = uuid4()
    passenger_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="completed")
    svc = make_service(rides=[ride], accepted_passengers=[(ride.id, passenger_id)])
    # target is driver, not in user lookup
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
            make_cu(passenger_id),
        )
    assert exc.value.status_code == 404


def test_create_review_duplicate():
    driver_id = uuid4()
    passenger_id = uuid4()
    target = FakeTargetUser(id=driver_id)
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="completed")
    svc = make_service(
        rides=[ride],
        accepted_passengers=[(ride.id, passenger_id)],
        target_users=[target],
    )
    # Create once
    svc.create_review(
        ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
        make_cu(passenger_id),
    )
    # Duplicate
    with pytest.raises(HTTPException) as exc:
        svc.create_review(
            ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
            make_cu(passenger_id),
        )
    assert exc.value.status_code == 400


def test_create_review_success():
    driver_id = uuid4()
    passenger_id = uuid4()
    target = FakeTargetUser(id=driver_id)
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="completed")
    svc = make_service(
        rides=[ride],
        accepted_passengers=[(ride.id, passenger_id)],
        target_users=[target],
    )
    result = svc.create_review(
        ReviewCreate(ride_id=ride.id, target_id=driver_id, rating=5),
        make_cu(passenger_id),
    )
    assert result.rating == 5


# ---- _can_access_conversation tests ----


def test_can_access_blocked_user_returns_false():
    conv = FakeConversation(id=uuid4(), type="ride", status="open")
    svc = make_service(convs=[conv])
    cu = make_cu(uuid4(), is_blocked=True)
    assert svc._can_access_conversation(conv, cu) is False


def test_can_access_closed_conv_non_admin_returns_false():
    conv = FakeConversation(id=uuid4(), type="ride", status="closed")
    svc = make_service(convs=[conv])
    cu = make_cu(uuid4(), role="passenger")
    assert svc._can_access_conversation(conv, cu) is False


def test_can_access_admin_support_conv():
    conv = FakeConversation(id=uuid4(), type="support", status="open")
    svc = make_service(convs=[conv])
    admin = make_cu(uuid4(), role="admin")
    assert svc._can_access_conversation(conv, admin) is True


def test_can_access_as_participant():
    uid = uuid4()
    conv = FakeConversation(
        id=uuid4(),
        type="ride",
        status="open",
        participants=[FakeParticipant(user_id=uid)],
    )
    svc = make_service(convs=[conv])
    assert svc._can_access_conversation(conv, make_cu(uid)) is True


def test_cannot_access_not_participant():
    conv = FakeConversation(
        id=uuid4(),
        type="ride",
        status="open",
        participants=[FakeParticipant(user_id=uuid4())],
    )
    svc = make_service(convs=[conv])
    assert svc._can_access_conversation(conv, make_cu(uuid4())) is False


# ---- get_conversation tests ----


def test_get_conversation_not_found():
    svc = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_conversation(uuid4(), make_cu(uuid4()))
    assert exc.value.status_code == 404


def test_get_conversation_not_authorized():
    conv = FakeConversation(id=uuid4(), participants=[FakeParticipant(user_id=uuid4())])
    svc = make_service(convs=[conv])
    with pytest.raises(HTTPException) as exc:
        svc.get_conversation(conv.id, make_cu(uuid4()))
    assert exc.value.status_code == 403


def test_get_conversation_success():
    uid = uuid4()
    conv = FakeConversation(id=uuid4(), participants=[FakeParticipant(user_id=uid)])
    svc = make_service(convs=[conv])
    result = svc.get_conversation(conv.id, make_cu(uid))
    assert result.id == conv.id


# ---- get_user_reviews ----


def test_get_user_reviews():
    svc = make_service()
    result = svc.get_user_reviews(uuid4())
    assert result == []


# ---- get_user_conversations ----


def test_get_user_conversations():
    uid = uuid4()
    conv = FakeConversation(id=uuid4())
    svc = make_service(convs=[conv])
    result = svc.get_user_conversations(make_cu(uid))
    assert len(result) == 1


# ---- get_conversation_messages ----


def test_get_conversation_messages():
    uid = uuid4()
    conv = FakeConversation(id=uuid4(), participants=[FakeParticipant(user_id=uid)])
    svc = make_service(convs=[conv])
    result = svc.get_conversation_messages(conv.id, make_cu(uid))
    assert result == []


# ---- mark_conversation_read ----


def test_mark_conversation_read():
    uid = uuid4()
    conv = FakeConversation(id=uuid4(), participants=[FakeParticipant(user_id=uid)])
    svc = make_service(convs=[conv])
    result = svc.mark_conversation_read(conv.id, make_cu(uid))
    assert result["ok"] is True


# ---- get_ride_messages ----


def test_get_ride_messages_ride_not_found():
    svc = make_service()
    with pytest.raises(HTTPException) as exc:
        svc.get_ride_messages(uuid4(), make_cu(uuid4()))
    assert exc.value.status_code == 404


def test_get_ride_messages_not_participant():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="active")
    svc = make_service(rides=[ride])
    with pytest.raises(HTTPException) as exc:
        svc.get_ride_messages(ride.id, make_cu(uuid4()))
    assert exc.value.status_code == 403


def test_get_ride_messages_success():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id, status="active")
    svc = make_service(rides=[ride])
    result = svc.get_ride_messages(ride.id, make_cu(driver_id))
    assert result == []


# ---- send_chat_message (async) ----


def test_send_chat_message_no_conversation_id():
    svc = make_service()

    async def run():
        with pytest.raises(HTTPException) as exc:
            await svc.send_chat_message(
                None, ChatMessageCreate(content="hi"), make_cu(uuid4())
            )
        assert exc.value.status_code == 400

    asyncio.get_event_loop().run_until_complete(run())


def test_send_chat_message_conv_not_found():
    svc = make_service()

    async def run():
        with pytest.raises(HTTPException) as exc:
            await svc.send_chat_message(
                uuid4(), ChatMessageCreate(content="hi"), make_cu(uuid4())
            )
        assert exc.value.status_code == 404

    asyncio.get_event_loop().run_until_complete(run())


def test_send_chat_message_not_participant():
    conv = FakeConversation(id=uuid4(), participants=[FakeParticipant(user_id=uuid4())])
    svc = make_service(convs=[conv])

    async def run():
        with pytest.raises(HTTPException) as exc:
            await svc.send_chat_message(
                conv.id, ChatMessageCreate(content="hi"), make_cu(uuid4())
            )
        assert exc.value.status_code == 403

    asyncio.get_event_loop().run_until_complete(run())


def test_send_chat_message_success():
    uid = uuid4()
    conv = FakeConversation(id=uuid4(), participants=[FakeParticipant(user_id=uid)])
    svc = make_service(convs=[conv])
    svc.db.query.return_value.filter.return_value.count.return_value = 0

    async def run():
        result = await svc.send_chat_message(
            conv.id, ChatMessageCreate(content="hello"), make_cu(uid)
        )
        assert result.content == "hello"

    asyncio.get_event_loop().run_until_complete(run())


# ---- send_message legacy ride_id path ----


def test_send_message_ride_not_found():
    svc = make_service()
    manager = MagicMock()
    manager.broadcast_to_ride = AsyncMock()

    async def run():
        with pytest.raises(HTTPException) as exc:
            await svc.send_message(
                MessageCreate(content="hi", ride_id=uuid4()), make_cu(uuid4()), manager
            )
        assert exc.value.status_code == 404

    asyncio.get_event_loop().run_until_complete(run())


def test_send_message_ride_not_participant():
    driver_id = uuid4()
    ride = FakeRide(id=uuid4(), driver_id=driver_id)
    svc = make_service(rides=[ride])
    manager = MagicMock()
    manager.broadcast_to_ride = AsyncMock()

    async def run():
        with pytest.raises(HTTPException) as exc:
            await svc.send_message(
                MessageCreate(content="hi", ride_id=ride.id), make_cu(uuid4()), manager
            )
        assert exc.value.status_code == 403

    asyncio.get_event_loop().run_until_complete(run())
