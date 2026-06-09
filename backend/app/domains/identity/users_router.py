import os
import shutil
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.core.config import UPLOADS_DIR
from app.core.database import get_db
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.identity.schemas import DeviceTokenInput, UserResponse, UserUpdate
from app.domains.identity.services import IdentityService

router = APIRouter()
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
AVATAR_UPLOAD_TYPES: dict[str, set[str]] = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".gif": {"image/gif"},
    ".webp": {"image/webp"},
}
VERIFICATION_UPLOAD_TYPES: dict[str, set[str]] = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".pdf": {"application/pdf"},
}


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
    filename = _store_uploaded_file(
        file,
        filename_prefix="verification_",
        allowed_types=VERIFICATION_UPLOAD_TYPES,
    )
    document_url = f"/uploads/{filename}"

    return IdentityService(db).submit_verification(current_user, document_url)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = _store_uploaded_file(
        file,
        filename_prefix="avatar_",
        allowed_types=AVATAR_UPLOAD_TYPES,
    )
    from app.core.config import settings

    # Ensure full URL for frontend Next/Image
    base_url = str(settings.BACKEND_URL).rstrip("/")
    avatar_url = f"{base_url}/uploads/{filename}"

    user_model = IdentityService(db).get_current_user_model(current_user)
    user_model.avatar_url = avatar_url
    db.commit()
    db.refresh(user_model)
    return user_model


def _store_uploaded_file(
    file: UploadFile,
    *,
    filename_prefix: str,
    allowed_types: dict[str, set[str]],
) -> str:
    file_ext = Path(file.filename or "").suffix.lower()
    content_type = (file.content_type or "").lower()

    if file_ext not in allowed_types or content_type not in allowed_types[file_ext]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported upload type.",
        )

    try:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file.",
        ) from exc

    if file_size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Upload exceeds the 5MB limit.",
        )

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{filename_prefix}{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return filename


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
