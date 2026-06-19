from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from geoalchemy2.elements import WKBElement, WKTElement

from app.domains.trips.schemas import ride_to_response


def make_ride(origin_location, destination_location):
    return SimpleNamespace(
        id=uuid4(),
        driver_id=uuid4(),
        vehicle_id=uuid4(),
        created_at=datetime.now(timezone.utc),
        departure_time=datetime.now(timezone.utc),
        total_seats=3,
        available_seats=2,
        price_per_seat=15,
        origin_city="Baku",
        destination_city="Ganja",
        intermediate_cities=None,
        status="active",
        description=None,
        smoking_allowed=False,
        pets_allowed=False,
        music_allowed=True,
        female_only=False,
        origin_location=origin_location,
        destination_location=destination_location,
        vehicle=None,
        driver=None,
        available_spots=None,
    )


def test_ride_to_response_converts_wkt_geometry_locations():
    ride = make_ride(
        WKTElement("POINT(49.8671 40.4093)", srid=4326),
        WKTElement("POINT(46.3606 40.6828)", srid=4326),
    )

    response = ride_to_response(ride)

    assert response.origin_location.lat == 40.4093
    assert response.origin_location.lon == 49.8671
    assert response.destination_location.lat == 40.6828
    assert response.destination_location.lon == 46.3606


def test_ride_to_response_converts_ewkb_geometry_locations():
    ride = make_ride(
        WKBElement(bytes.fromhex("0101000020e6100000492eff21fdee48405c2041f163344440")),
        WKBElement(bytes.fromhex("0101000020e610000003780b24282e4740bada8afd65574440")),
    )

    response = ride_to_response(ride)

    assert response.origin_location.lat == 40.4093
    assert response.origin_location.lon == 49.8671
    assert response.destination_location.lat == 40.6828
    assert response.destination_location.lon == 46.3606


def test_user_response_handles_null_values():
    from app.domains.identity.schemas import PublicUserResponse

    user_data = SimpleNamespace(
        id=uuid4(),
        phone="+994501112233",
        email=None,
        first_name="Test",
        last_name="User",
        avatar_url=None,
        language="az",
        role="driver",
        city=None,
        bio=None,
        is_blocked=None,
        is_verified=None,
        is_email_verified=None,
        verification_status="pending",
        document_url=None,
        rating=None,
        total_rides=None,
        created_at=datetime.now(timezone.utc),
    )

    response = PublicUserResponse.model_validate(user_data)
    assert response.is_verified is False
    assert response.rating == 0.0
    assert response.total_rides == 0


def test_ride_response_handles_null_values():
    from app.domains.trips.schemas import RideResponse

    ride_data = SimpleNamespace(
        id=uuid4(),
        driver_id=uuid4(),
        vehicle_id=uuid4(),
        created_at=datetime.now(timezone.utc),
        departure_time=datetime.now(timezone.utc),
        total_seats=4,
        available_seats=4,
        price_per_seat=10.0,
        origin_city="Baku",
        destination_city="Sumqayit",
        intermediate_cities=None,
        status="active",
        description=None,
        smoking_allowed=None,
        pets_allowed=None,
        music_allowed=None,
        female_only=None,
        origin_location={"lat": 40.4093, "lon": 49.8671},
        destination_location={"lat": 40.4093, "lon": 49.8671},
        vehicle=None,
        driver=None,
        available_spots=None,
    )

    response = RideResponse.model_validate(ride_data)
    assert response.smoking_allowed is False
    assert response.pets_allowed is False
    assert response.music_allowed is True
    assert response.female_only is False


def test_geometry_to_location_other_type():
    from app.domains.trips.schemas import geometry_to_location

    assert geometry_to_location(42) == 42


def test_wkt_point_to_location_invalid_format():
    from app.domains.trips.schemas import geometry_to_location

    element = WKTElement("INVALID POINT(1 2)", srid=4326)
    assert geometry_to_location(element) == element


def test_wkb_point_to_location_invalid_hex():
    from app.domains.trips.schemas import _wkb_point_to_location

    assert _wkb_point_to_location("invalidhex") is None


def test_wkb_point_to_location_invalid_hex_with_prefix():
    from app.domains.trips.schemas import _wkb_point_to_location

    assert _wkb_point_to_location("\\xinvalid") is None


def test_wkb_point_to_location_too_short():
    from app.domains.trips.schemas import geometry_to_location

    element = WKBElement(b"\x01\x01\x00\x00\x00", srid=4326)
    assert geometry_to_location(element) == element


def test_wkb_point_to_location_invalid_byte_order():
    from app.domains.trips.schemas import geometry_to_location

    data = b"\x02" + b"\x00" * 30
    element = WKBElement(data, srid=4326)
    assert geometry_to_location(element) == element


def test_wkb_point_to_location_invalid_geometry_type():
    from app.domains.trips.schemas import geometry_to_location

    data = b"\x01\x02\x00\x00\x00" + b"\x00" * 30
    element = WKBElement(data, srid=4326)
    assert geometry_to_location(element) == element


def test_wkb_point_to_location_offset_too_short():
    from app.domains.trips.schemas import geometry_to_location

    data = b"\x01\x01\x00\x00\x20\x00\x00\x00\x00" + b"\x00" * 10
    element = WKBElement(data, srid=4326)
    assert geometry_to_location(element) == element


def test_wkb_point_to_location_bytes_input():
    from app.domains.trips.schemas import geometry_to_location

    data = bytes.fromhex("0101000020e6100000492eff21fdee48405c2041f163344440")
    element = WKBElement(data, srid=4326)
    loc = geometry_to_location(element)
    assert loc is not None
    assert loc["lat"] == 40.4093
    assert loc["lon"] == 49.8671
