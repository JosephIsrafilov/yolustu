import { effectiveBookingStatus } from '@/lib/bookings';
import { mapApiBookingToBooking, type ApiBooking } from '@/services/api/mappers';

const booking: ApiBooking = {
  id: 'booking-1',
  ride_id: 'ride-1',
  passenger_id: 'passenger-1',
  seats_booked: 1,
  selected_spots: ['front_right'],
  status: 'pending',
  created_at: '2026-06-20T08:00:00Z',
};

describe('booking expiry', () => {
  it('keeps a future reservation pending', () => {
    expect(
      effectiveBookingStatus(
        'pending',
        '2026-06-23T19:30:00Z',
        Date.parse('2026-06-20T10:00:00Z'),
      ),
    ).toBe('pending');
  });

  it('classifies an overdue reservation as expired', () => {
    expect(
      effectiveBookingStatus(
        'pending',
        '2026-06-20T08:15:00Z',
        Date.parse('2026-06-20T10:00:00Z'),
      ),
    ).toBe('expired');
  });

  it('normalizes stale pending API data when mapping bookings', () => {
    const mapped = mapApiBookingToBooking({
      ...booking,
      payment_deadline: '2020-06-20T08:15:00Z',
    });

    expect(mapped.status).toBe('expired');
  });
});
