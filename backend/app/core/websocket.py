"""
WebSocket connection manager with Redis Pub/Sub backend.

Each Gunicorn/Uvicorn worker maintains its own dict of live WebSocket
connections.  When a message needs to be broadcast (to a ride, conversation,
or user) it is *published* to a Redis channel.  A per-worker background
asyncio task subscribes to all relevant channels and forwards received
payloads to the local WebSocket objects.

Channel naming:
  ws:ride:<ride_id>          — ride chat broadcasts
  ws:conv:<conversation_id>  — conversation broadcasts
  ws:user:<user_id>          — personal notifications

Graceful degradation: if Redis is unavailable the manager falls back to
local-only delivery (same behaviour as the old in-memory implementation).
"""

import asyncio
import json
import logging
from typing import Dict, Optional, Set, Any
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Channel helpers
# ─────────────────────────────────────────────────────────────────────────────


def _ride_channel(ride_id: UUID) -> str:
    return f"ws:ride:{ride_id}"


def _conv_channel(conv_id: UUID) -> str:
    return f"ws:conv:{conv_id}"


def _user_channel(user_id: UUID) -> str:
    return f"ws:user:{user_id}"


# ─────────────────────────────────────────────────────────────────────────────
# ConnectionManager
# ─────────────────────────────────────────────────────────────────────────────


class ConnectionManager:
    """
    Manages WebSocket connections across multiple Uvicorn workers via Redis.

    Public API is identical to the previous in-memory implementation so all
    existing callers (routers, services, notifications) need zero changes.
    """

    def __init__(self) -> None:
        # Local connections — only the sockets connected to *this* worker.
        self.active_connections: Dict[
            UUID, Set[WebSocket]
        ] = {}  # ride/conv id → sockets
        self.user_connections: Dict[UUID, Set[WebSocket]] = {}  # user id → sockets

        # Asyncio event loop — set by main.py lifespan before start().
        self.loop: Optional[asyncio.AbstractEventLoop] = None

        # Redis clients created lazily in start().
        self._pub: Any = None  # redis.asyncio.Redis (publisher)
        self._sub: Any = None  # redis.asyncio.client.PubSub
        self._subscriber_task: Optional[asyncio.Task] = None  # type: ignore[type-arg]
        self._redis_available: bool = False

    # ── Lifecycle ──────────────────────────────────────────────────────────

    async def start(self) -> None:
        """Start the Redis subscriber background task.  Called from app lifespan."""
        try:
            import redis.asyncio as aioredis  # type: ignore[import-untyped]
            from app.core.config import settings

            self._pub = aioredis.Redis.from_url(
                settings.REDIS_URL, decode_responses=True
            )
            # Verify connection
            await self._pub.ping()  # type: ignore[union-attr]
            self._sub = self._pub.pubsub()  # type: ignore[union-attr]
            # Subscribe to a worker-local wildcard pattern
            await self._sub.psubscribe("ws:*")  # type: ignore[union-attr]
            self._subscriber_task = asyncio.create_task(self._listen())
            self._redis_available = True
            logger.info("WebSocket Redis Pub/Sub subscriber started")
        except Exception as exc:
            logger.warning(
                "Redis Pub/Sub unavailable — falling back to local-only WebSocket delivery: %s",
                exc,
            )
            self._redis_available = False

    async def stop(self) -> None:
        """Gracefully shut down the subscriber.  Called from app lifespan."""
        if self._subscriber_task:
            self._subscriber_task.cancel()
            try:
                await self._subscriber_task
            except asyncio.CancelledError:
                pass
        if self._sub:
            try:
                await self._sub.unsubscribe()  # type: ignore[union-attr]
                await self._sub.aclose()  # type: ignore[union-attr]
            except Exception:
                pass
        if self._pub:
            try:
                await self._pub.aclose()  # type: ignore[union-attr]
            except Exception:
                pass
        logger.info("WebSocket Redis Pub/Sub subscriber stopped")

    # ── Redis subscriber loop ──────────────────────────────────────────────

    async def _listen(self) -> None:
        """Background task: receive messages from Redis and forward locally."""
        try:
            async for raw in self._sub.listen():  # type: ignore[union-attr]
                if raw["type"] not in ("pmessage", "message"):
                    continue
                channel: str = raw.get("channel", "")
                try:
                    payload: dict = json.loads(raw["data"])
                except (json.JSONDecodeError, KeyError):
                    continue

                # Dispatch based on channel prefix
                if channel.startswith("ws:ride:"):
                    ride_id = UUID(channel[len("ws:ride:") :])
                    await self._broadcast_local(
                        payload, self.active_connections.get(ride_id, set())
                    )
                elif channel.startswith("ws:conv:"):
                    conv_id = UUID(channel[len("ws:conv:") :])
                    await self._broadcast_local(
                        payload, self.active_connections.get(conv_id, set())
                    )
                elif channel.startswith("ws:user:"):
                    user_id = UUID(channel[len("ws:user:") :])
                    await self._broadcast_local(
                        payload, self.user_connections.get(user_id, set())
                    )
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Redis subscriber loop died: %s", exc)

    @staticmethod
    async def _broadcast_local(payload: dict, sockets: Set[WebSocket]) -> None:
        """Send a JSON payload to all WebSocket connections in *this* worker."""
        if not sockets:
            return
        message_json = json.dumps(payload, default=str)
        dead: list[WebSocket] = []
        for ws in list(sockets):
            try:
                await ws.send_text(message_json)
            except Exception:
                dead.append(ws)
        for ws in dead:
            sockets.discard(ws)

    # ── Publish helpers ────────────────────────────────────────────────────

    async def _publish(self, channel: str, payload: dict) -> None:
        """Publish to Redis, falling back to local delivery if Redis is down."""
        if self._redis_available and self._pub:
            try:
                await self._pub.publish(channel, json.dumps(payload, default=str))  # type: ignore[union-attr]
                return
            except Exception as exc:
                logger.warning("Redis publish failed, delivering locally: %s", exc)
        # Fallback: local delivery only
        await self._local_fallback(channel, payload)

    async def _local_fallback(self, channel: str, payload: dict) -> None:
        if channel.startswith("ws:ride:"):
            ride_id = UUID(channel[len("ws:ride:") :])
            await self._broadcast_local(
                payload, self.active_connections.get(ride_id, set())
            )
        elif channel.startswith("ws:conv:"):
            conv_id = UUID(channel[len("ws:conv:") :])
            await self._broadcast_local(
                payload, self.active_connections.get(conv_id, set())
            )
        elif channel.startswith("ws:user:"):
            user_id = UUID(channel[len("ws:user:") :])
            await self._broadcast_local(
                payload, self.user_connections.get(user_id, set())
            )

    # ── Connection management (unchanged public API) ───────────────────────

    async def connect(self, websocket: WebSocket, ride_id: UUID) -> None:
        await websocket.accept()
        self.active_connections.setdefault(ride_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket, ride_id: UUID) -> None:
        bucket = self.active_connections.get(ride_id)
        if bucket:
            bucket.discard(websocket)
            if not bucket:
                del self.active_connections[ride_id]

    async def connect_conversation(
        self, websocket: WebSocket, conversation_id: UUID
    ) -> None:
        await self.connect(websocket, conversation_id)

    def disconnect_conversation(
        self, websocket: WebSocket, conversation_id: UUID
    ) -> None:
        self.disconnect(websocket, conversation_id)

    async def connect_user(self, websocket: WebSocket, user_id: UUID) -> None:
        await websocket.accept()
        self.user_connections.setdefault(user_id, set()).add(websocket)

    def disconnect_user(self, websocket: WebSocket, user_id: UUID) -> None:
        bucket = self.user_connections.get(user_id)
        if bucket:
            bucket.discard(websocket)
            if not bucket:
                del self.user_connections[user_id]

    # ── Message delivery (unchanged public API) ───────────────────────────

    async def send_personal_message(self, message: str, websocket: WebSocket) -> None:
        await websocket.send_text(message)

    def send_personal_notification_sync(self, user_id: UUID, message: dict) -> None:
        """Send a notification from synchronous code (e.g. scheduler, sync services).

        Publishes to Redis via a thread-safe coroutine dispatch.  If the event
        loop is not available falls back to a best-effort local delivery.
        """
        if self.loop and not self.loop.is_closed():
            asyncio.run_coroutine_threadsafe(
                self._publish(_user_channel(user_id), message),
                self.loop,
            )
        else:
            # Last-resort: fire-and-forget local delivery
            bucket = self.user_connections.get(user_id, set())
            message_json = json.dumps(message, default=str)
            for ws in list(bucket):
                try:
                    asyncio.run_coroutine_threadsafe(
                        ws.send_text(message_json),
                        self.loop or asyncio.get_event_loop(),
                    )
                except Exception as exc:
                    logger.debug(
                        "Skipped WS notification for user %s: %s", user_id, exc
                    )

    async def send_personal_notification_async(
        self, user_id: UUID, message: dict
    ) -> None:
        """Send a notification from async code."""
        await self._publish(_user_channel(user_id), message)

    async def broadcast_to_ride(self, message: dict, ride_id: UUID) -> None:
        await self._publish(_ride_channel(ride_id), message)

    async def broadcast_to_conversation(
        self, message: dict, conversation_id: UUID
    ) -> None:
        await self._publish(_conv_channel(conversation_id), message)


manager = ConnectionManager()
