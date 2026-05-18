import json
from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, ride_id: UUID):
        await websocket.accept()
        if ride_id not in self.active_connections:
            self.active_connections[ride_id] = set()
        self.active_connections[ride_id].add(websocket)

    def disconnect(self, websocket: WebSocket, ride_id: UUID):
        if ride_id in self.active_connections:
            self.active_connections[ride_id].remove(websocket)
            if not self.active_connections[ride_id]:
                del self.active_connections[ride_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_ride(self, message: dict, ride_id: UUID):
        if ride_id in self.active_connections:
            message_json = json.dumps(message, default=str)
            for connection in self.active_connections[ride_id]:
                await connection.send_text(message_json)


manager = ConnectionManager()
