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
