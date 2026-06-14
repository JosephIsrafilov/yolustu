import { StateCreator } from 'zustand';
import { AppState, TripSlice } from '../types';
import { tripsService } from '@/services';

import { toApiError } from '@/services/api-error';

let searchAbortController: AbortController | null = null;

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const maybeAbortError = error as { name?: string; message?: string };
  return (
    maybeAbortError.name === 'AbortError'
    || maybeAbortError.message?.toLowerCase().includes('aborted') === true
  );
}

export const createTripSlice: StateCreator<
  AppState,
  [],
  [],
  TripSlice
> = (set, get) => ({
  trips: [],
  myTrips: [],
  isLoadingTrips: false,

  fetchTrips: async (filters) => {
    if (searchAbortController) {
      searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    set({ isLoadingTrips: true });
    try {
      const trips = await tripsService.searchTrips(filters || {}, { signal: searchAbortController.signal });
      set((state) => {
        const drivers = trips
          .map((trip) => trip.driver)
          .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver));
        const usersById = new Map(state.users.map((user) => [user.id, user]));
        drivers.forEach((driver) => usersById.set(driver.id, driver));
        return {
          trips,
          users: [...usersById.values()],
          isLoadingTrips: false,
          lastError: null,
        };
      });
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return; // ignore aborted request errors
      }
      const apiError = toApiError(error);
      set({ isLoadingTrips: false, lastError: apiError.message || 'Failed to load trips.' });
    }
  },

  fetchMyTrips: async () => {
    set({ isLoadingTrips: true });
    try {
      const myTrips = await tripsService.getMyTrips();
      set((state) => {
        const drivers = myTrips
          .map((trip) => trip.driver)
          .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver));
        const usersById = new Map(state.users.map((user) => [user.id, user]));
        drivers.forEach((driver) => usersById.set(driver.id, driver));
        return {
          myTrips,
          users: [...usersById.values()],
          isLoadingTrips: false,
          lastError: null,
        };
      });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      set({ isLoadingTrips: false, lastError: apiError.message || 'Failed to load your trips.' });
    }
  },

  createTrip: async (data) => {
    try {
      const newTrip = await tripsService.createTrip(data);
      await get().fetchMyTrips();
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

  deleteTrip: async (tripId) => {
    try {

      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        myTrips: state.myTrips.filter((t) => t.id !== tripId),
      }));
      return true;
    } catch (error) {
      return false;
    }
  },
});
