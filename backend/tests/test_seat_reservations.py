from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.domains.bookings.models import BookingSeat
from app.domains.bookings.repositories import SeatReservationRepository
from app.domains.trips.models import RideSeat, SEAT_SPOTS


@pytest.fixture
def seat_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(
        engine,
        tables=[RideSeat.__table__, BookingSeat.__table__],
    )
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(
            engine,
            tables=[BookingSeat.__table__, RideSeat.__table__],
        )


def seed_ride_seats(seat_db, ride_id):
    seat_db.add_all([RideSeat(ride_id=ride_id, spot=spot) for spot in SEAT_SPOTS])
    seat_db.commit()


def test_relational_allocation_conflict_and_exact_release(seat_db):
    ride_id = uuid4()
    first_booking_id = uuid4()
    second_booking_id = uuid4()
    seed_ride_seats(seat_db, ride_id)
    repository = SeatReservationRepository(seat_db)

    repository.allocate(
        SimpleNamespace(id=first_booking_id),
        ride_id,
        ["front_right", "back_middle"],
    )
    seat_db.commit()

    assert repository.available_spots(ride_id) == [
        "back_left",
        "back_right",
    ]
    with pytest.raises(ValueError, match="not available"):
        repository.allocate(
            SimpleNamespace(id=second_booking_id),
            ride_id,
            ["front_right"],
        )

    assert repository.release(first_booking_id, datetime.now(timezone.utc)) == 2
    repository.allocate(
        SimpleNamespace(id=second_booking_id),
        ride_id,
        ["front_right"],
    )
    seat_db.commit()

    active_spots = repository.available_spots(ride_id)
    assert "front_right" not in active_spots
    assert "back_middle" in active_spots


def test_database_enforces_one_active_booking_per_ride_seat(seat_db):
    ride_id = uuid4()
    seed_ride_seats(seat_db, ride_id)
    ride_seat = seat_db.query(RideSeat).filter_by(spot="front_right").one()
    seat_db.add(BookingSeat(booking_id=uuid4(), ride_seat_id=ride_seat.id))
    seat_db.commit()

    seat_db.add(BookingSeat(booking_id=uuid4(), ride_seat_id=ride_seat.id))
    with pytest.raises(IntegrityError):
        seat_db.flush()
