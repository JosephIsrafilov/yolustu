import { StateCreator } from 'zustand';
import { AppState, BookingSlice } from '../types';
import { bookingsService } from '@/services';
import { invalidateWalletQueries } from '@/lib/query-client';

import { toApiError } from '@/services/api-error';

export const createBookingSlice: StateCreator<
  AppState,
  [],
  [],
  BookingSlice
> = (set, get) => {
  const mergeBookings = (bookings: Awaited<ReturnType<typeof bookingsService.getMyBookings>>) =>
    set((state) => {
      const bookingsById = new Map(state.bookings.map((booking) => [booking.id, booking]));
      const tripsById = new Map(state.trips.map((trip) => [trip.id, trip]));
      const usersById = new Map(state.users.map((user) => [user.id, user]));

      bookings.forEach((booking) => {
        bookingsById.set(booking.id, booking);
        if (booking.trip) tripsById.set(booking.trip.id, booking.trip);
        if (booking.trip?.driver) usersById.set(booking.trip.driver.id, booking.trip.driver);
        if (booking.passenger) usersById.set(booking.passenger.id, booking.passenger);
      });

      return {
        bookings: [...bookingsById.values()],
        trips: [...tripsById.values()],
        users: [...usersById.values()],
        lastError: null,
      };
    });

  return ({
  bookings: [],

  fetchBookings: async () => {
    try {
      const bookings = await bookingsService.getMyBookings();
      mergeBookings(bookings);
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to load bookings.' });
    }
  },

  fetchBookingRequests: async () => {
    try {
      const bookings = await bookingsService.getBookingRequests();
      mergeBookings(bookings);
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to load booking requests.' });
    }
  },

  createBooking: async (tripId, selectedSpots) => {
    try {
      const booking = await bookingsService.createBooking({
        tripId,
        seatsRequested: selectedSpots.length,
        selectedSpots,
      });
      set((state) => ({
        bookings: [booking, ...state.bookings],
        trips: booking.trip
          ? state.trips.map((trip) => (trip.id === booking.trip!.id ? booking.trip! : trip))
          : state.trips,
        lastError: null,
      }));
      await get().fetchBookings();
      await get().fetchTrips();
      await invalidateWalletQueries();
      return booking.id;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to create booking.' });
      throw error;
    }
  },

  acceptBooking: async (bookingId) => {
    try {
      const booking = await bookingsService.acceptBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, ...booking } : b
        ),
        trips: booking.trip
          ? state.trips.map((trip) => (trip.id === booking.trip!.id ? booking.trip! : trip))
          : state.trips,
        lastError: null,
      }));
      await get().fetchBookingRequests();
      await get().fetchTrips();
      await invalidateWalletQueries();
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to accept booking.' });
      return false;
    }
  },

  rejectBooking: async (bookingId) => {
    try {
      const booking = await bookingsService.rejectBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, ...booking } : b
        ),
        trips: booking.trip
          ? state.trips.map((trip) => (trip.id === booking.trip!.id ? booking.trip! : trip))
          : state.trips,
        lastError: null,
      }));
      await get().fetchBookingRequests();
      await invalidateWalletQueries();
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to reject booking.' });
      return false;
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const booking = await bookingsService.cancelBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, ...booking } : b
        ),
        trips: booking.trip
          ? state.trips.map((trip) => (trip.id === booking.trip!.id ? booking.trip! : trip))
          : state.trips,
        lastError: null,
      }));
      await get().fetchBookings();
      await get().fetchTrips();
      await invalidateWalletQueries();
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to cancel booking.' });
      return false;
    }
  },

  markBoarded: async (bookingId) => {
    try {
      const booking = await bookingsService.markBoarded(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, ...booking } : b
        ),
        lastError: null,
      }));
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to mark passenger as boarded.' });
      return false;
    }
  },

  markNoShow: async (bookingId) => {
    try {
      const booking = await bookingsService.markNoShow(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, ...booking } : b
        ),
        lastError: null,
      }));
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to mark passenger as no-show.' });
      return false;
    }
  },
  });
};
