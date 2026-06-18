from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domains.identity.dependencies import CurrentUser, get_current_user
from app.domains.trips.schemas import VehicleCreate, VehicleResponse
from app.domains.trips.services import TripsService

router = APIRouter()


@router.post("", response_model=VehicleResponse)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).create_vehicle(vehicle_in, current_user)


@router.get("/my", response_model=List[VehicleResponse])
def get_my_vehicles(
    current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    return TripsService(db).get_my_vehicles(current_user)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: UUID, db: Session = Depends(get_db)):
    return TripsService(db).get_vehicle(vehicle_id)


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return TripsService(db).delete_vehicle(vehicle_id, current_user)
