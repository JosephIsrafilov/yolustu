import { ApiError } from '@/services/api-error';
import type { BookingsService } from '@/services/contracts/bookings-service';
import { useAppStore } from '@/store/useAppStore';
import { buildStoreError, requireCurrentUser } from '@/services/mock/mock-service-utils';

export const mockBookingsService: BookingsService = {
  async createBooking(input) {
    const bookingId = await useAppStore.getState().createBooking(input.tripId, input.seatsRequested);
    if (!bookingId) {
      throw buildStoreError('Booking request could not be created.');
    }
    const booking = useAppStore.getState().bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'UNKNOWN_ERROR',
        message: 'Booking was created but is missing.',
      });
    }
    return booking;
  },

  async getMyBookings() {
    const currentUser = requireCurrentUser();
    return useAppStore.getState().bookings.filter((booking) => booking.passengerId === currentUser.id);
  },

  async getBookingRequests() {
    const currentUser = requireCurrentUser();
    const tripIds = new Set(
      useAppStore
        .getState()
        .trips.filter((trip) => trip.driverId === currentUser.id)
        .map((trip) => trip.id),
    );
    return useAppStore.getState().bookings.filter((booking) => tripIds.has(booking.tripId));
  },

  async acceptBooking(bookingId) {
    const ok = await useAppStore.getState().acceptBooking(bookingId);
    if (!ok) {
      throw buildStoreError('Booking request could not be accepted.');
    }
    const booking = useAppStore.getState().bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Booking not found after acceptance.',
      });
    }
    return booking;
  },

  async rejectBooking(bookingId) {
    const ok = await useAppStore.getState().rejectBooking(bookingId);
    if (!ok) {
      throw buildStoreError('Booking request could not be rejected.');
    }
    const booking = useAppStore.getState().bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Booking not found after rejection.',
      });
    }
    return booking;
  },

  async cancelBooking(bookingId) {
    const ok = await useAppStore.getState().cancelBooking(bookingId);
    if (!ok) {
      throw buildStoreError('Booking could not be cancelled.');
    }
    const booking = useAppStore.getState().bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Booking not found after cancellation.',
      });
    }
    return booking;
  },
};
