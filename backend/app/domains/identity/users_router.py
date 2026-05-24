import shutil
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.config import UPLOADS_DIR
from app.core.database import get_db
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.identity.schemas import DeviceTokenInput, UserResponse, UserUpdate
from app.domains.identity.services import IdentityService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
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
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    file_ext = Path(file.filename or "").suffix
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document_url = f"/uploads/{filename}"

    return IdentityService(db).submit_verification(current_user, document_url)


@router.post("/me/device-token")
def register_device_token(
    token_in: DeviceTokenInput,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    IdentityService(db).register_device_token(current_user, token_in.token)
    return {"detail": "Device token registered successfully"}


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: UUID, db: Session = Depends(get_db)):
    return IdentityService(db).get_user(user_id)
