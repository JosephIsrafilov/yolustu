import { StateCreator } from 'zustand';
import { AppState, TripSlice } from '../types';
import { tripsService } from '@/services';

import { toApiError } from '@/services/api-error';

export const createTripSlice: StateCreator<
  AppState,
  [],
  [],
  TripSlice
> = (set) => ({
  trips: [],
  myTrips: [],
  isLoadingTrips: false,

  fetchTrips: async () => {},
  fetchMyTrips: async () => {},

  createTrip: async (data) => {
    try {
      const newTrip = await tripsService.createTrip(data);
      return newTrip.id;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to create trip.' });
      throw error;
    }
  },

  cancelTrip: async (tripId) => {
    try {
      await tripsService.cancelTrip(tripId);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId ? { ...t, status: 'cancelled' as const } : t
        ),
        myTrips: state.myTrips.map((t) =>
          t.id === tripId ? { ...t, status: 'cancelled' as const } : t
        ),
        lastError: null,
      }));
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to cancel trip.' });
      return false;
    }
  },

  completeTrip: async (tripId) => {
    try {
      await tripsService.completeTrip(tripId);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId ? { ...t, status: 'completed' as const } : t
        ),
        myTrips: state.myTrips.map((t) =>
          t.id === tripId ? { ...t, status: 'completed' as const } : t
        ),
        lastError: null,
      }));
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to complete trip.' });
      return false;
    }
  },

  startBoarding: async (tripId) => {
    try {
      const trip = await tripsService.startBoarding(tripId);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...trip } : t)),
        myTrips: state.myTrips.map((t) => (t.id === tripId ? { ...t, ...trip } : t)),
        lastError: null,
      }));
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to start boarding.' });
      return false;
    }
  },

  simulateTrip: async (tripId) => {
    try {
      await tripsService.simulateTrip(tripId);
      set({ lastError: null });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to start the trip.' });
      return false;
    }
  },

  endTrip: async (tripId) => {
    try {
      const trip = await tripsService.endTrip(tripId);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...trip } : t)),
        myTrips: state.myTrips.map((t) => (t.id === tripId ? { ...t, ...trip } : t)),
        lastError: null,
      }));
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to end the trip.' });
      return false;
    }
  },

  deleteTrip: async (tripId) => {
    try {

      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        myTrips: state.myTrips.filter((t) => t.id !== tripId),
      }));
      return true;
    } catch {
      return false;
    }
  },
});
