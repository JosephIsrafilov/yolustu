from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.domains.engagement.models import Message, Review
from app.domains.engagement.schemas import MessageCreate, ReviewCreate


class ReviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, author_id: UUID, review_in: ReviewCreate) -> Review:
        review = Review(
            author_id=author_id,
            target_id=review_in.target_id,
            ride_id=review_in.ride_id,
            rating=review_in.rating,
            comment=review_in.comment,
        )
        self.db.add(review)
        return review

    def list_for_target(self, user_id: UUID) -> list[Review]:
        return self.db.query(Review).filter(Review.target_id == user_id).all()

    def save(self, review: Review) -> Review:
        self.db.commit()
        self.db.refresh(review)
        return review

    def exists_for_author_target_ride(
        self, author_id: UUID, target_id: UUID, ride_id: UUID
    ) -> bool:
        return (
            self.db.query(Review)
            .filter(
                Review.author_id == author_id,
                Review.target_id == target_id,
                Review.ride_id == ride_id,
            )
            .first()
            is not None
        )


class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, sender_id: UUID, message_in: MessageCreate) -> Message:
        message = Message(
            ride_id=message_in.ride_id, sender_id=sender_id, content=message_in.content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_for_ride(self, ride_id: UUID) -> list[Message]:
        return (
            self.db.query(Message)
            .options(joinedload(Message.sender))
            .filter(Message.ride_id == ride_id)
            .order_by(Message.created_at.asc())
            .all()
        )
