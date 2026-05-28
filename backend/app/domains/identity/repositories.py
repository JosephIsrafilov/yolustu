from uuid import UUID

from sqlalchemy.orm import Session

from app.domains.identity.models import DeviceToken, User
from app.domains.identity.schemas import UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_phone(self, phone: str) -> User | None:
        return self.db.query(User).filter(User.phone == phone).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user_in: UserCreate, hashed_password: str) -> User:
        # Keep self-registration constrained to passenger/driver roles.
        role = user_in.role if user_in.role in {"passenger", "driver"} else "passenger"
        user = User(
            phone=user_in.phone,
            email=user_in.email,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            avatar_url=user_in.avatar_url,
            language=user_in.language or "az",
            role=role,
            city=user_in.city,
            bio=user_in.bio,
            hashed_password=hashed_password,
            is_verified=False,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, user_in: UserUpdate) -> User:
        if user_in.phone and user_in.phone != user.phone:
            user.phone = user_in.phone

        if user_in.email and user_in.email != user.email:
            user.email = user_in.email
            user.is_email_verified = False

        for field in (
            "first_name",
            "last_name",
            "avatar_url",
            "language",
            "role",
            "city",
            "bio",
        ):
            value = getattr(user_in, field)
            if value is not None:
                setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def mark_verified(self, user: User) -> User:
        user.is_verified = True
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_blocked(self, user: User, is_blocked: bool) -> User:
        user.is_blocked = is_blocked
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_rating(self, user: User, rating: float) -> User:
        user.rating = rating
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_verification_status(
        self, user: User, status: str, document_url: str | None = None
    ) -> User:
        user.verification_status = status
        if document_url:
            user.document_url = document_url
        self.db.commit()
        self.db.refresh(user)
        return user

    def increment_total_rides(self, user_id: UUID):
        user = self.get_by_id(user_id)
        if user:
            user.total_rides += 1

    def count_all(self) -> int:
        return self.db.query(User).count()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        return (
            self.db.query(User)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def add_device_token(self, user_id: UUID, token: str):
        existing_token = (
            self.db.query(DeviceToken).filter(DeviceToken.token == token).first()
        )
        if existing_token:
            if existing_token.user_id != user_id:
                existing_token.user_id = user_id
                self.db.commit()
            return

        device_token = DeviceToken(user_id=user_id, token=token)
        self.db.add(device_token)
        self.db.commit()
