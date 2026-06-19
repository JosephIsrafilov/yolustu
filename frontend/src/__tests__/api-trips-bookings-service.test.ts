import { apiTripsService } from '@/services/api/api-trips-service';
import { apiBookingsService } from '@/services/api/api-bookings-service';
import { apiClient } from '@/services/api-client';
import { mapApiBookingToBooking, mapApiTripToTrip, type ApiBooking, type ApiTrip } from '@/services/api/mappers';
import type { BookingStatus } from '@/types';

jest.mock('@/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const baseTrip: ApiTrip = {
  id: 'trip-1',
  driver_id: 'driver-1',
  origin_city: 'Baku',
  destination_city: 'Ganja',
  departure_time: '2026-05-23T09:30:00Z',
  total_seats: 4,
  available_seats: 3,
  price_per_seat: 12,
  status: 'active',
  created_at: '2026-05-23T08:00:00Z',
  meeting_point: '',
  dropoff_point: '',
};

const baseBooking: ApiBooking = {
  id: 'booking-1',
  ride_id: 'trip-1',
  passenger_id: 'passenger-1',
  status: 'pending',
  seats_booked: 1,
  selected_spots: ['front_right'],
  created_at: '2026-05-23T08:30:00Z',
};

describe('api trips/bookings services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls rides search endpoint with query params', async () => {
    mockedApiClient.get.mockResolvedValue([baseTrip]);

    await apiTripsService.searchTrips({
      departureCity: 'Baku',
      arrivalCity: 'Ganja',
      date: '2026-05-24',
      minSeats: 2,
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/rides/search?origin_city=Baku&dest_city=Ganja&departure_date=2026-05-24&min_seats=2',
      undefined,
    );
  });

  it('calls create trip endpoint with mapped payload', async () => {
    mockedApiClient.post.mockResolvedValue(baseTrip);

    await apiTripsService.createTrip({
      departureCity: 'Baku',
      arrivalCity: 'Ganja',
      meetingPoint: 'm',
      dropoffPoint: 'd',
      date: '2026-05-24',
      time: '10:30',
      seatsTotal: 3,
      pricePerSeat: 15,
      carModel: 'Toyota Prius',
      comment: 'No smoking',
      vehicleId: 'vehicle-1',
      origin: { lat: 40.4, lng: 49.8 },
      destination: { lat: 40.7, lng: 46.3 },
      availableSpots: ['front_right', 'back_left', 'back_middle'],
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/rides', {
      departure_time: '2026-05-24T10:30:00',
      total_seats: 3,
      available_seats: 3,
      price_per_seat: 15,
      origin_city: 'Baku',
      destination_city: 'Ganja',
      vehicle_id: 'vehicle-1',
      origin: { lat: 40.4, lon: 49.8 },
      destination: { lat: 40.7, lon: 46.3 },
      car_model: 'Toyota Prius',
      description: 'No smoking',
      available_spots: ['front_right', 'back_left', 'back_middle'],
    });
  });

  it('requires an explicit vehicle before creating a trip', async () => {
    await expect(apiTripsService.createTrip({
      departureCity: 'Baku',
      arrivalCity: 'Ganja',
      meetingPoint: '',
      dropoffPoint: '',
      date: '2026-05-24',
      time: '10:30',
      seatsTotal: 1,
      pricePerSeat: 15,
      carModel: '',
      comment: '',
      vehicleId: '',
    })).rejects.toThrow('A vehicle must be selected');

    expect(mockedApiClient.get).not.toHaveBeenCalled();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('calls booking endpoints with correct routes and payload', async () => {
    mockedApiClient.post.mockResolvedValue(baseBooking);

    await apiBookingsService.createBooking({
      tripId: 'trip-1',
      seatsRequested: 2,
      selectedSpots: ['front_right', 'back_left'],
    });
    await apiBookingsService.acceptBooking('booking-1');
    await apiBookingsService.rejectBooking('booking-1');
    await apiBookingsService.cancelBooking('booking-1');

    expect(mockedApiClient.post).toHaveBeenNthCalledWith(1, '/bookings', {
      ride_id: 'trip-1',
      seats_booked: 2,
      selected_spots: ['front_right', 'back_left'],
    });
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(2, '/bookings/booking-1/confirm');
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(3, '/bookings/booking-1/reject');
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(4, '/bookings/booking-1/cancel');
  });

  it('trip mapper preserves meeting/dropoff fallback from city values', () => {
    const mapped = mapApiTripToTrip({
      ...baseTrip,
      meeting_point: '   ',
      dropoff_point: null,
      origin_city: 'Shaki',
      destination_city: 'Baku',
    });

    expect(mapped.meetingPoint).toBe('Shaki');
    expect(mapped.dropoffPoint).toBe('Baku');
  });

  it('maps available and selected seat spots', () => {
    const trip = mapApiTripToTrip({
      ...baseTrip,
      available_spots: ['back_left', 'back_right'],
    });
    const booking = mapApiBookingToBooking({
      ...baseBooking,
      selected_spots: ['front_right'],
    });

    expect(trip.availableSpots).toEqual(['back_left', 'back_right']);
    expect(booking.selectedSpots).toEqual(['front_right']);
  });

  it.each<[BookingStatus]>([
    ['pending'],
    ['accepted'],
    ['rejected'],
    ['cancelled'],
    ['paid'],
    ['completed'],
  ])(
    'booking mapper supports status %s',
    (status) => {
      const mapped = mapApiBookingToBooking({ ...baseBooking, status });
      expect(mapped.status).toBe(status);
    },
  );
});
