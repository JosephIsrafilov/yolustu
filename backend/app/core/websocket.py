import json
import asyncio
from typing import Dict, Set, Optional
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}
        self.user_connections: Dict[UUID, Set[WebSocket]] = {}
        self.loop: Optional[asyncio.AbstractEventLoop] = None

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

    async def connect_user(self, websocket: WebSocket, user_id: UUID):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

    def disconnect_user(self, websocket: WebSocket, user_id: UUID):
        if user_id in self.user_connections:
            self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    def send_personal_notification_sync(self, user_id: UUID, message: dict):
        """Sends a notification to a specific user using threadsafe asyncio execution. Can be called from sync code."""
        if user_id in self.user_connections and self.loop:
            message_json = json.dumps(message, default=str)
            for connection in self.user_connections[user_id]:
                try:
                    asyncio.run_coroutine_threadsafe(
                        connection.send_text(message_json), self.loop
                    )
                except RuntimeError:
                    pass

    async def send_personal_notification_async(self, user_id: UUID, message: dict):
        """Sends a notification to a specific user asynchronously."""
        if user_id in self.user_connections:
            message_json = json.dumps(message, default=str)
            for connection in self.user_connections[user_id]:
                await connection.send_text(message_json)

    async def broadcast_to_ride(self, message: dict, ride_id: UUID):
        if ride_id in self.active_connections:
            message_json = json.dumps(message, default=str)
            for connection in self.active_connections[ride_id]:
                await connection.send_text(message_json)


manager = ConnectionManager()
