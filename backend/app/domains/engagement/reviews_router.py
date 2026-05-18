from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.engagement.schemas import ReviewCreate, ReviewResponse
from app.domains.engagement.services import EngagementService
from app.domains.identity.dependencies import CurrentUser, get_current_user

router = APIRouter()


@router.post("/", response_model=ReviewResponse)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return EngagementService(db).create_review(review_in, current_user)


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(user_id: UUID, db: Session = Depends(get_db)):
    return EngagementService(db).get_user_reviews(user_id)
