from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domains.identity.schemas import UserResponse
from app.domains.trips.schemas import RideResponse, ride_to_response


class BookingBase(BaseModel):
    seats_booked: int


class BookingCreate(BookingBase):
    ride_id: UUID


class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ride_id: UUID
    passenger_id: UUID
    status: str
    total_price: Optional[float] = None
    created_at: datetime
    ride: Optional[RideResponse] = None
    passenger: Optional[UserResponse] = None


def booking_to_response(booking: Any) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        ride_id=booking.ride_id,
        passenger_id=booking.passenger_id,
        seats_booked=booking.seats_booked,
        status=booking.status,
        total_price=booking.total_price,
        created_at=booking.created_at,
        ride=ride_to_response(booking.ride) if booking.ride else None,
        passenger=booking.passenger,
    )
