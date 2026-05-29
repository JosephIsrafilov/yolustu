from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import logging
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.websocket import manager
from app.domains.identity.dependencies import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def notifications_websocket(
    websocket: WebSocket, token: str, db: Session = Depends(get_db)
):
    try:
        user = get_current_user(db=db, token=token)
    except Exception as exc:
        logger.debug("Rejected notification WebSocket connection: %s", exc)
        await websocket.close(code=1008)
        return

    await manager.connect_user(websocket, user.id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(websocket, user.id)
