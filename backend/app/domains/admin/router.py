from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.pagination import PaginatedResponse
from app.core.database import get_db
from app.domains.admin.services import AdminService
from app.domains.bookings.schemas import BookingResponse
from app.domains.identity.dependencies import CurrentUser, get_current_admin
from app.domains.identity.schemas import UserResponse
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
):
    return AdminService(db).get_users(current_user, page=page, limit=limit)


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
