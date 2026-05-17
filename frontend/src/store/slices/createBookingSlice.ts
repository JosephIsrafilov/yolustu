import { StateCreator } from 'zustand';
import { AppState, BookingSlice } from '../types';
import { bookingsService } from '@/services';
import { MOCK_BOOKINGS } from '@/data/mock-data';
import { isMockDataMode } from '@/lib/env';

export const createBookingSlice: StateCreator<
  AppState,
  [],
  [],
  BookingSlice
> = (set) => {
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
      };
    });

  return ({
  bookings: isMockDataMode ? [...MOCK_BOOKINGS] : [],

  fetchBookings: async () => {
    try {
      const bookings = await bookingsService.getMyBookings();
      mergeBookings(bookings);
    } catch (error) {
      console.error('Fetch bookings error:', error);
    }
  },

  fetchBookingRequests: async () => {
    try {
      const bookings = await bookingsService.getBookingRequests();
      mergeBookings(bookings);
    } catch (error) {
      console.error('Fetch booking requests error:', error);
    }
  },

  createBooking: async (tripId, seats) => {
    try {
      const booking = await bookingsService.createBooking({ tripId, seatsRequested: seats });
      set((state) => ({
        bookings: [booking, ...state.bookings],
      }));
      return booking.id;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  },

  acceptBooking: async (bookingId) => {
    try {
      await bookingsService.acceptBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'accepted' } : b
        ),
      }));
      return true;
    } catch (error) {
      console.error('Accept booking error:', error);
      return false;
    }
  },

  rejectBooking: async (bookingId) => {
    try {
      await bookingsService.rejectBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'rejected' } : b
        ),
      }));
      return true;
    } catch (error) {
      console.error('Reject booking error:', error);
      return false;
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      await bookingsService.cancelBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ),
      }));
      return true;
    } catch (error) {
      console.error('Cancel booking error:', error);
      return false;
    }
  },
  });
};
