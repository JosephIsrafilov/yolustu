import { apiClient } from '@/services/api-client';
import type { TripsService } from '@/services/contracts/trips-service';
import type { Trip, TripSearchFilters } from '@/types';

function buildSearchQuery(filters: TripSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.departureCity) params.set('departureCity', filters.departureCity);
  if (filters.arrivalCity) params.set('arrivalCity', filters.arrivalCity);
  if (filters.date) params.set('date', filters.date);
  if (typeof filters.maxPrice === 'number') params.set('maxPrice', String(filters.maxPrice));
  if (typeof filters.minSeats === 'number') params.set('minSeats', String(filters.minSeats));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const apiTripsService: TripsService = {
  async searchTrips(filters) {
    return apiClient.get<Trip[]>(`/rides/search${buildSearchQuery(filters)}`);
  },

  async getTripById(tripId) {
    return apiClient.get<Trip>(`/rides/${tripId}`);
  },

  async createTrip(input) {
    return apiClient.post<Trip>('/rides', input);
  },

  async getMyTrips() {
    return apiClient.get<Trip[]>('/rides/my');
  },

  async cancelTrip(tripId) {
    return apiClient.patch<Trip>(`/rides/${tripId}/cancel`);
  },

  async completeTrip(tripId) {
    return apiClient.patch<Trip>(`/rides/${tripId}/complete`);
  },
};
