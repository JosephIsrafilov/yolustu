from uuid import UUID

from sqlalchemy.orm import Session

from app.domains.trips.models import Ride
from app.domains.trips.repositories import RideRepository


class RideLookupPort:
    def __init__(self, db: Session):
        self.rides = RideRepository(db)

    def get_ride(self, ride_id: UUID) -> Ride | None:
        return self.rides.get(ride_id)

    def get_ride_for_update(self, ride_id: UUID) -> Ride | None:
        return self.rides.get_for_update(ride_id)

    @staticmethod
    def is_driver(ride: Ride, user_id: UUID) -> bool:
        return ride.driver_id == user_id  # type: ignore[return-value]
