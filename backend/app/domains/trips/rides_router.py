from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.core.cache import cache_response
from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.trips.schemas import RideCreate, RideResponse
from app.domains.trips.services import TripsService

router = APIRouter()


@router.post("/", response_model=RideResponse)
@limiter.limit("5/minute")
def create_ride(
    request: Request,
    ride_in: RideCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).create_ride(ride_in, current_user)


@router.get("/search", response_model=PaginatedResponse[RideResponse])
@cache_response(prefix="rides:search", ttl=180)  # 3 minutes cache for search results
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
    female_only: Optional[bool] = None,
    smoking_allowed: Optional[bool] = None,
    pets_allowed: Optional[bool] = None,
    music_allowed: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return TripsService(db).search_rides(
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        origin_city=origin_city,
        dest_city=dest_city,
        departure_date=departure_date,
        min_seats=min_seats,
        radius_meters=radius_meters,
        female_only=female_only,
        smoking_allowed=smoking_allowed,
        pets_allowed=pets_allowed,
        music_allowed=music_allowed,
        limit=limit,
        offset=offset,
    )


@router.get("/my", response_model=List[RideResponse])
@cache_response(prefix="rides:my", ttl=120)  # 2 minutes cache for user's rides
def get_my_rides(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TripsService(db).get_my_rides(current_user, limit=limit, offset=offset)


@router.get("/{ride_id}", response_model=RideResponse)
@cache_response(prefix="ride", ttl=300)  # 5 minutes cache for individual rides
def get_ride(ride_id: UUID, db: Session = Depends(get_db)):
    return TripsService(db).get_ride(ride_id)


@router.patch("/{ride_id}/cancel", response_model=RideResponse)
def cancel_ride(
    ride_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).cancel_ride(ride_id, current_user)


@router.patch("/{ride_id}/complete", response_model=RideResponse)
def complete_ride(
    ride_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).complete_ride(ride_id, current_user)
