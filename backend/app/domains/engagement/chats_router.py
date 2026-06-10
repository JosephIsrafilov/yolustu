from datetime import datetime
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy.orm import Session
from starlette import status

from app.core.database import get_db
from app.core.websocket import manager
from app.domains.engagement.schemas import (
    ChatMessageCreate,
    ConversationResponse,
    MessageResponse,
    RideConversationCreate,
)
from app.domains.engagement.services import EngagementService
from app.domains.identity.dependencies import (
    CurrentUser,
    get_current_user,
    get_current_user_from_websocket,
)

router = APIRouter()


@router.get("/", response_model=list[ConversationResponse])
def list_chats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).get_user_conversations(current_user)


@router.post("/support", response_model=ConversationResponse)
def create_support_chat(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).get_or_create_support_conversation(current_user)


@router.post("/ride", response_model=ConversationResponse)
def create_ride_chat(
    payload: RideConversationCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).get_or_create_ride_conversation(
        payload.booking_id, current_user
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_chat(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).get_conversation(conversation_id, current_user)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_chat_messages(
    conversation_id: UUID,
    limit: int = Query(default=50, ge=1, le=100),
    before: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).get_conversation_messages(
        conversation_id, current_user, limit, before
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_chat_message(
    conversation_id: UUID,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await EngagementService(db).send_chat_message(
        conversation_id, payload, current_user, manager
    )


@router.patch("/{conversation_id}/read")
def mark_chat_read(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).mark_conversation_read(conversation_id, current_user)


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: UUID,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    try:
        current_user = get_current_user_from_websocket(websocket, db, token)
        EngagementService(db).get_conversation(conversation_id, current_user)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect_conversation(websocket, conversation_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_conversation(websocket, conversation_id)
