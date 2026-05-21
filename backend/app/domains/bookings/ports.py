from uuid import UUID

from sqlalchemy.orm import Session

from app.domains.bookings.repositories import BookingRepository


class BookingParticipantPort:
    def __init__(self, db: Session):
        self.bookings = BookingRepository(db)

    def is_accepted_passenger(self, ride_id: UUID, user_id: UUID) -> bool:
        return self.bookings.has_accepted_booking(ride_id, user_id)

    def get_accepted_passenger_ids(self, ride_id: UUID) -> list[UUID]:
        return self.bookings.get_accepted_passenger_ids(ride_id)
