from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.admin.services import AdminService
from app.domains.bookings.schemas import BookingResponse
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.identity.schemas import UserResponse
from app.domains.trips.schemas import RideResponse

router = APIRouter()


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return AdminService(db).get_stats(current_user)


@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    return AdminService(db).get_users(current_user)


@router.patch("/users/{user_id}/block", response_model=UserResponse)
def block_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return AdminService(db).set_user_blocked(user_id, True, current_user)


@router.patch("/users/{user_id}/unblock", response_model=UserResponse)
def unblock_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return AdminService(db).set_user_blocked(user_id, False, current_user)


@router.get("/rides", response_model=list[RideResponse])
def get_rides(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    return AdminService(db).get_rides(current_user)


@router.delete("/rides/{ride_id}")
def delete_ride(
    ride_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return AdminService(db).delete_ride(ride_id, current_user)


@router.get("/bookings", response_model=list[BookingResponse])
def get_bookings(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    return AdminService(db).get_bookings(current_user)
