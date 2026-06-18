"""Regression test for MessageRepository.list_for_conversation ordering.

Bug: without a `before` cursor the repo returned the OLDEST `limit` messages
(`.asc().limit()`) instead of the most recent ones, so opening a chat with more
than `limit` messages showed ancient history. Fix returns the most recent
`limit` messages, ascending.

Uses an isolated in-memory SQLite engine because the shared conftest only
creates User/AuditLog/Badge/UserBadge tables, not Conversation/Message.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.domains.engagement.models import Conversation, Message
from app.domains.engagement.repositories import MessageRepository
from app.domains.identity.models import User


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        bind=engine,
        tables=[
            User.__table__,
            Conversation.__table__,
            Message.__table__,
        ],
    )
    db = sessionmaker(bind=engine)()
    try:
        yield db
    finally:
        db.close()


def _seed(session, message_count: int):
    sender = User(
        phone="+994500000001",
        first_name="A",
        last_name="B",
        hashed_password="x",
        is_verified=True,
        role="passenger",
    )
    session.add(sender)
    session.flush()

    conv = Conversation(type="ride", created_by_user_id=sender.id, status="open")
    session.add(conv)
    session.flush()

    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    messages = []
    for i in range(message_count):
        # Explicit, strictly increasing timestamps so ordering is deterministic
        # (server_default=now() would collide in a tight insert loop).
        m = Message(
            conversation_id=conv.id,
            sender_id=sender.id,
            content=f"msg-{i}",
            created_at=base + timedelta(minutes=i),
        )
        session.add(m)
        messages.append(m)
    session.commit()
    return conv, messages


def test_list_for_conversation_returns_most_recent_ascending(session):
    """Default (no cursor) must return the newest 50, ascending — not the oldest 50."""
    conv, messages = _seed(session, message_count=60)
    repo = MessageRepository(session)

    result = repo.list_for_conversation(conv.id)

    assert len(result) == 50
    contents = [m.content for m in result]
    # Ascending: oldest-of-the-window first, newest last.
    assert contents == [f"msg-{i}" for i in range(10, 60)]
    # Newest message is present and last.
    assert result[-1].content == "msg-59"
    # First element is the 11th-oldest (index 10), i.e. window is the most-recent 50.
    assert result[0].content == "msg-10"
    # Timestamps strictly ascending.
    assert all(
        result[i].created_at < result[i + 1].created_at
        for i in range(len(result) - 1)
    )


def test_list_for_conversation_before_cursor_returns_older_page(session):
    """Passing before=<oldest loaded ts> returns the previous (older) page, ascending."""
    conv, _ = _seed(session, message_count=60)
    repo = MessageRepository(session)

    first_page = repo.list_for_conversation(conv.id)
    oldest_loaded = first_page[0].created_at  # msg-10

    older_page = repo.list_for_conversation(conv.id, before=oldest_loaded)

    # Only msg-0..msg-9 are older than msg-10.
    assert [m.content for m in older_page] == [f"msg-{i}" for i in range(10)]
    assert all(m.created_at < oldest_loaded for m in older_page)
    assert all(
        older_page[i].created_at < older_page[i + 1].created_at
        for i in range(len(older_page) - 1)
    )
