import { apiClient } from '@/services/api-client';
import type { TripsService } from '@/services/contracts/trips-service';
import type { TripSearchFilters } from '@/types';
import { getCityCoordinates } from '@/lib/utils';
import {
  mapApiTripToTrip,
  mapApiVehicleToVehicle,
  mapCreateTripToApiRideCreate,
  type ApiTrip,
  type ApiVehicle,
} from './mappers';

async function resolveVehicleId(input: Parameters<TripsService['createTrip']>[0]): Promise<string> {
  if (input.vehicleId) return input.vehicleId;

  if (input.newVehicle) {
    const vehicle = await apiClient.post<ApiVehicle>('/vehicles', {
      brand: input.newVehicle.brand,
      model: input.newVehicle.model,
      year: input.newVehicle.year,
      color: input.newVehicle.color,
      plate_number: input.newVehicle.plateNumber,
    });
    return vehicle.id;
  }

  const vehicles = await apiClient.get<ApiVehicle[]>('/vehicles/my');
  if (vehicles[0]) return mapApiVehicleToVehicle(vehicles[0]).id;

  const vehicle = await apiClient.post<ApiVehicle>('/vehicles', {
    brand: 'Other',
    model: input.carModel || 'Car',
    year: 2020,
    color: 'Unknown',
    plate_number: `AUTO-${Date.now().toString().slice(-6)}`,
  });
  return vehicle.id;
}

function resolveCoordinates(
  selected: { lat: number; lng: number } | undefined,
  city: string,
): { lat: number; lon: number } {
  const coords = selected ?? getCityCoordinates(city) ?? getCityCoordinates('Baku') ?? { lat: 40.4093, lng: 49.8671 };
  return { lat: coords.lat, lon: coords.lng };
}

function buildSearchQuery(filters: TripSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.departureCity) params.set('origin_city', filters.departureCity);
  if (filters.arrivalCity) params.set('dest_city', filters.arrivalCity);
  if (filters.date) params.set('departure_date', filters.date);
  if (typeof filters.minSeats === 'number') params.set('min_seats', String(filters.minSeats));
  if (filters.femaleOnly !== undefined) params.set('female_only', String(filters.femaleOnly));
  if (filters.smokingAllowed !== undefined) params.set('smoking_allowed', String(filters.smokingAllowed));
  if (filters.petsAllowed !== undefined) params.set('pets_allowed', String(filters.petsAllowed));
  if (filters.musicAllowed !== undefined) params.set('music_allowed', String(filters.musicAllowed));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const apiTripsService: TripsService = {
  async searchTrips(filters, options) {
    const response = await apiClient.get<ApiTrip[]>(`/rides/search${buildSearchQuery(filters)}`, options);
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
    const vehicleId = await resolveVehicleId(input);
    const origin = resolveCoordinates(input.origin, input.departureCity);
    const destination = resolveCoordinates(input.destination, input.arrivalCity);
    const backendInput = mapCreateTripToApiRideCreate(input, vehicleId, origin, destination);
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
