import os
import shutil
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
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


@router.post("/me/verify", response_model=UserResponse)
async def submit_verification(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ensure directory exists (redundant but safe)
    os.makedirs("backend/uploads", exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("backend/uploads", filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # URL to be stored (relative to server root or full URL)
    # Assuming the app is served at the root
    document_url = f"/uploads/{filename}"
    
    return IdentityService(db).submit_verification(current_user, document_url)


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: UUID, db: Session = Depends(get_db)):
    return IdentityService(db).get_user(user_id)
