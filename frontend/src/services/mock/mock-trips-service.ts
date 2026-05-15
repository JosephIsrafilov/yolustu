import { ApiError } from '@/services/api-error';
import type { TripsService } from '@/services/contracts/trips-service';
import { filterTrips } from '@/lib/mock-api';
import { MOCK_TRIPS } from '@/data/mock-data';
import { useAppStore } from '@/store/useAppStore';
import { requireCurrentUser } from '@/services/mock/mock-service-utils';
import type { Trip } from '@/types';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}`;
}

export const mockTripsService: TripsService = {
  async searchTrips(filters) {
    const tripsById = new Map(MOCK_TRIPS.map((trip) => [trip.id, trip]));
    useAppStore.getState().trips.forEach((trip) => {
      tripsById.set(trip.id, trip);
    });
    return filterTrips([...tripsById.values()], filters);
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
    const currentUser = requireCurrentUser();
    const trip: Trip = {
      ...input,
      id: createId(),
      driverId: currentUser.id,
      seatsAvailable: input.seatsTotal,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    return trip;
  },

  async getMyTrips() {
    const currentUser = requireCurrentUser();
    return useAppStore.getState().trips.filter((trip) => trip.driverId === currentUser.id);
  },

  async cancelTrip(tripId) {
    const currentUser = requireCurrentUser();
    const trip = useAppStore.getState().trips.find((item) => item.id === tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }
    if (trip.driverId !== currentUser.id) {
      throw new ApiError({
        code: 'FORBIDDEN',
        message: 'Only the driver can cancel this trip.',
      });
    }

    return { ...trip, status: 'cancelled' };
  },

  async completeTrip(tripId) {
    const currentUser = requireCurrentUser();
    const trip = useAppStore.getState().trips.find((item) => item.id === tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }
    if (trip.driverId !== currentUser.id) {
      throw new ApiError({
        code: 'FORBIDDEN',
        message: 'Only the driver can complete this trip.',
      });
    }

    return { ...trip, status: 'completed' };
  },
};
