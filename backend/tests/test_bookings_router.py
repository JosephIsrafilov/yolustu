import os
import sys
from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app
from app.domains.bookings.services import BookingsService


client = TestClient(app)

SEED_PHONE = '+994501234567'
SEED_PASSWORD = 'password123'


def get_access_token() -> str:
    response = client.post('/api/v1/auth/login', json={'phone': SEED_PHONE, 'password': SEED_PASSWORD})
    assert response.status_code == 200
    return response.json()['accessToken']


def sample_booking_response(status: str = 'pending'):
    now = datetime.now(timezone.utc).isoformat()
    return {
        'id': str(uuid4()),
        'ride_id': str(uuid4()),
        'passenger_id': str(uuid4()),
        'status': status,
        'seats_booked': 1,
        'total_price': 12.0,
        'created_at': now,
        'ride': None,
        'passenger': None,
    }


def test_bookings_create_endpoint(monkeypatch):
    monkeypatch.setattr(BookingsService, 'create_booking', lambda self, booking_in, current_user: sample_booking_response('pending'))
    token = get_access_token()

    response = client.post(
        '/api/v1/bookings/',
        headers={'Authorization': f'Bearer {token}'},
        json={'ride_id': str(uuid4()), 'seats_booked': 1},
    )

    assert response.status_code == 200
    assert response.json()['status'] == 'pending'


def test_bookings_my_and_requests_endpoints(monkeypatch):
    monkeypatch.setattr(BookingsService, 'get_my_bookings', lambda self, current_user: [sample_booking_response('accepted')])
    monkeypatch.setattr(BookingsService, 'get_booking_requests', lambda self, current_user: [sample_booking_response('pending')])
    token = get_access_token()

    my_response = client.get('/api/v1/bookings/my', headers={'Authorization': f'Bearer {token}'})
    requests_response = client.get('/api/v1/bookings/requests', headers={'Authorization': f'Bearer {token}'})

    assert my_response.status_code == 200
    assert requests_response.status_code == 200
    assert my_response.json()[0]['status'] == 'accepted'
    assert requests_response.json()[0]['status'] == 'pending'


def test_bookings_confirm_reject_cancel_endpoints(monkeypatch):
    monkeypatch.setattr(BookingsService, 'confirm_booking', lambda self, booking_id, current_user: sample_booking_response('accepted'))
    monkeypatch.setattr(BookingsService, 'reject_booking', lambda self, booking_id, current_user: sample_booking_response('rejected'))
    monkeypatch.setattr(BookingsService, 'cancel_booking', lambda self, booking_id, current_user: sample_booking_response('cancelled'))
    token = get_access_token()
    booking_id = str(uuid4())

    confirm_response = client.post(f'/api/v1/bookings/{booking_id}/confirm', headers={'Authorization': f'Bearer {token}'})
    reject_response = client.post(f'/api/v1/bookings/{booking_id}/reject', headers={'Authorization': f'Bearer {token}'})
    cancel_response = client.post(f'/api/v1/bookings/{booking_id}/cancel', headers={'Authorization': f'Bearer {token}'})

    assert confirm_response.status_code == 200
    assert reject_response.status_code == 200
    assert cancel_response.status_code == 200
    assert confirm_response.json()['status'] == 'accepted'
    assert reject_response.json()['status'] == 'rejected'
    assert cancel_response.json()['status'] == 'cancelled'
