import { apiClient } from '@/services/api-client';
import type { TripsService } from '@/services/contracts/trips-service';
import type { TripSearchFilters } from '@/types';
import { mapApiTripToTrip, type ApiTrip } from './mappers';

function buildSearchQuery(filters: TripSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.departureCity) params.set('origin_city', filters.departureCity);
  if (filters.arrivalCity) params.set('dest_city', filters.arrivalCity);
  if (filters.date) params.set('departure_date', filters.date);
  if (typeof filters.minSeats === 'number') params.set('min_seats', String(filters.minSeats));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const apiTripsService: TripsService = {
  async searchTrips(filters) {
    const response = await apiClient.get<ApiTrip[]>(`/rides/search${buildSearchQuery(filters)}`);
    const trips = response.map(mapApiTripToTrip);
    return typeof filters.maxPrice === 'number'
      ? trips.filter((trip) => trip.pricePerSeat <= filters.maxPrice!)
      : trips;
  },

  async getTripById(tripId) {
    const response = await apiClient.get<ApiTrip>(`/rides/${tripId}`);
    return mapApiTripToTrip(response);
  },

  async createTrip(input) {
    
    const backendInput = {
      departure_time: `${input.date}T${input.time}:00`,
      total_seats: input.seatsTotal,
      available_seats: input.seatsTotal,
      price_per_seat: input.pricePerSeat,
      origin_city: input.departureCity,
      destination_city: input.arrivalCity,
      vehicle_id: '00000000-0000-0000-0000-000000000000', 
      origin: { lat: 0, lon: 0 }, 
      destination: { lat: 0, lon: 0 }, 
      description: input.comment,
    };
    const response = await apiClient.post<ApiTrip>('/rides', backendInput);
    return mapApiTripToTrip(response);
  },

  async getMyTrips() {
    const response = await apiClient.get<ApiTrip[]>('/rides/my');
    return response.map(mapApiTripToTrip);
  },

  async cancelTrip(tripId) {
    const response = await apiClient.patch<ApiTrip>(`/rides/${tripId}/cancel`);
    return mapApiTripToTrip(response);
  },

  async completeTrip(tripId) {
    const response = await apiClient.patch<ApiTrip>(`/rides/${tripId}/complete`);
    return mapApiTripToTrip(response);
  },
};

