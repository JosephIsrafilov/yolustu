"""Public live-tracking WebSocket: GET /ws/tracking/{ride_id}.

Auth is dual-mode, both supplied as query params (browsers can't set headers
on a WebSocket handshake):
  * ?token=<JWT>          — driver/passenger, full access
  * ?share_token=<token>  — read-only public viewer

Either one grants the same read-only stream here (no client-to-server writes
are processed), so the distinction is purely about *who is allowed to watch*.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.identity.dependencies import get_current_user_from_websocket
from app.domains.trips.services import TripsService
from app.domains.trips.tracking import tracking_manager

router = APIRouter()


@router.websocket("/ws/tracking/{ride_id}")
async def track_ride(
    websocket: WebSocket,
    ride_id: UUID,
    token: str | None = Query(default=None),
    share_token: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    authorized = False

    # Public viewer path: share_token must match this ride.
    if share_token:
        authorized = TripsService(db).verify_share_token(ride_id, share_token)

    # Authenticated path: any valid logged-in user (driver/passenger).
    if not authorized:
        try:
            get_current_user_from_websocket(websocket, db, token)
            authorized = True
        except Exception:
            authorized = False

    if not authorized:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await tracking_manager.connect(websocket, ride_id)
    try:
        # Read-only stream: we drain inbound frames only to detect disconnects.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        tracking_manager.disconnect(websocket, ride_id)
    except Exception:
        tracking_manager.disconnect(websocket, ride_id)
