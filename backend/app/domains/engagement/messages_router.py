from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.websocket import manager
from app.domains.engagement.schemas import MessageCreate, MessageResponse
from app.domains.engagement.services import EngagementService
from app.domains.identity.dependencies import CurrentUser, get_current_user

router = APIRouter()


@router.post("/", response_model=MessageResponse)
async def send_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await EngagementService(db).send_message(message_in, current_user, manager)


@router.websocket("/ws/{ride_id}")
async def websocket_endpoint(websocket: WebSocket, ride_id: UUID):
    await manager.connect(websocket, ride_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, ride_id)


@router.get("/ride/{ride_id}", response_model=List[MessageResponse])
def get_ride_messages(
    ride_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).get_ride_messages(ride_id, current_user)
