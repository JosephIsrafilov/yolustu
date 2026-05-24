import logging
import os
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.domains.identity.models import DeviceToken
from app.core.websocket import manager

logger = logging.getLogger(__name__)

# Try to initialize Firebase Admin SDK
firebase_ready = False
try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    if not firebase_admin._apps:
        # Check if credential file exists from environment variable
        cred_path = os.getenv("FIREBASE_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to default credentials/app
            firebase_admin.initialize_app()
    firebase_ready = True
except Exception as e:
    logger.warning(
        f"Firebase Admin SDK initialization skipped/failed (using fallback): {e}"
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
        """
        Send push notification via WebSocket (for active web clients) and Firebase FCM (for background delivery).
        """
        tokens = self.db.query(DeviceToken).filter(DeviceToken.user_id == user_id).all()

        notification_payload = {
            "type": "notification",
            "title": title,
            "body": body,
            "data": data or {},
        }

        # Always deliver via WebSocket as well for real-time in-app experience
        manager.send_personal_notification_sync(user_id, notification_payload)

        # Print to console for local testing visibility
        print("\n" + "=" * 50)
        print(f"🔔 [NOTIFICATION via WebSocket to {user_id}]")
        print(f"Title:  {title}")
        print(f"Body:   {body}")
        if data:
            print(f"Data:   {data}")
        print("=" * 50 + "\n")

        if not tokens:
            logger.info(
                f"No device tokens found for user {user_id}. Skipping FCM push notification."
            )
            return

        token_strings = [t.token for t in tokens]

        # Send via Firebase Admin SDK if initialized successfully
        if firebase_ready:
            try:
                # Firebase requires all data dictionary values to be strings
                stringified_data = {k: str(v) for k, v in (data or {}).items()}

                message = messaging.MulticastMessage(
                    tokens=token_strings,
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    data=stringified_data,
                )

                response = messaging.send_multicast(message)
                logger.info(
                    f"FCM push notification sent successfully: {response.success_count} success, {response.failure_count} failed."
                )

                if response.failure_count > 0:
                    for idx, resp in enumerate(response.responses):
                        if not resp.success:
                            logger.error(
                                f"FCM Token {token_strings[idx]} failed: {resp.exception}"
                            )
            except Exception as e:
                logger.error(f"Failed to send FCM push notification: {e}")
        else:
            logger.info(
                "Firebase Admin not configured. FCM push notification logged but skipped."
            )
