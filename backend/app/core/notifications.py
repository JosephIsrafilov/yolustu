import logging
import os
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.websocket import manager
from app.domains.identity.models import DeviceToken

logger = logging.getLogger(__name__)

firebase_ready = False
try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    firebase_ready = True
except Exception as exc:
    logger.warning(
        "Firebase Admin SDK initialization skipped; using WebSocket fallback: %s",
        exc,
    )


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def send_push_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ):
        tokens = self.db.query(DeviceToken).filter(DeviceToken.user_id == user_id).all()

        notification_payload = {
            "type": "notification",
            "title": title,
            "body": body,
            "data": data or {},
        }

        manager.send_personal_notification_sync(user_id, notification_payload)
        logger.info(
            "Notification queued for user %s via WebSocket: title=%r body=%r data=%r",
            user_id,
            title,
            body,
            data,
        )

        if not tokens:
            logger.info(
                "No device tokens found for user %s. Skipping FCM push notification.",
                user_id,
            )
            return

        token_strings = [token.token for token in tokens]

        if firebase_ready:
            try:
                stringified_data = {
                    key: str(value) for key, value in (data or {}).items()
                }
                message = messaging.MulticastMessage(
                    tokens=token_strings,
                    notification=messaging.Notification(title=title, body=body),
                    data=stringified_data,
                )

                response = messaging.send_multicast(message)
                logger.info(
                    "FCM push notification sent: %s success, %s failed.",
                    response.success_count,
                    response.failure_count,
                )

                if response.failure_count > 0:
                    for idx, resp in enumerate(response.responses):
                        if not resp.success:
                            logger.error(
                                "FCM token %s failed: %s",
                                token_strings[idx],
                                resp.exception,
                            )
            except Exception as exc:
                logger.error("Failed to send FCM push notification: %s", exc)
        else:
            logger.info("Firebase Admin not configured. FCM push notification skipped.")
