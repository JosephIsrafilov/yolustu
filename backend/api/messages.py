from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from core.database import get_db
from api.deps import get_current_user
from models.models import Message, Ride, User, Booking
from schemas.schemas import MessageCreate, MessageResponse

router = APIRouter()

@router.post("/", response_model=MessageResponse)
def send_message(message_in: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == message_in.ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    # Only driver or accepted passengers can send messages
    is_driver = ride.driver_id == current_user.id
    is_passenger = db.query(Booking).filter(
        Booking.ride_id == ride.id,
        Booking.passenger_id == current_user.id,
        Booking.status == "accepted"
    ).first() is not None
    
    if not (is_driver or is_passenger):
        raise HTTPException(status_code=403, detail="Only participants can send messages")
    
    new_message = Message(
        ride_id=message_in.ride_id,
        sender_id=current_user.id,
        content=message_in.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@router.get("/ride/{ride_id}", response_model=List[MessageResponse])
def get_ride_messages(ride_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
        
    # Check if user is participant
    is_driver = ride.driver_id == current_user.id
    is_passenger = db.query(Booking).filter(
        Booking.ride_id == ride.id,
        Booking.passenger_id == current_user.id,
        Booking.status == "accepted"
    ).first() is not None
    
    if not (is_driver or is_passenger):
        raise HTTPException(status_code=403, detail="Only participants can read messages")
        
    return db.query(Message).filter(Message.ride_id == ride_id).order_by(Message.created_at.asc()).all()
