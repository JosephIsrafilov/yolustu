from datetime import date, datetime
from typing import Optional
from uuid import UUID

from geoalchemy2.shape import to_shape
from pydantic import BaseModel, ConfigDict, field_validator

from app.domains.identity.schemas import UserResponse


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


class RideSearch(BaseModel):
    origin_lat: Optional[float] = None
    origin_lon: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None
    origin_city: Optional[str] = None
    dest_city: Optional[str] = None
    departure_date: Optional[date] = None
    min_seats: int = 1
    radius_meters: float = 10000


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
    def convert_geometry(cls, value):
        if value is None or isinstance(value, (dict, Location)):
            return value

        try:
            from geoalchemy2.elements import WKBElement, WKTElement

            if isinstance(value, (WKBElement, WKTElement)):
                shape = to_shape(value)
                return {"lat": shape.y, "lon": shape.x}

            shape = to_shape(value)
            return {"lat": shape.y, "lon": shape.x}
        except Exception:
            return value
