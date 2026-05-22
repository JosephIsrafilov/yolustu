from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.bookings.ports import BookingParticipantPort
from app.domains.engagement.models import Message, Review
from app.domains.engagement.repositories import MessageRepository, ReviewRepository
from app.domains.engagement.schemas import MessageCreate, ReviewCreate
from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.ports import UserLookupPort
from app.domains.trips.ports import RideLookupPort
from app.core.notifications import NotificationService


class EngagementService:
    def __init__(self, db: Session):
        self.reviews = ReviewRepository(db)
        self.messages = MessageRepository(db)
        self.rides = RideLookupPort(db)
        self.bookings = BookingParticipantPort(db)
        self.users = UserLookupPort(db)
        self.notifications = NotificationService(db)

    def create_review(
        self, review_in: ReviewCreate, current_user: CurrentUser
    ) -> Review:
        ride = self.rides.get_ride(review_in.ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        if not self._is_participant(ride, current_user.id):
            raise HTTPException(
                status_code=403, detail="Only participants can leave reviews"
            )

        target_is_driver = ride.driver_id == review_in.target_id
        target_is_passenger = self.bookings.is_accepted_passenger(
            ride.id, review_in.target_id
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

        existing_reviews = self.reviews.list_for_target(review_in.target_id)
        total_rating = (
            sum(review.rating for review in existing_reviews) + review_in.rating
        )
        target_user.rating = total_rating / (len(existing_reviews) + 1)

        review = self.reviews.create(current_user.id, review_in)
        return self.reviews.save(review)

    def get_user_reviews(self, user_id: UUID) -> list[Review]:
        return self.reviews.list_for_target(user_id)

    async def send_message(
        self, message_in: MessageCreate, current_user: CurrentUser, manager
    ) -> Message:
        ride = self.rides.get_ride(message_in.ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        if not self._is_participant(ride, current_user.id):
            raise HTTPException(
                status_code=403, detail="Only participants can send messages"
            )

        message = self.messages.create(current_user.id, message_in)
        message_data = {
            "id": str(message.id),
            "ride_id": str(message.ride_id),
            "sender_id": str(message.sender_id),
            "content": message.content,
            "created_at": str(message.created_at),
            "sender_name": f"{current_user.first_name} {current_user.last_name}",
        }
        await manager.broadcast_to_ride(message_data, message_in.ride_id)

        participants = self.bookings.get_accepted_passenger_ids(ride.id)
        participants.append(ride.driver_id)
        for participant_id in participants:
            if participant_id != current_user.id:
                self.notifications.send_push_notification(
                    user_id=participant_id,
                    title=f"New Message from {current_user.first_name}",
                    body=message.content,
                    data={"ride_id": str(ride.id), "type": "new_message"},
                )

        return message

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
