from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from geoalchemy2.shape import to_shape

class UserBase(BaseModel):
    phone: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    language: Optional[str] = "az"
    role: Optional[str] = "passenger"
    city: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    role: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_blocked: bool
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
    vehicle_id: Optional[UUID] = None
    car_model: Optional[str] = None
    origin: Location
    destination: Location

class RideResponse(RideBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    driver_id: UUID
    vehicle_id: UUID
    created_at: datetime
    origin_location: Location
    destination_location: Location
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[UserResponse] = None

    @field_validator("origin_location", "destination_location", mode="before")
    @classmethod
    def convert_geometry(cls, v):
        if v is None:
            return None
        
        if isinstance(v, (dict, Location)):
            return v
            
        # Handle GeoAlchemy2 elements
        try:
            from geoalchemy2.shape import to_shape
            from geoalchemy2.elements import WKBElement, WKTElement
            
            if isinstance(v, (WKBElement, WKTElement)):
                shape = to_shape(v)
                return {"lat": shape.y, "lon": shape.x}
            
            # Fallback for other potential types that to_shape might handle
            shape = to_shape(v)
            return {"lat": shape.y, "lon": shape.x}
        except Exception as e:
            print(f"DEBUG: Error converting geometry: {e}, type(v): {type(v)}")
            return v

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
