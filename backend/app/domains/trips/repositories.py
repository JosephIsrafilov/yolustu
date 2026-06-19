from uuid import UUID

from geoalchemy2 import Geography
from sqlalchemy import and_, cast, func, or_
from sqlalchemy.orm import Session

from app.domains.trips.models import Ride, RideSeat, SEAT_SPOTS, Vehicle, VehicleDocument
from app.domains.trips.schemas import (
    RideCreate,
    RideSearch,
    VehicleCreate,
    normalize_plate,
)
from app.domains.lifecycle import RIDE_ACTIVE, RIDE_BOARDING
from datetime import date as date_type, datetime, time, timezone


def ride_search_window_start(departure_date: "date_type | None") -> "datetime | None":
    """Return the inclusive lower bound for ``departure_time`` implied by a search
    date, or ``None`` when no date is supplied.

    A supplied ``departure_date`` is treated as the start of a forward window
    (rides on that calendar day *or later*), not an exact same-day match. This
    keeps real-mode search useful: clients that always send "today" still see
    every upcoming ride instead of only the handful departing in the remaining
    hours of the current day.
    """
    if departure_date is None:
        return None
    return datetime.combine(departure_date, time.min, tzinfo=timezone.utc)


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: UUID, vehicle_in: VehicleCreate) -> Vehicle:
        is_first_active = (
            self.db.query(Vehicle.id)
            .filter(Vehicle.user_id == user_id, Vehicle.is_active.is_(True))
            .first()
            is None
        )
        vehicle = Vehicle(
            user_id=user_id,
            normalized_plate=normalize_plate(vehicle_in.plate_number),
            is_active=True,
            is_default=is_first_active,
            **vehicle_in.model_dump(),
        )
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def update(self, vehicle: Vehicle, update_data: dict) -> Vehicle:
        for field, value in update_data.items():
            setattr(vehicle, field, value)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def get(self, vehicle_id: UUID) -> Vehicle | None:
        return self.db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    def get_owned(self, vehicle_id: UUID, user_id: UUID) -> Vehicle | None:
        return (
            self.db.query(Vehicle)
            .filter(Vehicle.id == vehicle_id, Vehicle.user_id == user_id)
            .first()
        )

    def list_for_user(self, user_id: UUID) -> list[Vehicle]:
        return (
            self.db.query(Vehicle)
            .filter(Vehicle.user_id == user_id)
            .order_by(
                Vehicle.is_active.desc(),
                Vehicle.is_default.desc(),
                Vehicle.created_at.asc(),
                Vehicle.id.asc(),
            )
            .all()
        )

    def find_active_by_plate(
        self, normalized_plate: str, exclude_id: UUID | None = None
    ) -> Vehicle | None:
        query = self.db.query(Vehicle).filter(
            Vehicle.normalized_plate == normalized_plate,
            Vehicle.is_active.is_(True),
        )
        if exclude_id is not None:
            query = query.filter(Vehicle.id != exclude_id)
        return query.first()

    def set_default(self, vehicle: Vehicle) -> Vehicle:
        self.db.query(Vehicle).filter(
            Vehicle.user_id == vehicle.user_id,
            Vehicle.is_active.is_(True),
            Vehicle.id != vehicle.id,
        ).update({Vehicle.is_default: False}, synchronize_session=False)
        vehicle.is_default = True  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def has_active_or_future_rides(self, vehicle_id: UUID) -> bool:
        now = datetime.now(timezone.utc)
        return (
            self.db.query(Ride.id)
            .filter(
                Ride.vehicle_id == vehicle_id,
                or_(
                    Ride.status.in_((RIDE_ACTIVE, RIDE_BOARDING)),
                    and_(
                        Ride.departure_time >= now,
                        Ride.status.notin_(("cancelled", "completed")),
                    ),
                ),
            )
            .first()
            is not None
        )

    def deactivate(self, vehicle: Vehicle) -> Vehicle:
        was_default = bool(vehicle.is_default)
        vehicle.is_active = False  # type: ignore[assignment]
        vehicle.is_default = False  # type: ignore[assignment]
        if was_default:
            replacement = (
                self.db.query(Vehicle)
                .filter(
                    Vehicle.user_id == vehicle.user_id,
                    Vehicle.is_active.is_(True),
                    Vehicle.id != vehicle.id,
                )
                .order_by(Vehicle.created_at.asc(), Vehicle.id.asc())
                .first()
            )
            if replacement is not None:
                replacement.is_default = True  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle


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
            available_spots=ride_in.available_spots,
            price_per_seat=ride_in.price_per_seat,
            status=ride_in.status,
            description=ride_in.description,
            smoking_allowed=ride_in.smoking_allowed,
            pets_allowed=ride_in.pets_allowed,
            music_allowed=ride_in.music_allowed,
            female_only=ride_in.female_only,
        )
        self.db.add(ride)
        self.db.flush()
        for spot in SEAT_SPOTS[: ride_in.total_seats]:
            self.db.add(
                RideSeat(
                    ride_id=ride.id,
                    spot=spot,
                    is_enabled=spot in (ride_in.available_spots or []),
                )
            )
        self.db.commit()
        self.db.refresh(ride)
        return ride

    def get(self, ride_id: UUID) -> Ride | None:
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Ride)
            .options(joinedload(Ride.driver), joinedload(Ride.vehicle))
            .filter(Ride.id == ride_id)
            .first()
        )

    def get_by_share_token(self, share_token: str) -> Ride | None:
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Ride)
            .options(joinedload(Ride.driver), joinedload(Ride.vehicle))
            .filter(Ride.share_token == share_token)
            .first()
        )

    def get_for_update(self, ride_id: UUID) -> Ride | None:
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Ride)
            .options(joinedload(Ride.driver), joinedload(Ride.vehicle))
            .filter(Ride.id == ride_id)
            .with_for_update(of=Ride)
            .first()
        )

    def list_for_driver(
        self, driver_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[Ride]:
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Ride)
            .options(joinedload(Ride.driver), joinedload(Ride.vehicle))
            .filter(Ride.driver_id == driver_id)
            .order_by(Ride.departure_time.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_all(self) -> int:
        return self.db.query(Ride).count()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[Ride]:
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Ride)
            .options(joinedload(Ride.driver), joinedload(Ride.vehicle))
            .order_by(Ride.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def search(self, criteria: RideSearch) -> list[Ride]:
        from sqlalchemy.orm import joinedload

        query = (
            self.db.query(Ride)
            .options(joinedload(Ride.driver), joinedload(Ride.vehicle))
            .filter(
                Ride.status == RIDE_ACTIVE,
                Ride.available_seats >= criteria.min_seats,
                Ride.departure_time > datetime.now(timezone.utc),
            )
        )

        window_start = ride_search_window_start(criteria.departure_date)
        if window_start is not None:
            query = query.filter(Ride.departure_time >= window_start)

        dist_origin = None
        dist_dest = None
        geography_type = Geography(geometry_type="POINT", srid=4326)

        if criteria.origin_lat is not None and criteria.origin_lon is not None:
            origin_pt = f"POINT({criteria.origin_lon} {criteria.origin_lat})"
            origin_geom = func.ST_GeomFromText(origin_pt, 4326)
            query = query.filter(
                func.ST_DWithin(
                    cast(Ride.origin_location, geography_type),
                    cast(origin_geom, geography_type),
                    criteria.radius_meters,
                )
            )
            dist_origin = func.ST_Distance(
                cast(Ride.origin_location, geography_type),
                cast(origin_geom, geography_type),
            )
        elif criteria.origin_city:
            query = query.filter(
                (Ride.origin_city == criteria.origin_city)
                | (Ride.intermediate_cities.ilike(f"%{criteria.origin_city}%"))
            )

        if criteria.dest_lat is not None and criteria.dest_lon is not None:
            dest_pt = f"POINT({criteria.dest_lon} {criteria.dest_lat})"
            dest_geom = func.ST_GeomFromText(dest_pt, 4326)
            query = query.filter(
                func.ST_DWithin(
                    cast(Ride.destination_location, geography_type),
                    cast(dest_geom, geography_type),
                    criteria.radius_meters,
                )
            )
            dist_dest = func.ST_Distance(
                cast(Ride.destination_location, geography_type),
                cast(dest_geom, geography_type),
            )
        elif criteria.dest_city:
            query = query.filter(
                (Ride.destination_city == criteria.dest_city)
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

        return query.offset(criteria.offset).limit(criteria.limit).all()

    def search_count(self, criteria: "RideSearch") -> int:
        """Return the total number of rides matching search criteria (no LIMIT)."""
        from datetime import datetime, timezone
        from geoalchemy2 import Geography
        from sqlalchemy import cast, func

        geography_type = Geography(geometry_type="POINT", srid=4326)

        query = self.db.query(Ride).filter(
            Ride.status == RIDE_ACTIVE,
            Ride.available_seats >= criteria.min_seats,
            Ride.departure_time > datetime.now(timezone.utc),
        )

        window_start = ride_search_window_start(criteria.departure_date)
        if window_start is not None:
            query = query.filter(Ride.departure_time >= window_start)

        if criteria.origin_lat is not None and criteria.origin_lon is not None:
            origin_pt = f"POINT({criteria.origin_lon} {criteria.origin_lat})"
            origin_geom = func.ST_GeomFromText(origin_pt, 4326)
            query = query.filter(
                func.ST_DWithin(
                    cast(Ride.origin_location, geography_type),
                    cast(origin_geom, geography_type),
                    criteria.radius_meters,
                )
            )
        elif criteria.origin_city:
            query = query.filter(
                (Ride.origin_city == criteria.origin_city)
                | (Ride.intermediate_cities.ilike(f"%{criteria.origin_city}%"))
            )

        if criteria.dest_lat is not None and criteria.dest_lon is not None:
            dest_pt = f"POINT({criteria.dest_lon} {criteria.dest_lat})"
            dest_geom = func.ST_GeomFromText(dest_pt, 4326)
            query = query.filter(
                func.ST_DWithin(
                    cast(Ride.destination_location, geography_type),
                    cast(dest_geom, geography_type),
                    criteria.radius_meters,
                )
            )
        elif criteria.dest_city:
            query = query.filter(
                (Ride.destination_city == criteria.dest_city)
                | (Ride.intermediate_cities.ilike(f"%{criteria.dest_city}%"))
            )

        if criteria.female_only is not None:
            query = query.filter(Ride.female_only == criteria.female_only)
        if criteria.smoking_allowed is not None:
            query = query.filter(Ride.smoking_allowed == criteria.smoking_allowed)
        if criteria.pets_allowed is not None:
            query = query.filter(Ride.pets_allowed == criteria.pets_allowed)
        if criteria.music_allowed is not None:
            query = query.filter(Ride.music_allowed == criteria.music_allowed)

        return query.count()

    def save(self, ride: Ride) -> Ride:
        self.db.commit()
        self.db.refresh(ride)
        return ride

    def delete(self, ride: Ride):
        self.db.delete(ride)
        self.db.commit()


REQUIRED_DOCUMENT_TYPES = ("registration", "insurance", "inspection")


class VehicleDocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        vehicle_id: UUID,
        document_type: str,
        storage_key: str,
        mime_type: str,
        size_bytes: int,
        sha256: str,
    ) -> VehicleDocument:
        # retire any existing current document of the same type
        self.db.query(VehicleDocument).filter(
            VehicleDocument.vehicle_id == vehicle_id,
            VehicleDocument.document_type == document_type,
            VehicleDocument.is_current.is_(True),
        ).update({VehicleDocument.is_current: False}, synchronize_session=False)

        doc = VehicleDocument(
            vehicle_id=vehicle_id,
            document_type=document_type,
            storage_key=storage_key,
            mime_type=mime_type,
            size_bytes=size_bytes,
            sha256=sha256,
            status="pending",
            processing_status="pending",
            is_current=True,
            version=1,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def get(self, document_id: UUID) -> VehicleDocument | None:
        return self.db.query(VehicleDocument).filter(VehicleDocument.id == document_id).first()

    def list_current_for_vehicle(self, vehicle_id: UUID) -> list[VehicleDocument]:
        return (
            self.db.query(VehicleDocument)
            .filter(
                VehicleDocument.vehicle_id == vehicle_id,
                VehicleDocument.is_current.is_(True),
            )
            .order_by(VehicleDocument.document_type)
            .all()
        )

    def list_all_pending(self, skip: int = 0, limit: int = 50) -> list[VehicleDocument]:
        return (
            self.db.query(VehicleDocument)
            .filter(
                VehicleDocument.is_current.is_(True),
                VehicleDocument.status == "pending",
            )
            .order_by(VehicleDocument.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_all_pending(self) -> int:
        return (
            self.db.query(VehicleDocument)
            .filter(
                VehicleDocument.is_current.is_(True),
                VehicleDocument.status == "pending",
            )
            .count()
        )

    def apply_decision(
        self,
        doc: VehicleDocument,
        decision: str,
        reviewer_id: UUID,
        reason: str | None,
        expected_version: int,
    ) -> VehicleDocument:
        from datetime import datetime, timezone

        if doc.version != expected_version:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=409,
                detail=f"Document was modified (version {doc.version}), reload and retry",
            )
        doc.status = decision  # type: ignore[assignment]
        doc.reviewed_by = reviewer_id  # type: ignore[assignment]
        doc.reviewed_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        doc.rejection_reason = reason  # type: ignore[assignment]
        doc.version = doc.version + 1  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(doc)
        return doc
