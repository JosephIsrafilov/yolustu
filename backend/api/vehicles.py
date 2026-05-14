from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from core.database import get_db
from api.deps import get_current_user
from models.models import Vehicle, User
from schemas.schemas import VehicleCreate, VehicleResponse

router = APIRouter()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle_in: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_vehicle = Vehicle(
        user_id=current_user.id,
        brand=vehicle_in.brand,
        model=vehicle_in.model,
        year=vehicle_in.year,
        color=vehicle_in.color,
        plate_number=vehicle_in.plate_number
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle

@router.get("/my", response_model=List[VehicleResponse])
def get_my_vehicles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Vehicle).filter(Vehicle.user_id == current_user.id).all()

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: UUID, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted"}
