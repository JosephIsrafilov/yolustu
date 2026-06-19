from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import case, exists
from sqlalchemy.orm import Session

from app.domains.bookings.models import Booking, BookingSeat
from app.domains.trips.models import RideSeat, SEAT_SPOTS
from app.domains.lifecycle import (
    BOOKING_ACCEPTED,
    BOOKING_CANCELLED,
    BOOKING_COMPLETED,
    BOOKING_EXPIRED,
    BOOKING_NO_SHOW,
    BOOKING_PAID,
    BOOKING_PENDING,
    BOOKING_REJECTED,
)


class BookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        ride_id: UUID,
        passenger_id: UUID,
        seats_booked: int,
        total_price: Decimal,
        selected_spots: list[str] | None = None,
    ) -> Booking:
        booking = Booking(
            ride_id=ride_id,
            passenger_id=passenger_id,
            seats_booked=seats_booked,
            selected_spots=selected_spots,
            total_price=total_price,
            status=BOOKING_PENDING,
        )
        self.db.add(booking)
        self.db.flush()
        self.db.refresh(booking)
        return booking

    def get(self, booking_id: UUID) -> Booking | None:
        from sqlalchemy.orm import joinedload
        from app.domains.trips.models import Ride

        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.ride).joinedload(Ride.driver),
                joinedload(Booking.ride).joinedload(Ride.vehicle),
                joinedload(Booking.passenger),
            )
            .filter(Booking.id == booking_id)
            .first()
        )

    def get_for_update(self, booking_id: UUID) -> Booking | None:
        from sqlalchemy.orm import joinedload
        from app.domains.trips.models import Ride

        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.ride).joinedload(Ride.driver),
                joinedload(Booking.ride).joinedload(Ride.vehicle),
                joinedload(Booking.passenger),
            )
            .filter(Booking.id == booking_id)
            .with_for_update(of=Booking)
            .first()
        )

    def get_active_for_ride_and_passenger(
        self, ride_id: UUID, passenger_id: UUID
    ) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.passenger_id == passenger_id,
                Booking.status.notin_([BOOKING_CANCELLED, BOOKING_REJECTED]),
            )
            .first()
        )

    def list_active_for_ride(self, ride_id: UUID) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.status.notin_(
                    [
                        BOOKING_CANCELLED,
                        BOOKING_REJECTED,
                        BOOKING_EXPIRED,
                        BOOKING_NO_SHOW,
                    ]
                ),
            )
            .all()
        )

    def has_accepted_booking(self, ride_id: UUID, passenger_id: UUID) -> bool:
        return (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.passenger_id == passenger_id,
                Booking.status.in_([BOOKING_ACCEPTED, BOOKING_PAID, BOOKING_COMPLETED]),
            )
            .first()
            is not None
        )

    def get_accepted_passenger_ids(self, ride_id: UUID) -> list[UUID]:
        bookings = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.status.in_([BOOKING_ACCEPTED, BOOKING_PAID, BOOKING_COMPLETED]),
            )
            .all()
        )
        return [b.passenger_id for b in bookings]  # type: ignore[misc]

    def list_for_passenger(self, passenger_id: UUID) -> list[Booking]:
        from sqlalchemy.orm import joinedload
        from app.domains.trips.models import Ride

        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.ride).joinedload(Ride.driver),
                joinedload(Booking.ride).joinedload(Ride.vehicle),
                joinedload(Booking.passenger),
            )
            .filter(Booking.passenger_id == passenger_id)
            .all()
        )

    def list_requests_for_driver(self, driver_id: UUID):
        from app.domains.trips.models import Ride
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Booking)
            .join(Ride)
            .filter(Ride.driver_id == driver_id)
            .options(
                joinedload(Booking.ride).joinedload(Ride.driver),
                joinedload(Booking.ride).joinedload(Ride.vehicle),
                joinedload(Booking.passenger),
            )
            .all()
        )

    def count_all(self) -> int:
        return self.db.query(Booking).count()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[Booking]:
        return (
            self.db.query(Booking)
            .order_by(Booking.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def save(self, booking: Booking) -> Booking:
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def get_accepted_with_deadline_before(self, deadline: datetime) -> list[Booking]:
        """Get held bookings with a deadline before the given time."""
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Booking)
            .options(joinedload(Booking.ride))
            .filter(
                Booking.status.in_([BOOKING_PENDING, BOOKING_ACCEPTED]),
                Booking.payment_deadline.isnot(None),
                Booking.payment_deadline < deadline,
            )
            .all()
        )


class SeatReservationRepository:
    def __init__(self, db: Session):
        self.db = db

    def available_spots(self, ride_id: UUID) -> list[str]:
        active_assignment = exists().where(
            BookingSeat.ride_seat_id == RideSeat.id,
            BookingSeat.released_at.is_(None),
        )
        rows = (
            self.db.query(RideSeat.spot)
            .filter(
                RideSeat.ride_id == ride_id,
                RideSeat.is_enabled.is_(True),
                ~active_assignment,
            )
            .order_by(
                case(
                    {spot: index for index, spot in enumerate(SEAT_SPOTS)},
                    value=RideSeat.spot,
                )
            )
            .all()
        )
        return [row[0] for row in rows]

    def allocate(
        self, booking: Booking, ride_id: UUID, selected_spots: list[str]
    ) -> None:
        seats = (
            self.db.query(RideSeat)
            .filter(
                RideSeat.ride_id == ride_id,
                RideSeat.is_enabled.is_(True),
                RideSeat.spot.in_(selected_spots),
            )
            .with_for_update()
            .all()
        )
        seats_by_spot: dict[str, RideSeat] = {str(seat.spot): seat for seat in seats}
        if len(seats_by_spot) != len(selected_spots):
            raise ValueError("Invalid seat selection")

        occupied = (
            self.db.query(BookingSeat.ride_seat_id)
            .filter(
                BookingSeat.ride_seat_id.in_(
                    [seat.id for seat in seats_by_spot.values()]
                ),
                BookingSeat.released_at.is_(None),
            )
            .first()
        )
        if occupied:
            raise ValueError("Selected seat is not available")

        for spot in selected_spots:
            self.db.add(
                BookingSeat(
                    booking_id=booking.id,
                    ride_seat_id=seats_by_spot[spot].id,
                )
            )
        self.db.flush()

    def release(self, booking_id: UUID, released_at: datetime) -> int:
        return (
            self.db.query(BookingSeat)
            .filter(
                BookingSeat.booking_id == booking_id,
                BookingSeat.released_at.is_(None),
            )
            .update(
                {BookingSeat.released_at: released_at},
                synchronize_session=False,
            )
        )
