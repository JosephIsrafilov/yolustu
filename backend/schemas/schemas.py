from pydantic import BaseModel

from typing import Optional, List

from datetime import datetime

from uuid import UUID

class UserBase(BaseModel):

    phone: str

    first_name: str

    last_name: str

class UserCreate(UserBase):

    pass

class UserResponse(UserBase):

    id: UUID

    is_verified: bool

    rating: float

    created_at: datetime

    class Config:

        from_attributes = True

class VehicleBase(BaseModel):

    brand: str

    model: str

    year: int

    color: str

    plate_number: str

class VehicleCreate(VehicleBase):

    pass

class VehicleResponse(VehicleBase):

    id: UUID

    user_id: UUID

    created_at: datetime

    class Config:

        from_attributes = True

class Location(BaseModel):

    lat: float

    lon: float

class RideBase(BaseModel):

    departure_time: datetime

    total_seats: int

    available_seats: int

    price_per_seat: float

    origin_city: str

    destination_city: str

    status: str = "active"

    description: Optional[str] = None

class RideCreate(RideBase):

    vehicle_id: UUID

    origin: Location

    destination: Location

class RideResponse(RideBase):

    id: UUID

    driver_id: UUID

    vehicle_id: UUID

    created_at: datetime

    class Config:

        from_attributes = True

class BookingBase(BaseModel):

    seats_booked: int

class BookingCreate(BookingBase):

    ride_id: UUID

class BookingResponse(BookingBase):

    id: UUID

    ride_id: UUID

    passenger_id: UUID

    status: str

    created_at: datetime

    class Config:

        from_attributes = True

class ReviewBase(BaseModel):

    rating: int

    comment: Optional[str] = None

class ReviewCreate(ReviewBase):

    target_id: UUID

    ride_id: UUID

class ReviewResponse(ReviewBase):

    id: UUID

    author_id: UUID

    target_id: UUID

    ride_id: UUID

    created_at: datetime

    class Config:

        from_attributes = True

class MessageBase(BaseModel):

    content: str

class MessageCreate(MessageBase):

    ride_id: UUID

class MessageResponse(MessageBase):

    id: UUID

    ride_id: UUID

    sender_id: UUID

    created_at: datetime

    class Config:

        from_attributes = True

class Token(BaseModel):

    access_token: str

    token_type: str

class TokenData(BaseModel):

    phone: Optional[str] = None

