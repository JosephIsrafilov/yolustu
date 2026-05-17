from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, Date, cast
from typing import List, Optional
from uuid import UUID
from datetime import date

from core.database import get_db
from api.deps import get_current_user
from models.models import Ride, User, Vehicle
from schemas.schemas import RideCreate, RideResponse

router = APIRouter()

@router.post("/", response_model=RideResponse)
def create_ride(ride_in: RideCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if ride_in.total_seats < 1 or ride_in.total_seats > 4:
        raise HTTPException(status_code=400, detail="total_seats must be between 1 and 4")
    if ride_in.available_seats < 0 or ride_in.available_seats > ride_in.total_seats:
        raise HTTPException(status_code=400, detail="available_seats must be between 0 and total_seats")
    if ride_in.price_per_seat <= 0:
        raise HTTPException(status_code=400, detail="price_per_seat must be positive")

    vehicle = None
    if ride_in.vehicle_id:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == ride_in.vehicle_id,
            Vehicle.user_id == current_user.id,
        ).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
    else:
        vehicle = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).first()
        if not vehicle:
            model_name = ride_in.car_model or "Car"
            vehicle = Vehicle(
                user_id=current_user.id,
                brand="Other",
                model=model_name,
                year=2020,
                color="Unknown",
                plate_number=f"AUTO-{str(current_user.id)[:8]}",
            )
            db.add(vehicle)
            db.flush()

    origin_pt = f"POINT({ride_in.origin.lon} {ride_in.origin.lat})"
    dest_pt = f"POINT({ride_in.destination.lon} {ride_in.destination.lat})"
    
    new_ride = Ride(
        driver_id=current_user.id,
        vehicle_id=vehicle.id,
        origin_location=origin_pt,
        origin_city=ride_in.origin_city,
        destination_location=dest_pt,
        destination_city=ride_in.destination_city,
        intermediate_cities=ride_in.intermediate_cities,
        departure_time=ride_in.departure_time,
        total_seats=ride_in.total_seats,
        available_seats=ride_in.available_seats,
        price_per_seat=ride_in.price_per_seat,
        status=ride_in.status,
        description=ride_in.description,
        
        smoking_allowed=ride_in.smoking_allowed,
        pets_allowed=ride_in.pets_allowed,
        music_allowed=ride_in.music_allowed,
        female_only=ride_in.female_only
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
    departure_date: Optional[date] = None,
    min_seats: int = 1,
    radius_meters: float = 10000,
    db: Session = Depends(get_db)
):
    query = db.query(Ride).filter(
        Ride.status == "active", Ride.available_seats >= min_seats)

    if departure_date:
        query = query.filter(cast(Ride.departure_time, Date) == departure_date)

    dist_origin = None
    dist_dest = None

    if origin_lat is not None and origin_lon is not None:
        origin_pt = f"POINT({origin_lon} {origin_lat})"
        origin_geom = func.ST_GeomFromText(origin_pt, 4326)
        query = query.filter(
            func.ST_DWithin(
                func.cast(Ride.origin_location, func.geography()),
                func.cast(origin_geom, func.geography()),
                radius_meters
            )
        )
        dist_origin = func.ST_Distance(
            func.cast(Ride.origin_location, func.geography()),
            func.cast(origin_geom, func.geography())
        )
    elif origin_city:
        query = query.filter(
            (Ride.origin_city.ilike(f"%{origin_city}%")) |
            (Ride.intermediate_cities.ilike(f"%{origin_city}%"))
        )

    if dest_lat is not None and dest_lon is not None:
        dest_pt = f"POINT({dest_lon} {dest_lat})"
        dest_geom = func.ST_GeomFromText(dest_pt, 4326)
        query = query.filter(
            func.ST_DWithin(
                func.cast(Ride.destination_location, func.geography()),
                func.cast(dest_geom, func.geography()),
                radius_meters
            )
        )
        dist_dest = func.ST_Distance(
            func.cast(Ride.destination_location, func.geography()),
            func.cast(dest_geom, func.geography())
        )
    elif dest_city:
        query = query.filter(
            (Ride.destination_city.ilike(f"%{dest_city}%")) |
            (Ride.intermediate_cities.ilike(f"%{dest_city}%"))
        )

    
    if dist_origin is not None and dist_dest is not None:
        query = query.order_by((dist_origin + dist_dest).asc())
    elif dist_origin is not None:
        query = query.order_by(dist_origin.asc())

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
    
    current_user.total_rides += 1
    
    db.commit()
    db.refresh(ride)
    return ride
