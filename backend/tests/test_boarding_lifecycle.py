"""Lifecycle transition checks for the boarding/tracking feature."""

from app.domains.lifecycle import (
    BOOKING_ACCEPTED,
    BOOKING_BOARDED,
    BOOKING_COMPLETED,
    BOOKING_NO_SHOW,
    BOOKING_PENDING,
    BOOKING_PAID,
    RIDE_ACTIVE,
    RIDE_BOARDING,
    RIDE_CANCELLED,
    RIDE_COMPLETED,
    can_transition_booking,
    can_transition_ride,
)


def test_ride_can_enter_and_leave_boarding():
    assert can_transition_ride(RIDE_ACTIVE, RIDE_BOARDING)
    assert can_transition_ride(RIDE_BOARDING, RIDE_COMPLETED)
    assert can_transition_ride(RIDE_BOARDING, RIDE_CANCELLED)
    # active can still go straight to completed (simulate without boarding)
    assert can_transition_ride(RIDE_ACTIVE, RIDE_COMPLETED)
    # terminal states are dead ends
    assert not can_transition_ride(RIDE_COMPLETED, RIDE_BOARDING)


def test_booking_boarding_transitions():
    assert can_transition_booking(BOOKING_ACCEPTED, BOOKING_BOARDED)
    assert can_transition_booking(BOOKING_ACCEPTED, BOOKING_NO_SHOW)
    assert can_transition_booking(BOOKING_PAID, BOOKING_BOARDED)
    # a no-show can be corrected back to boarded
    assert can_transition_booking(BOOKING_NO_SHOW, BOOKING_BOARDED)
    # boarded passenger completes the ride
    assert can_transition_booking(BOOKING_BOARDED, BOOKING_COMPLETED)
    # cannot board a passenger who never got accepted
    assert not can_transition_booking(BOOKING_PENDING, BOOKING_BOARDED)
