"""Ride-search date semantics.

Regression coverage for the real-mode "search returns nothing" bug: clients
(notably the mobile app) always send today's date, and the old query matched
``departure_time`` to that exact calendar day, hiding every upcoming ride.
A supplied date is now the start of a forward window.
"""

import os
import sys
from datetime import date, datetime, time, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.domains.trips.repositories import ride_search_window_start


def test_window_start_is_none_without_date():
    assert ride_search_window_start(None) is None


def test_window_start_is_midnight_utc_of_given_day():
    assert ride_search_window_start(date(2026, 6, 11)) == datetime(
        2026, 6, 11, 0, 0, tzinfo=timezone.utc
    )


def test_window_start_is_inclusive_lower_bound_not_exact_day():
    """A ride later the same day is on/after the window start, and a ride on a
    following day is also included (forward window, not single-day equality)."""
    window_start = ride_search_window_start(date(2026, 6, 11))
    assert window_start is not None

    same_day_evening = datetime.combine(
        date(2026, 6, 11), time(23, 0), tzinfo=timezone.utc
    )
    next_day = datetime.combine(date(2026, 6, 12), time(8, 0), tzinfo=timezone.utc)

    assert same_day_evening >= window_start
    assert next_day >= window_start


def test_window_start_excludes_earlier_days():
    window_start = ride_search_window_start(date(2026, 6, 11))
    assert window_start is not None

    previous_day = datetime.combine(date(2026, 6, 10), time(23, 0), tzinfo=timezone.utc)
    assert previous_day < window_start
