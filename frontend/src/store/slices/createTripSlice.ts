import { StateCreator } from 'zustand';
import { AppState, TripSlice } from '../types';
import { tripsService } from '@/services';
import { MOCK_TRIPS } from '@/data/mock-data';
import { isMockDataMode } from '@/lib/env';

export const createTripSlice: StateCreator<
  AppState,
  [],
  [],
  TripSlice
> = (set) => ({
  trips: isMockDataMode ? [...MOCK_TRIPS] : [],
  isLoadingTrips: false,

  fetchTrips: async (filters) => {
    set({ isLoadingTrips: true });
    try {
      const trips = await tripsService.searchTrips(filters || {});
      set((state) => {
        const drivers = trips
          .map((trip) => trip.driver)
          .filter((driver): driver is NonNullable<typeof driver> => Boolean(driver));
        const usersById = new Map(state.users.map((user) => [user.id, user]));
        drivers.forEach((driver) => usersById.set(driver.id, driver));
        return { trips, users: [...usersById.values()], isLoadingTrips: false };
      });
    } catch (error) {
      console.error('Fetch trips error:', error);
      set({ isLoadingTrips: false });
    }
  },

  createTrip: async (data) => {
    try {
      const newTrip = await tripsService.createTrip(data);
      set((state) => ({
        trips: [newTrip, ...state.trips],
        users: newTrip.driver
          ? [newTrip.driver, ...state.users.filter((user) => user.id !== newTrip.driver?.id)]
          : state.users,
      }));
      return newTrip.id;
    } catch (error) {
      console.error('Create trip error:', error);
      throw error;
    }
  },

  cancelTrip: async (tripId) => {
    try {
      await tripsService.cancelTrip(tripId);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId ? { ...t, status: 'cancelled' } : t
        ),
      }));
      return true;
    } catch (error) {
      console.error('Cancel trip error:', error);
      return false;
    }
  },

  completeTrip: async (tripId) => {
    try {
      await tripsService.completeTrip(tripId);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId ? { ...t, status: 'completed' } : t
        ),
      }));
      return true;
    } catch (error) {
      console.error('Complete trip error:', error);
      return false;
    }
  },

  deleteTrip: async (tripId) => {
    try {
      
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
      }));
      return true;
    } catch (error) {
      console.error('Delete trip error:', error);
      return false;
    }
  },
});
