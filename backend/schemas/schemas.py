from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    phone: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    language: Optional[str] = "az"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_verified: bool
    rating: float
    total_rides: int
    created_at: datetime

class VehicleBase(BaseModel):
    brand: str
    model: str
    year: int
    color: str
    plate_number: str

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime

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
    intermediate_cities: Optional[str] = None
    status: str = "active"
    description: Optional[str] = None
    
    
    smoking_allowed: bool = False
    pets_allowed: bool = False
    music_allowed: bool = True
    female_only: bool = False

class RideCreate(RideBase):
    vehicle_id: UUID
    origin: Location
    destination: Location

class RideResponse(RideBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    driver_id: UUID
    vehicle_id: UUID
    created_at: datetime

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

class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    target_id: UUID
    ride_id: UUID

class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    target_id: UUID
    ride_id: UUID
    created_at: datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    ride_id: UUID

class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ride_id: UUID
    sender_id: UUID
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone: Optional[str] = None
