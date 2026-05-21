from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.trips.models import Ride, Vehicle
from app.domains.trips.repositories import RideRepository, VehicleRepository
from app.domains.trips.schemas import RideCreate, RideResponse, RideSearch, VehicleCreate, ride_to_response


class TripsService:
    def __init__(self, db: Session):
        self.rides = RideRepository(db)
        self.vehicles = VehicleRepository(db)
        self.users = UserRepository(db)

    def create_ride(self, ride_in: RideCreate, current_user: CurrentUser) -> RideResponse:
        if ride_in.total_seats < 1 or ride_in.total_seats > 4:
            raise HTTPException(status_code=400, detail="total_seats must be between 1 and 4")
        if ride_in.available_seats < 0 or ride_in.available_seats > ride_in.total_seats:
            raise HTTPException(status_code=400, detail="available_seats must be between 0 and total_seats")
        if ride_in.price_per_seat <= 0:
            raise HTTPException(status_code=400, detail="price_per_seat must be positive")

        if ride_in.vehicle_id:
            vehicle = self.vehicles.get_owned(ride_in.vehicle_id, current_user.id)
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")
        else:
            vehicle = self.vehicles.get_first_for_user(current_user.id)
            if not vehicle:
                vehicle = self.vehicles.create_default(current_user.id, ride_in.car_model or "Car")

        return ride_to_response(self.rides.create(current_user.id, vehicle.id, ride_in))

    def search_rides(
        self,
        origin_lat: Optional[float] = None,
        origin_lon: Optional[float] = None,
        dest_lat: Optional[float] = None,
        dest_lon: Optional[float] = None,
        origin_city: Optional[str] = None,
        dest_city: Optional[str] = None,
        departure_date: Optional[date] = None,
        min_seats: int = 1,
        radius_meters: float = 10000,
    ) -> list[RideResponse]:
        rides = self.rides.search(
            RideSearch(
                origin_lat=origin_lat,
                origin_lon=origin_lon,
                dest_lat=dest_lat,
                dest_lon=dest_lon,
                origin_city=origin_city,
                dest_city=dest_city,
                departure_date=departure_date,
                min_seats=min_seats,
                radius_meters=radius_meters,
            )
        )
        return [ride_to_response(ride) for ride in rides]

    def get_my_rides(self, current_user: CurrentUser) -> list[RideResponse]:
        return [ride_to_response(ride) for ride in self.rides.list_for_driver(current_user.id)]

    def get_ride_model(self, ride_id: UUID) -> Ride:
        ride = self.rides.get(ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        return ride

    def get_ride(self, ride_id: UUID) -> RideResponse:
        return ride_to_response(self.get_ride_model(ride_id))

    def cancel_ride(self, ride_id: UUID, current_user: CurrentUser) -> RideResponse:
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        ride.status = "cancelled"
        return ride_to_response(self.rides.save(ride))

    def complete_ride(self, ride_id: UUID, current_user: CurrentUser) -> RideResponse:
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        ride.status = "completed"
        self.users.increment_total_rides(current_user.id)
        return ride_to_response(self.rides.save(ride))

    def create_vehicle(self, vehicle_in: VehicleCreate, current_user: CurrentUser) -> Vehicle:
        return self.vehicles.create(current_user.id, vehicle_in)

    def get_my_vehicles(self, current_user: CurrentUser) -> list[Vehicle]:
        return self.vehicles.list_for_user(current_user.id)

    def get_vehicle(self, vehicle_id: UUID) -> Vehicle:
        vehicle = self.vehicles.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return vehicle

    def delete_vehicle(self, vehicle_id: UUID, current_user: CurrentUser):
        vehicle = self.get_vehicle(vehicle_id)
        if vehicle.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        self.vehicles.delete(vehicle)
        return {"message": "Vehicle deleted"}
