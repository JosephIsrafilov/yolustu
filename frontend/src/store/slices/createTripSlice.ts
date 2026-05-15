import { StateCreator } from 'zustand';
import { AppState, TripSlice } from '../types';
import { tripsService } from '@/services';
import { MOCK_TRIPS } from '@/data/mock-data';

export const createTripSlice: StateCreator<
  AppState,
  [],
  [],
  TripSlice
> = (set) => ({
  trips: [...MOCK_TRIPS],
  isLoadingTrips: false,

  fetchTrips: async (filters) => {
    set({ isLoadingTrips: true });
    try {
      const trips = await tripsService.searchTrips(filters || {});
      set({ trips, isLoadingTrips: false });
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
