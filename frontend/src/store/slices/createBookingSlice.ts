import { StateCreator } from 'zustand';
import { AppState, BookingSlice } from '../types';
import { bookingsService } from '@/services';
import { MOCK_BOOKINGS } from '@/data/mock-data';
import { isMockDataMode } from '@/lib/env';
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
  bookings: isMockDataMode ? [...MOCK_BOOKINGS] : [],

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

  createBooking: async (tripId, seats) => {
    try {
      const booking = await bookingsService.createBooking({ tripId, seatsRequested: seats });
      set((state) => ({
        bookings: [booking, ...state.bookings],
        trips: booking.trip
          ? state.trips.map((trip) => (trip.id === booking.trip!.id ? booking.trip! : trip))
          : state.trips,
        lastError: null,
      }));
      if (!isMockDataMode) {
        await get().fetchBookings();
        await get().fetchTrips();
      }
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
      if (!isMockDataMode) {
        await get().fetchBookingRequests();
        await get().fetchTrips();
      }
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
      if (!isMockDataMode) {
        await get().fetchBookingRequests();
      }
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
      if (!isMockDataMode) {
        await get().fetchBookings();
        await get().fetchTrips();
      }
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to cancel booking.' });
      return false;
    }
  },
  });
};
