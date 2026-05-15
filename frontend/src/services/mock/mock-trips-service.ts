import { ApiError } from '@/services/api-error';
import type { TripsService } from '@/services/contracts/trips-service';
import { filterTrips } from '@/lib/mock-api';
import { useAppStore } from '@/store/useAppStore';
import { buildStoreError, requireCurrentUser } from '@/services/mock/mock-service-utils';

export const mockTripsService: TripsService = {
  async searchTrips(filters) {
    return filterTrips(useAppStore.getState().trips, filters);
  },

  async getTripById(tripId) {
    const trip = useAppStore.getState().trips.find((item) => item.id === tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }
    return trip;
  },

  async createTrip(input) {
    const tripId = useAppStore.getState().createTrip(input);
    if (!tripId) {
      throw buildStoreError('Trip could not be created.');
    }

    const trip = useAppStore.getState().trips.find((item) => item.id === tripId);
    if (!trip) {
      throw new ApiError({
        code: 'UNKNOWN_ERROR',
        message: 'Trip was created but is missing.',
      });
    }
    return trip;
  },

  async getMyTrips() {
    const currentUser = requireCurrentUser();
    return useAppStore.getState().trips.filter((trip) => trip.driverId === currentUser.id);
  },

  async cancelTrip(tripId) {
    const ok = useAppStore.getState().cancelTrip(tripId);
    if (!ok) {
      throw buildStoreError('Trip could not be cancelled.');
    }
    const trip = useAppStore.getState().trips.find((item) => item.id === tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found after cancellation.',
      });
    }
    return trip;
  },

  async completeTrip(tripId) {
    const ok = useAppStore.getState().completeTrip(tripId);
    if (!ok) {
      throw buildStoreError('Trip could not be completed.');
    }
    const trip = useAppStore.getState().trips.find((item) => item.id === tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found after completion.',
      });
    }
    return trip;
  },
};
