import { StateCreator } from 'zustand';
import { AppState, BookingSlice } from '../types';
import { bookingsService } from '@/services';

export const createBookingSlice: StateCreator<
  AppState,
  [],
  [],
  BookingSlice
> = (set, get) => ({
  bookings: [],

  fetchBookings: async () => {
    try {
      const bookings = await bookingsService.getMyBookings();
      set({ bookings });
    } catch (error) {
      console.error('Fetch bookings error:', error);
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
