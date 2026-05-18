from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.identity.schemas import UserResponse, UserUpdate
from app.domains.identity.services import IdentityService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return IdentityService(db).get_current_user_model(current_user)


@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return IdentityService(db).update_current_user(current_user, user_in)


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: UUID, db: Session = Depends(get_db)):
    return IdentityService(db).get_user(user_id)
