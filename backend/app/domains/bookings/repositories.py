from uuid import UUID

from sqlalchemy.orm import Session

from app.domains.bookings.models import Booking


class BookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self, ride_id: UUID, passenger_id: UUID, seats_booked: int, total_price: float
    ) -> Booking:
        booking = Booking(
            ride_id=ride_id,
            passenger_id=passenger_id,
            seats_booked=seats_booked,
            total_price=total_price,
            status="pending",
        )
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def get(self, booking_id: UUID) -> Booking | None:
        return self.db.query(Booking).filter(Booking.id == booking_id).first()

    def get_for_update(self, booking_id: UUID) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(Booking.id == booking_id)
            .with_for_update()
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
                Booking.status.notin_(["cancelled", "rejected"]),
            )
            .first()
        )

    def has_accepted_booking(self, ride_id: UUID, passenger_id: UUID) -> bool:
        return (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.passenger_id == passenger_id,
                Booking.status.in_(["accepted", "paid", "completed"]),
            )
            .first()
            is not None
        )

    def get_accepted_passenger_ids(self, ride_id: UUID) -> list[UUID]:
        bookings = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.status.in_(["accepted", "paid", "completed"]),
            )
            .all()
        )
        return [b.passenger_id for b in bookings]

    def list_for_passenger(self, passenger_id: UUID) -> list[Booking]:
        return self.db.query(Booking).filter(Booking.passenger_id == passenger_id).all()

    def list_requests_for_driver(self, driver_id: UUID):
        from app.domains.trips.models import Ride

        return (
            self.db.query(Booking).join(Ride).filter(Ride.driver_id == driver_id).all()
        )

    def list_all(self) -> list[Booking]:
        return self.db.query(Booking).order_by(Booking.created_at.desc()).all()

    def save(self, booking: Booking) -> Booking:
        self.db.commit()
        self.db.refresh(booking)
        return booking
