from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.notifications import NotificationService
from app.domains.bookings.ports import BookingParticipantPort
from app.domains.bookings.models import Booking
from app.domains.engagement.models import Conversation, Message, Review
from app.domains.engagement.repositories import (
    ConversationRepository,
    MessageRepository,
    ReviewRepository,
)
from app.domains.engagement.schemas import (
    ChatMessageCreate,
    MessageCreate,
    ReviewCreate,
)
from app.domains.gamification.services import (
    check_and_award_badge,
    check_and_award_badge_async,
)
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.ports import UserLookupPort
from app.domains.trips.ports import RideLookupPort


class EngagementService:
    def __init__(self, db: Session):
        self.reviews = ReviewRepository(db)
        self.messages = MessageRepository(db)
        self.conversations = ConversationRepository(db)
        self.rides = RideLookupPort(db)
        self.bookings = BookingParticipantPort(db)
        self.users = UserLookupPort(db)
        self.notifications = NotificationService(db)
        self.db = db

    def create_review(
        self, review_in: ReviewCreate, current_user: CurrentUser
    ) -> Review:
        ride = self.rides.get_ride(review_in.ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        if ride.status != "completed":
            raise HTTPException(
                status_code=400, detail="Review is allowed only after trip completion"
            )

        if not self._is_participant(ride, current_user.id):
            raise HTTPException(
                status_code=403, detail="Only participants can leave reviews"
            )

        target_is_driver = ride.driver_id == review_in.target_id
        target_is_passenger = self.bookings.is_accepted_passenger(
            ride.id, review_in.target_id  # type: ignore[arg-type]
        )
        if not (target_is_driver or target_is_passenger):
            raise HTTPException(
                status_code=400, detail="Target user was not part of this ride"
            )
        if current_user.id == review_in.target_id:
            raise HTTPException(status_code=400, detail="You cannot review yourself")

        target_user = self.users.get_user(review_in.target_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")
        if self.reviews.exists_for_author_target_ride(
            current_user.id, review_in.target_id, ride.id  # type: ignore[arg-type]
        ):
            raise HTTPException(
                status_code=400,
                detail="You have already reviewed this user for this ride",
            )

        existing_reviews = self.reviews.list_for_target(review_in.target_id)
        total_rating = (
            sum(review.rating for review in existing_reviews) + review_in.rating
        )
        target_user.rating = total_rating / (len(existing_reviews) + 1)  # type: ignore[assignment]

        review = self.reviews.create(current_user.id, review_in)
        saved_review = self.reviews.save(review)

        # Gamification: 5_star badge
        if saved_review.rating == 5:
            check_and_award_badge(self.db, review_in.target_id, "5_star")

        return saved_review

    def get_user_reviews(self, user_id: UUID) -> list[Review]:
        return self.reviews.list_for_target(user_id)

    def get_user_conversations(self, current_user: CurrentUser) -> list[Conversation]:
        return self.conversations.list_visible_conversations(
            current_user.id, current_user.role
        )

    def get_or_create_support_conversation(
        self, current_user: CurrentUser
    ) -> Conversation:
        existing = self.conversations.get_open_support_conversation(current_user.id)
        if existing:
            return existing

        conv = Conversation(
            type="support",
            created_by_user_id=current_user.id,
            status="open",
        )
        self.conversations.create(conv)
        self.db.flush()
        self.conversations.add_participant(conv.id, current_user.id, "user")  # type: ignore[arg-type]
        self.db.commit()
        self.db.refresh(conv)
        created = self.conversations.get(conv.id)  # type: ignore[arg-type]
        if created is None:
            raise HTTPException(status_code=500, detail="Conversation was not created")
        return created

    def get_or_create_ride_conversation(
        self, booking_id: UUID, current_user: CurrentUser
    ) -> Conversation:
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        ride = self.rides.get_ride(booking.ride_id)  # type: ignore[arg-type]
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        if current_user.id not in (booking.passenger_id, ride.driver_id):
            raise HTTPException(
                status_code=403, detail="Not authorized to access this booking chat"
            )

        existing = self.conversations.get_ride_conversation(booking_id)
        if existing:
            return existing

        conv = Conversation(
            type="ride",
            ride_id=ride.id,
            booking_id=booking.id,
            created_by_user_id=current_user.id,
            status="open",
        )
        self.conversations.create(conv)
        self.db.flush()
        self.conversations.add_participant(conv.id, booking.passenger_id, "passenger")  # type: ignore[arg-type]
        self.conversations.add_participant(conv.id, ride.driver_id, "driver")  # type: ignore[arg-type]
        self.db.commit()
        self.db.refresh(conv)
        created = self.conversations.get(conv.id)  # type: ignore[arg-type]
        if created is None:
            raise HTTPException(status_code=500, detail="Conversation was not created")
        return created

    def get_conversation(
        self, conversation_id: UUID, current_user: CurrentUser
    ) -> Conversation:
        conv = self.conversations.get(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not self._can_access_conversation(conv, current_user):
            raise HTTPException(status_code=403, detail="Not authorized")
        return conv

    def _can_access_conversation(
        self, conv: Conversation, current_user: CurrentUser
    ) -> bool:
        # Block check - blocked users cannot access conversations
        if current_user.is_blocked:
            return False

        # Check conversation status - don't allow access to closed conversations for regular users
        if conv.status == "closed" and current_user.role != "admin":
            return False

        if current_user.role == "admin" and conv.type == "support":
            return True
        for p in conv.participants:
            if p.user_id == current_user.id:
                return True
        return False

    def _message_payload(self, message: Message, current_user: CurrentUser) -> dict:
        return {
            "id": str(message.id),
            "conversation_id": str(message.conversation_id)
            if message.conversation_id
            else None,
            "ride_id": str(message.ride_id) if message.ride_id else None,
            "sender_id": str(message.sender_id),
            "content": message.content,
            "created_at": str(message.created_at),
            "sender_name": f"{current_user.first_name} {current_user.last_name}",
        }

    async def send_message(
        self, message_in: MessageCreate, current_user: CurrentUser, manager
    ) -> Message:
        if not message_in.conversation_id and message_in.ride_id:
            # legacy support for direct ride_id
            ride = self.rides.get_ride(message_in.ride_id)
            if not ride:
                raise HTTPException(status_code=404, detail="Ride not found")
            if not self._is_participant(ride, current_user.id):
                raise HTTPException(
                    status_code=403, detail="Only participants can send messages"
                )
            message = self.messages.create(current_user.id, message_in)
            message_data = self._message_payload(message, current_user)
            await manager.broadcast_to_ride(message_data, message_in.ride_id)
            return message

        return await self.send_chat_message(
            message_in.conversation_id,
            ChatMessageCreate(content=message_in.content),
            current_user,
            manager,
        )

    async def send_chat_message(
        self,
        conversation_id: UUID | None,
        message_in: ChatMessageCreate,
        current_user: CurrentUser,
        manager=None,
    ) -> Message:
        if conversation_id is None:
            raise HTTPException(status_code=400, detail="conversation_id is required")
        conv = self.conversations.get(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if not self._can_access_conversation(conv, current_user):
            raise HTTPException(status_code=403, detail="Not a participant")

        message = self.messages.create_for_conversation(
            conv.id, current_user.id, message_in.content, conv.ride_id  # type: ignore[arg-type]
        )

        if manager:
            await manager.broadcast_to_conversation(
                self._message_payload(message, current_user), conv.id  # type: ignore[arg-type]
            )

        for part in conv.participants:
            if part.user_id != current_user.id:
                self.notifications.send_push_notification(
                    user_id=part.user_id,  # type: ignore[arg-type]
                    title=f"New Message from {current_user.first_name}",
                    body=message.content,  # type: ignore[arg-type]
                    data={"conversation_id": str(conv.id), "type": "new_message"},
                )

        # Gamification: chatterbox badge (5+ messages)
        msg_count = (
            self.db.query(Message).filter(Message.sender_id == current_user.id).count()
        )
        if msg_count >= 5:
            await check_and_award_badge_async(self.db, current_user.id, "chatterbox")

        return message

    def get_conversation_messages(
        self,
        conversation_id: UUID,
        current_user: CurrentUser,
        limit: int = 50,
        before=None,
    ) -> list[Message]:
        self.get_conversation(conversation_id, current_user)
        return self.messages.list_for_conversation(
            conversation_id, min(limit, 100), before
        )

    def mark_conversation_read(
        self, conversation_id: UUID, current_user: CurrentUser
    ) -> dict[str, bool]:
        self.get_conversation(conversation_id, current_user)
        self.messages.mark_read(conversation_id, current_user.id)
        return {"ok": True}

    def get_ride_messages(
        self, ride_id: UUID, current_user: CurrentUser
    ) -> list[Message]:
        ride = self.rides.get_ride(ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        if not self._is_participant(ride, current_user.id):
            raise HTTPException(
                status_code=403, detail="Only participants can read messages"
            )
        return self.messages.list_for_ride(ride_id)

    def _is_participant(self, ride, user_id: UUID) -> bool:
        return ride.driver_id == user_id or self.bookings.is_accepted_passenger(
            ride.id, user_id
        )
