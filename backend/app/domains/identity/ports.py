from uuid import UUID

from sqlalchemy.orm import Session

from app.domains.identity.models import User
from app.domains.identity.repositories import UserRepository


class UserLookupPort:
    def __init__(self, db: Session):
        self.users = UserRepository(db)

    def get_user(self, user_id: UUID) -> User | None:
        return self.users.get_by_id(user_id)

    def set_rating(self, user_id: UUID, rating: float) -> User | None:
        user = self.users.get_by_id(user_id)
        if not user:
            return None
        return self.users.update_rating(user, rating)
