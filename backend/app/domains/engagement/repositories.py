from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.domains.engagement.models import (
    Conversation,
    ConversationParticipant,
    Message,
    Review,
)
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


class ConversationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, conversation_id: UUID) -> Conversation | None:
        return (
            self.db.query(Conversation)
            .options(joinedload(Conversation.participants))
            .filter(Conversation.id == conversation_id)
            .first()
        )

    def get_ride_conversation(self, booking_id: UUID) -> Conversation | None:
        return (
            self.db.query(Conversation)
            .options(joinedload(Conversation.participants))
            .filter(
                Conversation.type == "ride",
                Conversation.booking_id == booking_id,
            )
            .first()
        )

    def get_open_support_conversation(self, user_id: UUID) -> Conversation | None:
        return (
            self.db.query(Conversation)
            .options(joinedload(Conversation.participants))
            .filter(
                Conversation.type == "support",
                Conversation.created_by_user_id == user_id,
                Conversation.status == "open",
            )
            .first()
        )

    def create(self, conversation: Conversation) -> Conversation:
        self.db.add(conversation)
        return conversation

    def add_participant(
        self, conversation_id: UUID, user_id: UUID, role: str
    ) -> ConversationParticipant:
        participant = ConversationParticipant(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
        )
        self.db.add(participant)
        return participant

    def list_user_conversations(self, user_id: UUID) -> list[Conversation]:
        return (
            self.db.query(Conversation)
            .join(ConversationParticipant)
            .options(joinedload(Conversation.participants))
            .filter(ConversationParticipant.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

    def list_visible_conversations(
        self, user_id: UUID, user_role: str
    ) -> list[Conversation]:
        query = (
            self.db.query(Conversation)
            .outerjoin(ConversationParticipant)
            .options(joinedload(Conversation.participants))
        )
        if user_role == "admin":
            query = query.filter(
                or_(
                    Conversation.type == "support",
                    ConversationParticipant.user_id == user_id,
                )
            )
        else:
            query = query.filter(ConversationParticipant.user_id == user_id)
        return query.distinct().order_by(Conversation.updated_at.desc()).all()


class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, sender_id: UUID, message_in: MessageCreate) -> Message:
        message = Message(
            conversation_id=message_in.conversation_id,
            ride_id=message_in.ride_id,
            sender_id=sender_id,
            content=message_in.content,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def create_for_conversation(
        self,
        conversation_id: UUID,
        sender_id: UUID,
        content: str,
        ride_id: UUID | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            ride_id=ride_id,
            sender_id=sender_id,
            content=content,
        )
        self.db.add(message)
        conversation = self.db.query(Conversation).filter_by(id=conversation_id).first()
        if conversation:
            conversation.updated_at = datetime.now(timezone.utc)
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

    def list_for_conversation(
        self,
        conversation_id: UUID,
        limit: int = 50,
        before: datetime | None = None,
    ) -> list[Message]:
        query = (
            self.db.query(Message)
            .options(joinedload(Message.sender))
            .filter(Message.conversation_id == conversation_id)
        )
        if before is not None:
            query = query.filter(Message.created_at < before)
        return query.order_by(Message.created_at.asc()).limit(limit).all()

    def mark_read(self, conversation_id: UUID, user_id: UUID) -> None:
        self.db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.read_at.is_(None),
        ).update({"read_at": datetime.now(timezone.utc)}, synchronize_session=False)
        self.db.commit()

    def list_for_conversation_all(self, conversation_id: UUID) -> list[Message]:
        return (
            self.db.query(Message)
            .options(joinedload(Message.sender))
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )
