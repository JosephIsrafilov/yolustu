from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from core.database import get_db
from api.deps import get_current_user
from models.models import Message, Ride, User, Booking
from schemas.schemas import MessageCreate, MessageResponse
from core.websocket import manager
from fastapi import WebSocket, WebSocketDisconnect

router = APIRouter()

@router.post("/", response_model=MessageResponse)
async def send_message(message_in: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == message_in.ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    
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
    
    
    message_data = {
        "id": str(new_message.id),
        "ride_id": str(new_message.ride_id),
        "sender_id": str(new_message.sender_id),
        "content": new_message.content,
        "created_at": str(new_message.created_at),
        "sender_name": f"{current_user.first_name} {current_user.last_name}"
    }
    await manager.broadcast_to_ride(message_data, message_in.ride_id)
    
    return new_message

@router.websocket("/ws/{ride_id}")
async def websocket_endpoint(websocket: WebSocket, ride_id: UUID):
    await manager.connect(websocket, ride_id)
    try:
        while True:
            
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, ride_id)

@router.get("/ride/{ride_id}", response_model=List[MessageResponse])
def get_ride_messages(ride_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
        
    
    is_driver = ride.driver_id == current_user.id
    is_passenger = db.query(Booking).filter(
        Booking.ride_id == ride.id,
        Booking.passenger_id == current_user.id,
        Booking.status == "accepted"
    ).first() is not None
    
    if not (is_driver or is_passenger):
        raise HTTPException(status_code=403, detail="Only participants can read messages")
        
    return db.query(Message).filter(Message.ride_id == ride_id).order_by(Message.created_at.asc()).all()
