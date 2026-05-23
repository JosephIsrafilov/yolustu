import os
import sys
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app
from app.domains.engagement.services import EngagementService
from app.domains.identity.dependencies import CurrentUser


client = TestClient(app)


def make_user() -> CurrentUser:
    return CurrentUser(
        id=uuid4(),
        phone="+994000000000",
        first_name="Ws",
        last_name="User",
        role="passenger",
        is_verified=True,
        is_blocked=False,
    )


def test_websocket_without_token_is_rejected():
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/v1/messages/ws/{uuid4()}"):
            pass


def test_websocket_with_invalid_token_is_rejected(monkeypatch):
    def fake_current_user_from_token(token, db):
        raise HTTPException(status_code=401, detail="Invalid token")

    monkeypatch.setattr(
        "app.domains.engagement.messages_router.get_current_user_from_token",
        fake_current_user_from_token,
    )

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/v1/messages/ws/{uuid4()}?token=invalid"):
            pass


def test_websocket_with_valid_token_but_non_participant_is_rejected(monkeypatch):
    monkeypatch.setattr(
        "app.domains.engagement.messages_router.get_current_user_from_token",
        lambda token, db: make_user(),
    )
    monkeypatch.setattr(
        EngagementService,
        "get_ride_messages",
        lambda self, ride_id, current_user: (_ for _ in ()).throw(
            HTTPException(status_code=403, detail="Only participants can read messages")
        ),
    )

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(
            f"/api/v1/messages/ws/{uuid4()}?token=valid-but-outsider"
        ):
            pass


@pytest.mark.parametrize("token", ["accepted-token", "paid-token", "completed-token"])
def test_websocket_with_participant_token_connects(monkeypatch, token: str):
    token_to_user = {
        "accepted-token": make_user(),
        "paid-token": make_user(),
        "completed-token": make_user(),
    }

    monkeypatch.setattr(
        "app.domains.engagement.messages_router.get_current_user_from_token",
        lambda incoming_token, db: token_to_user[incoming_token],
    )
    monkeypatch.setattr(
        EngagementService,
        "get_ride_messages",
        lambda self, ride_id, current_user: [],
    )

    with client.websocket_connect(f"/api/v1/messages/ws/{uuid4()}?token={token}") as ws:
        ws.send_text("ping")

