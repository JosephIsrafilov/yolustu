from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.storage import get_storage
from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.domains.admin.repositories import AuditLogRepository
from app.domains.admin.schemas import AuditLogResponse
from app.domains.admin.services import AdminService
from app.domains.bookings.schemas import BookingResponse
from app.domains.identity.dependencies import CurrentUser, get_current_admin
from app.domains.identity.schemas import (
    AdminRoleUpdate,
    AdminUserCreate,
    UserResponse,
)
from app.domains.payments.schemas import PayoutRequestResponse
from app.domains.payments.services import PaymentService
from app.domains.trips.schemas import RideResponse

router = APIRouter()


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).get_stats(current_user)


@router.get("/users", response_model=PaginatedResponse[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    role: str | None = Query(None, pattern="^(passenger|driver|admin)$"),
    status: str = Query("all", pattern="^(active|blocked|all)$"),
    verification: str = Query("all", pattern="^(none|pending|approved|rejected|all)$"),
    q: str | None = Query(None, max_length=100),
):
    return AdminService(db).get_users(
        current_user,
        page=page,
        limit=limit,
        role=role,
        status=status,
        verification=verification,
        q=q,
    )


@router.post("/users", response_model=UserResponse)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).create_user(current_user, payload)


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: UUID,
    payload: AdminRoleUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).change_user_role(current_user, user_id, payload.role)


@router.patch("/users/{user_id}/block", response_model=UserResponse)
def block_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).set_user_blocked(user_id, True, current_user)


@router.patch("/users/{user_id}/unblock", response_model=UserResponse)
def unblock_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).set_user_blocked(user_id, False, current_user)


@router.get("/rides", response_model=PaginatedResponse[RideResponse])
def get_rides(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    return AdminService(db).get_rides(current_user, page=page, limit=limit)


@router.delete("/rides/{ride_id}")
def delete_ride(
    ride_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).delete_ride(ride_id, current_user)


@router.get("/bookings", response_model=PaginatedResponse[BookingResponse])
def get_bookings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    return AdminService(db).get_bookings(current_user, page=page, limit=limit)


@router.get("/verifications", response_model=PaginatedResponse[UserResponse])
def get_pending_verifications(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    return AdminService(db).get_pending_verifications(
        current_user, page=page, limit=limit
    )


@router.get("/verifications/{user_id}/document/{filename}")
def get_verification_document(
    user_id: UUID,
    filename: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    user = AdminService(db).get_verification_user(user_id, current_user)
    if not user.document_url:
        raise HTTPException(status_code=404, detail="Verification document not found")

    stored_filename = user.document_url.rsplit("/", 1)[-1]
    if filename != stored_filename or not filename.startswith("verification_"):
        raise HTTPException(status_code=404, detail="Verification document not found")

    storage = get_storage()

    # If using Supabase Storage, redirect to a time-limited signed URL.
    from app.core.storage import SupabaseStorage

    if isinstance(storage, SupabaseStorage):
        signed_url = storage.get_signed_url(
            filename, settings.STORAGE_BUCKET_VERIFICATIONS, expires_in=3600
        )
        return RedirectResponse(url=signed_url)

    # LocalStorage — serve from filesystem (works in both dev and prod-without-Supabase).
    from app.core.storage import LocalStorage as _LocalStorage

    if isinstance(storage, _LocalStorage):
        file_path = storage.get_local_path(
            filename, settings.STORAGE_BUCKET_VERIFICATIONS
        )
        if file_path and file_path.is_file():
            return FileResponse(str(file_path), filename=filename)

    raise HTTPException(status_code=404, detail="Verification document not found")


@router.patch("/verifications/{user_id}/approve", response_model=UserResponse)
def approve_verification(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).approve_verification(user_id, current_user)


@router.patch("/verifications/{user_id}/reject", response_model=UserResponse)
def reject_verification(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).reject_verification(user_id, current_user)


@router.post("/mock/journey")
def simulate_journey(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return AdminService(db).simulate_journey(current_user)


@router.get("/payouts", response_model=PaginatedResponse[PayoutRequestResponse])
def get_pending_payouts(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    return PaymentService(db).list_admin_payouts(current_user, page=page, limit=limit)


@router.patch("/payouts/{payout_id}/approve", response_model=PayoutRequestResponse)
def approve_payout(
    payout_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return PaymentService(db).approve_payout(payout_id, current_user)


@router.patch("/payouts/{payout_id}/reject", response_model=PayoutRequestResponse)
def reject_payout(
    payout_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
):
    return PaymentService(db).reject_payout(payout_id, current_user)


# Audit Logs
@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin_user_id: UUID | None = Query(None),
    resource_type: str | None = Query(None, pattern="^(user|ride|booking|payout)$"),
    resource_id: UUID | None = Query(None),
    action: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
):
    """Get audit logs with optional filters for forensics and compliance."""
    AdminService.require_admin(current_user)
    audit_repo = AuditLogRepository(db)
    skip = (page - 1) * limit

    items = audit_repo.list_logs(
        skip=skip,
        limit=limit,
        admin_user_id=admin_user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        start_date=start_date,
        end_date=end_date,
    )
    total = audit_repo.count_logs(
        admin_user_id=admin_user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        start_date=start_date,
        end_date=end_date,
    )

    from app.core.pagination import create_paginated_response

    return create_paginated_response(items, total, page, limit)


@router.get("/audit-logs/user/{user_id}", response_model=list[AuditLogResponse])
def get_user_audit_timeline(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all admin actions performed on a specific user."""
    AdminService.require_admin(current_user)
    audit_repo = AuditLogRepository(db)
    return audit_repo.get_user_activity_timeline(user_id, limit=limit)


@router.get("/audit-logs/recent", response_model=list[AuditLogResponse])
def get_recent_audit_activity(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_admin),
    limit: int = Query(10, ge=1, le=50),
):
    """Get recent audit log entries for admin dashboard."""
    AdminService.require_admin(current_user)
    audit_repo = AuditLogRepository(db)
    return audit_repo.get_recent_activity(limit=limit)
