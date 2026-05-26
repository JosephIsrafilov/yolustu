from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.identity.dependencies import get_current_user
from app.domains.identity.models import User
from .models import Badge, UserBadge
from .schemas import BadgeResponse, UserBadgeResponse

router = APIRouter()


@router.get("/badges", response_model=List[BadgeResponse])
def get_all_badges(db: Session = Depends(get_db)):
    """Get all available badges."""
    return db.query(Badge).all()


@router.get("/my-badges", response_model=List[UserBadgeResponse])
def get_my_badges(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get badges earned by the current user."""
    return db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()
