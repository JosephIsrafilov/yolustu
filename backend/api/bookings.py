from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from typing import List

from uuid import UUID

from core.database import get_db

from api.deps import get_current_user

from models.models import Booking, Ride, User

from schemas.schemas import BookingCreate, BookingResponse

router = APIRouter()

@router.post("/", response_model=BookingResponse)

def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    ride = db.query(Ride).filter(Ride.id == booking_in.ride_id).with_for_update().first()

    if not ride:

        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.available_seats < booking_in.seats_booked:

        raise HTTPException(status_code=400, detail="Not enough available seats")

    if ride.driver_id == current_user.id:

        raise HTTPException(status_code=400, detail="You cannot book your own ride")

    new_booking = Booking(

        ride_id=ride.id,

        passenger_id=current_user.id,

        seats_booked=booking_in.seats_booked,

        status="pending"

    )

    db.add(new_booking)

    db.commit()

    db.refresh(new_booking)

    return new_booking

@router.get("/my", response_model=List[BookingResponse])

def get_my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    return db.query(Booking).filter(Booking.passenger_id == current_user.id).all()

@router.get("/requests", response_model=List[BookingResponse])

def get_booking_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    return db.query(Booking).join(Ride).filter(Ride.driver_id == current_user.id).all()

@router.post("/{booking_id}/confirm", response_model=BookingResponse)

def confirm_booking(booking_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:

        raise HTTPException(status_code=404, detail="Booking not found")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()

    if ride.driver_id != current_user.id:

        raise HTTPException(status_code=403, detail="Only the driver can confirm this booking")

    if booking.status != "pending":

        raise HTTPException(status_code=400, detail="Booking is not pending")

    if ride.available_seats < booking.seats_booked:

        raise HTTPException(status_code=400, detail="Not enough seats left")

    booking.status = "accepted"

    ride.available_seats -= booking.seats_booked

    db.commit()

    db.refresh(booking)

    return booking

@router.post("/{booking_id}/reject", response_model=BookingResponse)

def reject_booking(booking_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:

        raise HTTPException(status_code=404, detail="Booking not found")

    ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()

    if ride.driver_id != current_user.id:

        raise HTTPException(status_code=403, detail="Only the driver can reject this booking")

    booking.status = "rejected"

    db.commit()

    db.refresh(booking)

    return booking

@router.post("/{booking_id}/cancel", response_model=BookingResponse)

def cancel_booking(booking_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:

        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.passenger_id != current_user.id:

        raise HTTPException(status_code=403, detail="Only the passenger can cancel this booking")

    if booking.status == "accepted":

        ride = db.query(Ride).filter(Ride.id == booking.ride_id).first()

        ride.available_seats += booking.seats_booked

    booking.status = "cancelled"

    db.commit()

    db.refresh(booking)

    return booking

