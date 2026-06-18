import os
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    status,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.cache import cache_response
from app.core.config import UPLOADS_DIR, VERIFICATION_UPLOADS_DIR, settings
from app.core.database import get_db
from app.core.storage import get_storage
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
@cache_response(prefix="user:me", ttl=60)  # 1 minute cache for current user
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes, filename, content_type = _validate_and_read_file(
        file,
        filename_prefix="verification_",
        allowed_types=VERIFICATION_UPLOAD_TYPES,
    )
    storage = get_storage()
    storage.upload(
        file_bytes,
        filename,
        content_type,
        settings.STORAGE_BUCKET_VERIFICATIONS,
    )
    document_url = f"/api/v1/admin/verifications/{current_user.id}/document/{filename}"

    # Always keep a local copy for the AI document review task (reads from filesystem).
    VERIFICATION_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    (VERIFICATION_UPLOADS_DIR / filename).write_bytes(file_bytes)

    user = IdentityService(db).submit_verification(current_user, document_url)

    # Advisory AI pre-screen, fire-and-forget.
    from app.domains.ai.document_review import run_document_review_task

    local_path = str(VERIFICATION_UPLOADS_DIR / filename)
    background_tasks.add_task(
        run_document_review_task,
        local_path,
        content_type,
        str(user.id),
        user.first_name,
        user.last_name,
    )

    return user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes, filename, content_type = _validate_and_read_file(
        file,
        filename_prefix="avatar_",
        allowed_types=AVATAR_UPLOAD_TYPES,
    )
    storage = get_storage()
    avatar_url = storage.upload(
        file_bytes,
        filename,
        content_type,
        settings.STORAGE_BUCKET_AVATARS,
    )

    user_model = IdentityService(db).get_current_user_model(current_user)
    user_model.avatar_url = avatar_url  # type: ignore[assignment]
    db.commit()
    db.refresh(user_model)
    return user_model


def _validate_and_read_file(
    file: UploadFile,
    *,
    filename_prefix: str,
    allowed_types: dict[str, set[str]],
) -> tuple[bytes, str, str]:
    """Validate an uploaded file and return (file_bytes, filename, content_type).

    Replaces _store_uploaded_file — separates validation from storage so the
    caller can route to LocalStorage or SupabaseStorage.
    """
    file_ext = Path(file.filename or "").suffix.lower()
    content_type = (file.content_type or "").lower()

    if file_ext not in allowed_types or content_type not in allowed_types[file_ext]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported upload type.",
        )

    detected_content_type = _detect_content_type(file)
    if (
        detected_content_type != content_type
        or detected_content_type not in allowed_types[file_ext]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match its extension or content type.",
        )

    try:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file.",
        ) from exc

    if file_size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Upload exceeds the 5MB limit.",
        )

    file_bytes = file.file.read()
    filename = f"{filename_prefix}{uuid.uuid4()}{file_ext}"
    return file_bytes, filename, content_type


def _store_uploaded_file(
    file: UploadFile,
    *,
    filename_prefix: str,
    allowed_types: dict[str, set[str]],
    destination: Path = UPLOADS_DIR,
) -> str:
    """Write an uploaded file to the local filesystem and return the filename.

    Deprecated: use _validate_and_read_file + StorageBackend.upload() instead.
    Retained for backward compatibility with any external callers.
    """

    file_bytes, filename, _ct = _validate_and_read_file(
        file,
        filename_prefix=filename_prefix,
        allowed_types=allowed_types,
    )
    destination.mkdir(parents=True, exist_ok=True)
    (destination / filename).write_bytes(file_bytes)
    return filename


def _detect_content_type(file: UploadFile) -> str | None:
    try:
        file.file.seek(0)
        header = file.file.read(16)
        file.file.seek(0)
    except Exception:
        return None

    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if header.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "image/webp"
    if header.startswith(b"%PDF-"):
        return "application/pdf"
    return None


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
