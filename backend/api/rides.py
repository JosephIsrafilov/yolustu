from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from core.database import get_db
from api.deps import get_current_user
from models.models import Ride, User
from schemas.schemas import RideCreate, RideResponse

router = APIRouter()

@router.post("/", response_model=RideResponse)
def create_ride(ride_in: RideCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Create GeoAlchemy2 point strings
    origin_pt = f"POINT({ride_in.origin.lon} {ride_in.origin.lat})"
    dest_pt = f"POINT({ride_in.destination.lon} {ride_in.destination.lat})"

    new_ride = Ride(
        driver_id=current_user.id,
        vehicle_id=ride_in.vehicle_id,
        origin_location=origin_pt,
        origin_city=ride_in.origin_city,
        destination_location=dest_pt,
        destination_city=ride_in.destination_city,
        departure_time=ride_in.departure_time,
        total_seats=ride_in.total_seats,
        available_seats=ride_in.available_seats,
        price_per_seat=ride_in.price_per_seat,
        status=ride_in.status,
        description=ride_in.description
    )
    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    return new_ride

@router.get("/search", response_model=List[RideResponse])
def search_rides(
    origin_lat: Optional[float] = None, 
    origin_lon: Optional[float] = None, 
    dest_lat: Optional[float] = None, 
    dest_lon: Optional[float] = None, 
    origin_city: Optional[str] = None,
    dest_city: Optional[str] = None,
    radius_meters: float = 5000,
    db: Session = Depends(get_db)
):
    query = db.query(Ride).filter(Ride.status == "active")

    if origin_lat is not None and origin_lon is not None:
        origin_pt = f"POINT({origin_lon} {origin_lat})"
        query = query.filter(
            func.ST_DWithin(func.cast(Ride.origin_location, func.geography()), func.cast(func.ST_GeomFromText(origin_pt, 4326), func.geography()), radius_meters)
        )
    elif origin_city:
        query = query.filter(Ride.origin_city.ilike(f"%{origin_city}%"))

    if dest_lat is not None and dest_lon is not None:
        dest_pt = f"POINT({dest_lon} {dest_lat})"
        query = query.filter(
            func.ST_DWithin(func.cast(Ride.destination_location, func.geography()), func.cast(func.ST_GeomFromText(dest_pt, 4326), func.geography()), radius_meters)
        )
    elif dest_city:
        query = query.filter(Ride.destination_city.ilike(f"%{dest_city}%"))
    
    return query.all()

@router.get("/my", response_model=List[RideResponse])
def get_my_rides(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Ride).filter(Ride.driver_id == current_user.id).all()

@router.get("/{ride_id}", response_model=RideResponse)
def get_ride(ride_id: UUID, db: Session = Depends(get_db)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride

@router.patch("/{ride_id}/cancel", response_model=RideResponse)
def cancel_ride(ride_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ride.status = "cancelled"
    db.commit()
    db.refresh(ride)
    return ride

@router.patch("/{ride_id}/complete", response_model=RideResponse)
def complete_ride(ride_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ride.status = "completed"
    db.commit()
    db.refresh(ride)
    return ride

