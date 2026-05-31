from uuid import UUID

from sqlalchemy import Date, cast, func
from sqlalchemy.orm import Session

from app.domains.trips.models import Ride, Vehicle
from app.domains.trips.schemas import RideCreate, RideSearch, VehicleCreate
from app.domains.lifecycle import RIDE_ACTIVE


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: UUID, vehicle_in: VehicleCreate) -> Vehicle:
        vehicle = Vehicle(user_id=user_id, **vehicle_in.model_dump())
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def create_default(self, user_id: UUID, model_name: str) -> Vehicle:
        vehicle = Vehicle(
            user_id=user_id,
            brand="Other",
            model=model_name,
            year=2020,
            color="Unknown",
            plate_number=f"AUTO-{str(user_id)[:8]}",
        )
        self.db.add(vehicle)
        self.db.flush()
        return vehicle

    def get(self, vehicle_id: UUID) -> Vehicle | None:
        return self.db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    def get_owned(self, vehicle_id: UUID, user_id: UUID) -> Vehicle | None:
        return (
            self.db.query(Vehicle)
            .filter(Vehicle.id == vehicle_id, Vehicle.user_id == user_id)
            .first()
        )

    def get_first_for_user(self, user_id: UUID) -> Vehicle | None:
        return self.db.query(Vehicle).filter(Vehicle.user_id == user_id).first()

    def list_for_user(self, user_id: UUID) -> list[Vehicle]:
        return self.db.query(Vehicle).filter(Vehicle.user_id == user_id).all()

    def delete(self, vehicle: Vehicle):
        self.db.delete(vehicle)
        self.db.commit()


class RideRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, driver_id: UUID, vehicle_id: UUID, ride_in: RideCreate) -> Ride:
        ride = Ride(
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            origin_location=f"POINT({ride_in.origin.lon} {ride_in.origin.lat})",
            origin_city=ride_in.origin_city,
            destination_location=f"POINT({ride_in.destination.lon} {ride_in.destination.lat})",
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
            female_only=ride_in.female_only,
        )
        self.db.add(ride)
        self.db.commit()
        self.db.refresh(ride)
        return ride

    def get(self, ride_id: UUID) -> Ride | None:
        return self.db.query(Ride).filter(Ride.id == ride_id).first()

    def get_for_update(self, ride_id: UUID) -> Ride | None:
        return self.db.query(Ride).filter(Ride.id == ride_id).with_for_update().first()

    def list_for_driver(self, driver_id: UUID) -> list[Ride]:
        return self.db.query(Ride).filter(Ride.driver_id == driver_id).all()

    def count_all(self) -> int:
        return self.db.query(Ride).count()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[Ride]:
        return (
            self.db.query(Ride)
            .order_by(Ride.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def search(self, criteria: RideSearch) -> list[Ride]:
        query = self.db.query(Ride).filter(
            Ride.status == RIDE_ACTIVE, Ride.available_seats >= criteria.min_seats
        )

        if criteria.departure_date:
            query = query.filter(
                cast(Ride.departure_time, Date) == criteria.departure_date
            )

        dist_origin = None
        dist_dest = None

        if criteria.origin_lat is not None and criteria.origin_lon is not None:
            origin_pt = f"POINT({criteria.origin_lon} {criteria.origin_lat})"
            origin_geom = func.ST_GeomFromText(origin_pt, 4326)
            query = query.filter(
                func.ST_DWithin(
                    func.cast(Ride.origin_location, func.geography()),
                    func.cast(origin_geom, func.geography()),
                    criteria.radius_meters,
                )
            )
            dist_origin = func.ST_Distance(
                func.cast(Ride.origin_location, func.geography()),
                func.cast(origin_geom, func.geography()),
            )
        elif criteria.origin_city:
            query = query.filter(
                (Ride.origin_city.ilike(f"%{criteria.origin_city}%"))
                | (Ride.intermediate_cities.ilike(f"%{criteria.origin_city}%"))
            )

        if criteria.dest_lat is not None and criteria.dest_lon is not None:
            dest_pt = f"POINT({criteria.dest_lon} {criteria.dest_lat})"
            dest_geom = func.ST_GeomFromText(dest_pt, 4326)
            query = query.filter(
                func.ST_DWithin(
                    func.cast(Ride.destination_location, func.geography()),
                    func.cast(dest_geom, func.geography()),
                    criteria.radius_meters,
                )
            )
            dist_dest = func.ST_Distance(
                func.cast(Ride.destination_location, func.geography()),
                func.cast(dest_geom, func.geography()),
            )
        elif criteria.dest_city:
            query = query.filter(
                (Ride.destination_city.ilike(f"%{criteria.dest_city}%"))
                | (Ride.intermediate_cities.ilike(f"%{criteria.dest_city}%"))
            )

        if dist_origin is not None and dist_dest is not None:
            query = query.order_by((dist_origin + dist_dest).asc())
        elif dist_origin is not None:
            query = query.order_by(dist_origin.asc())

        if criteria.female_only is not None:
            query = query.filter(Ride.female_only == criteria.female_only)
        if criteria.smoking_allowed is not None:
            query = query.filter(Ride.smoking_allowed == criteria.smoking_allowed)
        if criteria.pets_allowed is not None:
            query = query.filter(Ride.pets_allowed == criteria.pets_allowed)
        if criteria.music_allowed is not None:
            query = query.filter(Ride.music_allowed == criteria.music_allowed)

        return query.all()

    def save(self, ride: Ride) -> Ride:
        self.db.commit()
        self.db.refresh(ride)
        return ride

    def delete(self, ride: Ride):
        self.db.delete(ride)
        self.db.commit()
