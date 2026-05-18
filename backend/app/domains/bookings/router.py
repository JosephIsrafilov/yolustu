from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.bookings.schemas import BookingCreate, BookingResponse
from app.domains.bookings.services import BookingsService
from app.domains.identity.dependencies import CurrentUser, get_current_user

router = APIRouter()


@router.post("/", response_model=BookingResponse)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return BookingsService(db).create_booking(booking_in, current_user)


@router.get("/my", response_model=List[BookingResponse])
def get_my_bookings(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return BookingsService(db).get_my_bookings(current_user)


@router.get("/requests", response_model=List[BookingResponse])
def get_booking_requests(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return BookingsService(db).get_booking_requests(current_user)


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return BookingsService(db).confirm_booking(booking_id, current_user)


@router.post("/{booking_id}/reject", response_model=BookingResponse)
def reject_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return BookingsService(db).reject_booking(booking_id, current_user)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return BookingsService(db).cancel_booking(booking_id, current_user)
