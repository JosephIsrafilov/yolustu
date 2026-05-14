import { apiClient } from '@/services/api-client';
import type { TripsService } from '@/services/contracts/trips-service';
import type { Trip, TripSearchFilters } from '@/types';
import { mapApiTripToTrip } from './mappers';

function buildSearchQuery(filters: TripSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.departureCity) params.set('origin_city', filters.departureCity);
  if (filters.arrivalCity) params.set('dest_city', filters.arrivalCity);
  if (filters.date) params.set('date', filters.date);
  if (typeof filters.maxPrice === 'number') params.set('maxPrice', String(filters.maxPrice));
  if (typeof filters.minSeats === 'number') params.set('minSeats', String(filters.minSeats));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const apiTripsService: TripsService = {
  async searchTrips(filters) {
    const response = await apiClient.get<any[]>(`/rides/search${buildSearchQuery(filters)}`);
    return response.map(mapApiTripToTrip);
  },

  async getTripById(tripId) {
    const response = await apiClient.get<any>(`/rides/${tripId}`);
    return mapApiTripToTrip(response);
  },

  async createTrip(input) {
    // Convert frontend input to backend schema
    const backendInput = {
      departure_time: `${input.date}T${input.time}:00`,
      total_seats: input.seatsTotal,
      available_seats: input.seatsTotal,
      price_per_seat: input.pricePerSeat,
      origin_city: input.departureCity,
      destination_city: input.arrivalCity,
      vehicle_id: '00000000-0000-0000-0000-000000000000', // Placeholder, needs vehicle selection
      origin: { lat: 0, lon: 0 }, // Placeholder, needs geocoding
      destination: { lat: 0, lon: 0 }, // Placeholder, needs geocoding
      description: input.comment,
    };
    const response = await apiClient.post<any>('/rides', backendInput);
    return mapApiTripToTrip(response);
  },

  async getMyTrips() {
    const response = await apiClient.get<any[]>('/rides/my');
    return response.map(mapApiTripToTrip);
  },

  async cancelTrip(tripId) {
    const response = await apiClient.patch<any>(`/rides/${tripId}/cancel`);
    return mapApiTripToTrip(response);
  },

  async completeTrip(tripId) {
    const response = await apiClient.patch<any>(`/rides/${tripId}/complete`);
    return mapApiTripToTrip(response);
  },
};

