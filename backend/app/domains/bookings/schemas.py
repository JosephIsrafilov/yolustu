from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domains.identity.schemas import PublicUserResponse
from app.domains.trips.schemas import RideResponse, ride_to_response


class BookingBase(BaseModel):
    seats_booked: int
    selected_spots: Optional[list[str]] = None


class BookingCreate(BookingBase):
    ride_id: UUID


class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ride_id: UUID
    passenger_id: UUID
    status: str
    total_price: Optional[Decimal] = None
    payment_deadline: Optional[datetime] = None
    created_at: datetime
    ride: Optional[RideResponse] = None
    passenger: Optional[PublicUserResponse] = None


def booking_to_response(booking: Any) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        ride_id=booking.ride_id,
        passenger_id=booking.passenger_id,
        seats_booked=booking.seats_booked,
        selected_spots=booking.selected_spots,
        status=booking.status,
        total_price=booking.total_price,
        payment_deadline=booking.payment_deadline,
        created_at=booking.created_at,
        ride=ride_to_response(booking.ride) if booking.ride else None,
        passenger=booking.passenger,
    )
