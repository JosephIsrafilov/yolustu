from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domains.identity.schemas import UserResponse
from app.domains.trips.schemas import RideResponse


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
