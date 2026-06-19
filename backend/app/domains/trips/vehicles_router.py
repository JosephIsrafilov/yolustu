import hashlib
import logging
from typing import List
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.storage import get_storage
from app.core.config import settings
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.identity.users_router import (
    VERIFICATION_UPLOAD_TYPES,
    _validate_and_read_file,
)
from app.domains.trips.schemas import (
    VehicleCreate,
    VehicleDocumentResponse,
    VehicleResponse,
    VehicleUpdate,
    VehicleVerificationStatusResponse,
)
from app.domains.trips.services import TripsService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=VehicleResponse)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).create_vehicle(vehicle_in, current_user)


@router.get("/my", response_model=List[VehicleResponse])
def get_my_vehicles(
    current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    return TripsService(db).get_my_vehicles(current_user)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).get_vehicle(vehicle_id, current_user)


@router.patch("/{vehicle_id}", response_model=VehicleResponse)
@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: UUID,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).update_vehicle(vehicle_id, vehicle_in, current_user)


@router.post("/{vehicle_id}/set-default", response_model=VehicleResponse)
def set_default_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).set_default_vehicle(vehicle_id, current_user)


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).delete_vehicle(vehicle_id, current_user)


@router.post("/{vehicle_id}/documents", response_model=VehicleDocumentResponse)
async def upload_vehicle_document(
    vehicle_id: UUID,
    document_type: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if document_type not in ("registration", "insurance", "inspection"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="document_type must be one of: registration, insurance, inspection",
        )

    file_bytes, filename, content_type = _validate_and_read_file(
        file,
        filename_prefix=f"vehicle_{document_type}_",
        allowed_types=VERIFICATION_UPLOAD_TYPES,
    )

    sha256 = hashlib.sha256(file_bytes).hexdigest()
    storage_key = f"vehicle_docs/{vehicle_id}/{filename}"
    storage = get_storage()

    try:
        storage.upload(
            file_bytes, storage_key, content_type, settings.STORAGE_BUCKET_VERIFICATIONS
        )
    except Exception as exc:
        logger.exception("Vehicle document upload failed for vehicle %s", vehicle_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Document could not be stored.",
        ) from exc

    trips = TripsService(db)
    try:
        doc = trips.upload_vehicle_document(
            vehicle_id=vehicle_id,
            current_user=current_user,
            document_type=document_type,
            storage_key=storage_key,
            mime_type=content_type,
            size_bytes=len(file_bytes),
            sha256=sha256,
        )
    except HTTPException:
        storage.delete(storage_key, settings.STORAGE_BUCKET_VERIFICATIONS)
        raise
    except Exception as exc:
        storage.delete(storage_key, settings.STORAGE_BUCKET_VERIFICATIONS)
        logger.exception(
            "Vehicle document record creation failed for vehicle %s", vehicle_id
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Document record could not be created.",
        ) from exc

    # AI pre-screen (images only; PDFs go straight to manual review)
    if content_type in ("image/jpeg", "image/png"):
        from app.domains.ai.vehicle_document_review import (
            run_vehicle_document_review_task,
        )

        background_tasks.add_task(
            run_vehicle_document_review_task,
            file_bytes,
            content_type,
            str(doc.id),
            document_type,
            storage_key,
        )

    return doc


@router.get("/{vehicle_id}/documents", response_model=List[VehicleDocumentResponse])
def get_vehicle_documents(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).get_vehicle_documents(vehicle_id, current_user)


@router.get(
    "/{vehicle_id}/verification", response_model=VehicleVerificationStatusResponse
)
def get_vehicle_verification_status(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).get_vehicle_verification_status(vehicle_id, current_user)
