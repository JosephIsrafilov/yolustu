from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.identity.dependencies import CurrentUser
from app.domains.identity.repositories import UserRepository
from app.domains.lifecycle import (
    RIDE_ACTIVE,
    RIDE_BOARDING,
    RIDE_CANCELLED,
    RIDE_COMPLETED,
    can_transition_ride,
)
from app.domains.trips.models import Ride, Vehicle
from app.domains.trips.repositories import RideRepository, VehicleRepository
from app.domains.trips.schemas import (
    PublicTrackResponse,
    RideCreate,
    RideResponse,
    RideSearch,
    VehicleCreate,
    geometry_to_location,
    ride_to_public_track,
    ride_to_response,
)
from app.domains.gamification.services import check_and_award_badge
from app.core.pagination import PaginatedResponse, create_paginated_response


class TripsService:
    def __init__(self, db: Session):
        self.db = db
        self.rides = RideRepository(db)
        self.vehicles = VehicleRepository(db)
        self.users = UserRepository(db)

    def create_ride(
        self, ride_in: RideCreate, current_user: CurrentUser
    ) -> RideResponse:
        if not (
            current_user.role == "driver"
            and current_user.verification_status == "approved"
        ):
            raise HTTPException(
                status_code=403, detail="Only approved drivers can create rides"
            )

        if ride_in.total_seats < 1 or ride_in.total_seats > 4:
            raise HTTPException(
                status_code=400, detail="total_seats must be between 1 and 4"
            )
        if ride_in.available_seats < 0 or ride_in.available_seats > ride_in.total_seats:
            raise HTTPException(
                status_code=400,
                detail="available_seats must be between 0 and total_seats",
            )
        if ride_in.price_per_seat <= 0:
            raise HTTPException(
                status_code=400, detail="price_per_seat must be positive"
            )

        if ride_in.vehicle_id:
            vehicle = self.vehicles.get_owned(ride_in.vehicle_id, current_user.id)
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")
        else:
            vehicle = self.vehicles.get_first_for_user(current_user.id)
            if not vehicle:
                vehicle = self.vehicles.create_default(
                    current_user.id, ride_in.car_model or "Car"
                )

        ride_in = ride_in.model_copy(update={"status": RIDE_ACTIVE})
        return ride_to_response(self.rides.create(current_user.id, vehicle.id, ride_in))  # type: ignore[arg-type]

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
        female_only: Optional[bool] = None,
        smoking_allowed: Optional[bool] = None,
        pets_allowed: Optional[bool] = None,
        music_allowed: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginatedResponse:
        criteria = RideSearch(
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
        rides = self.rides.search(criteria)
        total = self.rides.search_count(criteria)
        items = [ride_to_response(ride) for ride in rides]
        page = (offset // limit) + 1 if limit > 0 else 1
        return create_paginated_response(items, total, page=page, size=limit)

    def get_my_rides(
        self, current_user: CurrentUser, limit: int = 50, offset: int = 0
    ) -> list[RideResponse]:
        return [
            ride_to_response(ride)
            for ride in self.rides.list_for_driver(
                current_user.id, limit=limit, offset=offset
            )
        ]

    def get_ride_model(self, ride_id: UUID) -> Ride:
        ride = self.rides.get(ride_id)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
        return ride

    def get_ride(self, ride_id: UUID) -> RideResponse:
        return ride_to_response(self.get_ride_model(ride_id))

    def cancel_ride(self, ride_id: UUID, current_user: CurrentUser) -> RideResponse:
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status == RIDE_CANCELLED:
            return ride_to_response(ride)
        if not can_transition_ride(ride.status, RIDE_CANCELLED):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Ride cannot be cancelled")
        ride.status = RIDE_CANCELLED  # type: ignore[assignment]
        return ride_to_response(self.rides.save(ride))

    def complete_ride(self, ride_id: UUID, current_user: CurrentUser) -> RideResponse:
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status == RIDE_COMPLETED:
            return ride_to_response(ride)
        if not can_transition_ride(ride.status, RIDE_COMPLETED):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Ride cannot be completed")
        ride.status = RIDE_COMPLETED  # type: ignore[assignment]
        self.users.increment_total_rides(ride.driver_id)  # type: ignore[arg-type]
        saved_ride = self.rides.save(ride)
        from app.domains.payments.services import PaymentService

        PaymentService(self.db).release_driver_earnings_for_ride(ride.id)  # type: ignore[arg-type]

        # Gamification: check rides count for driver
        driver = self.users.get_by_id(ride.driver_id)  # type: ignore[arg-type]
        if driver:
            if driver.total_rides >= 1:
                check_and_award_badge(self.db, driver.id, "first_ride")  # type: ignore[arg-type]
            if driver.total_rides >= 10:
                check_and_award_badge(self.db, driver.id, "veteran")  # type: ignore[arg-type]

        return ride_to_response(saved_ride)

    def start_boarding(self, ride_id: UUID, current_user: CurrentUser) -> RideResponse:
        """Transition a ride to BOARDING so the driver can mark passengers."""
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status == RIDE_BOARDING:
            return ride_to_response(ride)
        if not can_transition_ride(ride.status, RIDE_BOARDING):  # type: ignore[arg-type]
            raise HTTPException(
                status_code=400, detail="Ride cannot enter boarding from its current state"
            )
        ride.status = RIDE_BOARDING  # type: ignore[assignment]
        return ride_to_response(self.rides.save(ride))

    def get_simulation_endpoints(
        self, ride_id: UUID, current_user: CurrentUser
    ) -> tuple[tuple[float, float], tuple[float, float]]:
        """Authorize the driver and return ((o_lat, o_lng), (d_lat, d_lng)).

        The actual asyncio simulation task is owned by the router (it needs the
        running event loop); the service only validates and hands back coords.
        """
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status not in (RIDE_ACTIVE, RIDE_BOARDING):
            raise HTTPException(
                status_code=400, detail="Ride must be active or boarding to simulate"
            )
        origin = geometry_to_location(ride.origin_location)
        dest = geometry_to_location(ride.destination_location)
        if not isinstance(origin, dict) or not isinstance(dest, dict):
            raise HTTPException(
                status_code=400, detail="Ride is missing valid coordinates"
            )
        return (
            (float(origin["lat"]), float(origin["lon"])),
            (float(dest["lat"]), float(dest["lon"])),
        )

    def end_trip(self, ride_id: UUID, current_user: CurrentUser) -> RideResponse:
        """Mark the ride completed. Caller (router) stops the simulation."""
        ride = self.get_ride_model(ride_id)
        if ride.driver_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        if ride.status == RIDE_COMPLETED:
            return ride_to_response(ride)
        if not can_transition_ride(ride.status, RIDE_COMPLETED):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Ride cannot be completed")
        ride.status = RIDE_COMPLETED  # type: ignore[assignment]
        return ride_to_response(self.rides.save(ride))

    def get_public_track(self, share_token: str) -> PublicTrackResponse:
        ride = self.rides.get_by_share_token(share_token)
        if not ride:
            raise HTTPException(status_code=404, detail="Tracking link not found")
        return ride_to_public_track(ride)

    def verify_share_token(self, ride_id: UUID, share_token: str) -> bool:
        ride = self.rides.get(ride_id)
        return ride is not None and ride.share_token == share_token

    def create_vehicle(
        self, vehicle_in: VehicleCreate, current_user: CurrentUser
    ) -> Vehicle:
        if current_user.role not in ["driver", "admin"]:
            raise HTTPException(
                status_code=403, detail="Only drivers can create vehicles"
            )
        return self.vehicles.create(current_user.id, vehicle_in)

    def get_my_vehicles(self, current_user: CurrentUser) -> list[Vehicle]:
        return self.vehicles.list_for_user(current_user.id)

    def get_vehicle(self, vehicle_id: UUID) -> Vehicle:
        vehicle = self.vehicles.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return vehicle

    def delete_vehicle(self, vehicle_id: UUID, current_user: CurrentUser):
        if current_user.role not in ["driver", "admin"]:
            raise HTTPException(
                status_code=403, detail="Only drivers can delete vehicles"
            )
        vehicle = self.get_vehicle(vehicle_id)
        if vehicle.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        self.vehicles.delete(vehicle)
        return {"message": "Vehicle deleted"}
