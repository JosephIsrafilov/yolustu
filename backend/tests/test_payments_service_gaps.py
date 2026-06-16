import pytest
from decimal import Decimal
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from fastapi import HTTPException

from tests.test_payments_service import (
    make_service,
    make_current_user,
)


def test_create_payment_ride_not_found(monkeypatch):
    service, booking, _, _, _ = make_service("accepted")
    service.rides.get_ride_for_update = lambda x: None

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(
            booking.id, make_current_user(booking.passenger_id)
        )
    assert exc.value.status_code == 404
    assert "Ride not found" in str(exc.value.detail)


def test_create_payment_booking_not_found():
    """Test payment creation when booking is not found."""
    service, _, _, _, _ = make_service()
    service.bookings.get_for_update = lambda x: None

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(uuid4(), make_current_user(uuid4()))
    assert exc.value.status_code == 404
    assert "Booking not found" in str(exc.value.detail)


def test_create_payment_ride_already_departed():
    """Test payment creation when ride has already departed."""
    service, booking, ride, _, _ = make_service("accepted")
    ride.departure_time = datetime.now(timezone.utc) - timedelta(hours=1)

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(
            booking.id, make_current_user(booking.passenger_id)
        )
    assert exc.value.status_code == 400
    assert "already departed" in str(exc.value.detail)


def test_create_payment_no_reserved_seats():
    """Test payment creation when booking has no reserved seats."""
    service, booking, ride, _, _ = make_service("accepted")
    ride.available_seats = -1

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(
            booking.id, make_current_user(booking.passenger_id)
        )
    assert exc.value.status_code == 400
    assert "no reserved seats" in str(exc.value.detail)


def test_create_payment_zero_amount():
    """Test payment creation with zero or negative amount."""
    service, booking, _, _, _ = make_service("accepted")
    booking.total_price = Decimal("0.00")

    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(
            booking.id, make_current_user(booking.passenger_id)
        )
    assert exc.value.status_code == 400
    assert "must be positive" in str(exc.value.detail)


def test_create_payment_already_succeeded():
    """Test payment creation when payment already succeeded."""
    service, booking, _, payment_repo, _ = make_service("accepted")

    # Create first payment and mark as succeeded
    first = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    payment = payment_repo.get(first["payment_id"])
    payment.status = "succeeded"

    # Try to create another payment
    with pytest.raises(HTTPException) as exc:
        service.create_payment_session(
            booking.id, make_current_user(booking.passenger_id)
        )
    assert exc.value.status_code == 400
    assert "already paid" in str(exc.value.detail)


def test_wallet_get_balance(monkeypatch):
    """Test getting wallet balance for a user."""
    service, _, _, _, wallet_repo = make_service()
    user_id = uuid4()

    wallet_repo.get_or_create(user_id)
    wallet_repo.wallets[user_id].available_balance = Decimal("100.00")

    balance = service.wallet_for_user(make_current_user(user_id))
    assert balance["available_balance"] == Decimal("100.00")


def test_wallet_list_transactions_with_filter():
    """Test listing wallet transactions with different filters."""
    service, _, _, _, wallet_repo = make_service()
    user_id = uuid4()

    wallet_repo.get_or_create(user_id)

    result = service.wallet_transactions(
        make_current_user(user_id), page=1, limit=10, filter="all"
    )
    assert hasattr(result, "items") or isinstance(result, dict)


def test_get_payment_details():
    """Test retrieving payment details."""
    service, booking, _, payment_repo, _ = make_service("accepted")

    response = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    payment_id = response["payment_id"]

    payment = service.get_payment(payment_id, make_current_user(booking.passenger_id))
    assert payment.id == payment_id
    assert payment.status == "pending"


def test_cannot_get_payment_of_other_user():
    """Test that users cannot retrieve payments of others."""
    service, booking, _, payment_repo, _ = make_service("accepted")

    response = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    payment_id = response["payment_id"]

    with pytest.raises(HTTPException) as exc:
        service.get_payment(payment_id, make_current_user(uuid4()))
    assert exc.value.status_code == 403


def test_mark_payment_failed():
    """Test marking a payment as failed."""
    service, booking, _, payment_repo, _ = make_service("accepted")

    response = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    payment_id = response["payment_id"]

    result = service.mark_payment_failed(payment_id, "Insufficient funds")
    assert result["detail"] == "Payment failed"

    payment = payment_repo.get(payment_id)
    assert payment.status == "failed"


def test_refund_payment_requires_admin():
    """Test that only admins can refund payments."""
    service, booking, _, _, _ = make_service("accepted")

    response = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    payment_id = response["payment_id"]
    service.mark_payment_succeeded(payment_id)

    # Non-admin user tries to refund
    passenger = make_current_user(booking.passenger_id, role="passenger")
    with pytest.raises(HTTPException) as exc:
        service.refund_payment(payment_id, passenger)
    assert exc.value.status_code == 403


def test_cannot_refund_non_succeeded_payment():
    """Test that only succeeded payments can be refunded."""
    service, booking, _, payment_repo, _ = make_service("accepted")

    response = service.create_payment_session(
        booking.id, make_current_user(booking.passenger_id)
    )
    payment_id = response["payment_id"]

    admin = make_current_user(uuid4(), role="admin")
    with pytest.raises(HTTPException) as exc:
        service.refund_payment(payment_id, admin)
    assert exc.value.status_code == 400


def test_request_payout_with_sufficient_balance():
    """Test requesting a payout with sufficient balance."""
    service, _, _, _, wallet_repo = make_service()
    driver_id = uuid4()

    wallet_repo.get_or_create(driver_id)
    wallet_repo.wallets[driver_id].available_balance = Decimal("500.00")

    driver = make_current_user(driver_id, role="driver")
    result = service.request_payout(driver, Decimal("100.00"), "idempotency_key_1")

    assert result.status == "pending"
    assert result.amount == Decimal("100.00")


def test_cannot_request_payout_insufficient_balance():
    """Test that payout requests are rejected with insufficient balance."""
    service, _, _, _, wallet_repo = make_service()
    driver_id = uuid4()

    wallet_repo.get_or_create(driver_id)
    wallet_repo.wallets[driver_id].available_balance = Decimal("50.00")

    driver = make_current_user(driver_id, role="driver")
    with pytest.raises(HTTPException) as exc:
        service.request_payout(driver, Decimal("100.00"), "idempotency_key_2")
    assert exc.value.status_code == 400


def test_list_payouts_for_driver():
    """Test listing payouts for a driver."""
    service, _, _, _, _ = make_service()
    driver_id = uuid4()
    driver = make_current_user(driver_id, role="driver")

    result = service.list_user_payouts(driver, page=1, limit=10)
    assert hasattr(result, "items") or isinstance(result, dict)
