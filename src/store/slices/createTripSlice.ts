import { StateCreator } from 'zustand';
import { AppState, TripSlice } from '../types';
import { MOCK_TRIPS } from '@/data/mock-data';
import { generateId } from '@/lib/utils';
import type { Trip, BookingStatus } from '@/types';

export const createTripSlice: StateCreator<
  AppState,
  [],
  [],
  TripSlice
> = (set, get) => ({
  trips: [...MOCK_TRIPS],

  createTrip: (data) => {
    const { currentUser } = get();
    if (!currentUser) {
      set({ lastError: 'Gediş yaratmaq üçün daxil olun.' });
      return '';
    }
    if (currentUser.role !== 'driver' && get().activeRole !== 'driver') {
      set({ lastError: 'Gediş yaratmaq üçün sürücü roluna keçin.' });
      return '';
    }
    const id = generateId();
    const trip: Trip = {
      ...data,
      id,
      driverId: currentUser.id,
      seatsAvailable: data.seatsTotal,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ trips: [...s.trips, trip], lastError: null }));
    return id;
  },

  cancelTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'Gediş tapılmadı.' });
      return false;
    }
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId ? { ...t, status: 'cancelled' as const } : t,
      ),
      bookings: s.bookings.map((b) => {
        if (b.tripId === tripId && (b.status === 'pending' || b.status === 'accepted')) {
          return { ...b, status: 'cancelled' as BookingStatus };
        }
        return b;
      }),
      lastError: null,
    }));
    return true;
  },

  completeTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'Gediş tapılmadı.' });
      return false;
    }
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId ? { ...t, status: 'completed' as const } : t,
      ),
      bookings: s.bookings.map((b) => {
        if (b.tripId === tripId && b.status === 'accepted') {
          return { ...b, status: 'completed' as BookingStatus };
        }
        return b;
      }),
      lastError: null,
    }));
    return true;
  },

  deleteTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'Gediş tapılmadı.' });
      return false;
    }
    set((s) => ({
      trips: s.trips.filter((t) => t.id !== tripId),
      bookings: s.bookings.map((b) =>
        b.tripId === tripId && (b.status === 'pending' || b.status === 'accepted')
          ? { ...b, status: 'cancelled' as BookingStatus }
          : b,
      ),
      reviews: s.reviews.filter((r) => r.tripId !== tripId),
      lastError: null,
    }));
    return true;
  },
});
