import logging
from uuid import UUID
from sqlalchemy.orm import Session
from app.domains.identity.models import DeviceToken

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def send_push_notification(self, user_id: UUID, title: str, body: str, data: dict = None):
        """
        Mock implementation of push notification delivery.
        In production, this would use Firebase Admin SDK to push to the tokens.
        """
        # 1. Get all device tokens for the user
        tokens = self.db.query(DeviceToken).filter(DeviceToken.user_id == user_id).all()
        
        if not tokens:
            logger.info(f"No device tokens found for user {user_id}. Skipping push notification.")
            return

        token_strings = [t.token for t in tokens]
        
        # 2. Simulate sending push
        print("\n" + "="*50)
        print(f"🔔 [PUSH NOTIFICATION to {user_id}]")
        print(f"Tokens: {token_strings}")
        print(f"Title:  {title}")
        print(f"Body:   {body}")
        if data:
            print(f"Data:   {data}")
        print("="*50 + "\n")
