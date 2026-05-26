import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(
        String(50), unique=True, index=True, nullable=False
    )  # e.g. newcomer, first_ride, veteran
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    badge_id = Column(
        UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False
    )
    awarded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")
