import re
import struct
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from geoalchemy2.elements import WKBElement, WKTElement
from pydantic import BaseModel, ConfigDict, field_validator

from app.domains.identity.schemas import UserResponse

_POINT_WKT_RE = re.compile(
    r"^\s*(?:SRID=\d+;\s*)?POINT\s*(?:Z|M|ZM)?\s*\(\s*"
    r"(?P<lon>[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s+"
    r"(?P<lat>[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)"
    r"(?:\s+[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)*"
    r"\s*\)\s*$",
    re.IGNORECASE,
)

_EWKB_Z_FLAG = 0x80000000
_EWKB_M_FLAG = 0x40000000
_EWKB_SRID_FLAG = 0x20000000
_WKB_POINT_TYPE = 1


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
    price_per_seat: Decimal
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
    female_only: Optional[bool] = None
    smoking_allowed: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    music_allowed: Optional[bool] = None
    limit: int = 50
    offset: int = 0


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
        return geometry_to_location(value)

    @field_validator("smoking_allowed", "pets_allowed", "female_only", mode="before")
    @classmethod
    def default_false_booleans(cls, v: Any) -> bool:
        if v is None:
            return False
        return v

    @field_validator("music_allowed", mode="before")
    @classmethod
    def default_true_boolean(cls, v: Any) -> bool:
        if v is None:
            return True
        return v


def geometry_to_location(value: Any) -> Any:
    if value is None or isinstance(value, (dict, Location)):
        return value

    if isinstance(value, WKTElement):
        location = _wkt_point_to_location(value.data)
        return location if location is not None else value

    if isinstance(value, WKBElement):
        location = _wkb_point_to_location(value.data)
        return location if location is not None else value

    return value


def _wkt_point_to_location(data: str) -> Optional[dict[str, float]]:
    match = _POINT_WKT_RE.match(data)
    if not match:
        return None

    return {
        "lat": float(match.group("lat")),
        "lon": float(match.group("lon")),
    }


def _wkb_point_to_location(data: Any) -> Optional[dict[str, float]]:
    if isinstance(data, str):
        normalized_data = data.strip()
        if normalized_data.startswith("\\x"):
            normalized_data = normalized_data[2:]
        try:
            raw = bytes.fromhex(normalized_data)
        except ValueError:
            return None
    else:
        raw = bytes(data)

    if len(raw) < 21:
        return None

    if raw[0] == 0:
        byte_order = ">"
    elif raw[0] == 1:
        byte_order = "<"
    else:
        return None

    geometry_type = struct.unpack(f"{byte_order}I", raw[1:5])[0]
    has_srid = bool(geometry_type & _EWKB_SRID_FLAG)
    base_type = geometry_type & ~(_EWKB_Z_FLAG | _EWKB_M_FLAG | _EWKB_SRID_FLAG)
    if base_type != _WKB_POINT_TYPE:
        return None

    offset = 5 + (4 if has_srid else 0)
    if len(raw) < offset + 16:
        return None

    lon, lat = struct.unpack(f"{byte_order}dd", raw[offset : offset + 16])
    return {"lat": lat, "lon": lon}


def ride_to_response(ride: Any) -> RideResponse:
    return RideResponse(
        id=ride.id,
        driver_id=ride.driver_id,
        vehicle_id=ride.vehicle_id,
        created_at=ride.created_at,
        departure_time=ride.departure_time,
        total_seats=ride.total_seats,
        available_seats=ride.available_seats,
        price_per_seat=ride.price_per_seat,
        origin_city=ride.origin_city,
        destination_city=ride.destination_city,
        intermediate_cities=ride.intermediate_cities,
        status=ride.status,
        description=ride.description,
        smoking_allowed=ride.smoking_allowed,
        pets_allowed=ride.pets_allowed,
        music_allowed=ride.music_allowed,
        female_only=ride.female_only,
        origin_location=geometry_to_location(ride.origin_location),
        destination_location=geometry_to_location(ride.destination_location),
        vehicle=ride.vehicle,
        driver=ride.driver,
    )
