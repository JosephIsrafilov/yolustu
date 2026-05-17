from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from core.database import get_db
from api.deps import get_current_user
from models.models import User
from schemas.schemas import UserResponse, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_in.phone and user_in.phone != current_user.phone:
        existing_user = db.query(User).filter(User.phone == user_in.phone).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Phone already registered")
        current_user.phone = user_in.phone

    for field in ("first_name", "last_name", "avatar_url", "language", "role", "city", "bio"):
        value = getattr(user_in, field)
        if value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
