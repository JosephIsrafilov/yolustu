import { ApiError } from '@/services/api-error';
import type { BookingsService } from '@/services/contracts/bookings-service';
import { useAppStore } from '@/store/useAppStore';
import { requireCurrentUser } from '@/services/mock/mock-service-utils';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `b-${Date.now()}`;
}

export const mockBookingsService: BookingsService = {
  async createBooking(input) {
    const currentUser = requireCurrentUser();
    const trip = useAppStore.getState().trips.find((item) => item.id === input.tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }
    if (trip.status !== 'active') {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Trip is not active.',
      });
    }
    if (trip.driverId === currentUser.id) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'You cannot book your own trip.',
      });
    }
    if (trip.seatsAvailable < input.seatsRequested) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Not enough seats available.',
      });
    }

    return {
      id: createId(),
      tripId: input.tripId,
      passengerId: currentUser.id,
      status: 'pending',
      seatsRequested: input.seatsRequested,
      createdAt: new Date().toISOString(),
    };
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
    const currentUser = requireCurrentUser();
    const state = useAppStore.getState();
    const booking = state.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Booking not found.',
      });
    }
    const trip = state.trips.find((item) => item.id === booking.tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }
    if (trip.driverId !== currentUser.id) {
      throw new ApiError({
        code: 'FORBIDDEN',
        message: 'Only the driver can accept this booking.',
      });
    }
    if (booking.status !== 'pending') {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Booking is not pending.',
      });
    }
    if (trip.seatsAvailable < booking.seatsRequested) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Not enough seats available.',
      });
    }

    useAppStore.setState((current) => ({
      trips: current.trips.map((item) =>
        item.id === trip.id
          ? { ...item, seatsAvailable: item.seatsAvailable - booking.seatsRequested }
          : item,
      ),
    }));
    return { ...booking, status: 'accepted' };
  },

  async rejectBooking(bookingId) {
    const currentUser = requireCurrentUser();
    const state = useAppStore.getState();
    const booking = state.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Booking not found.',
      });
    }
    const trip = state.trips.find((item) => item.id === booking.tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }
    if (trip.driverId !== currentUser.id) {
      throw new ApiError({
        code: 'FORBIDDEN',
        message: 'Only the driver can reject this booking.',
      });
    }
    return { ...booking, status: 'rejected' };
  },

  async cancelBooking(bookingId) {
    const currentUser = requireCurrentUser();
    const state = useAppStore.getState();
    const booking = state.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Booking not found.',
      });
    }
    if (booking.passengerId !== currentUser.id) {
      throw new ApiError({
        code: 'FORBIDDEN',
        message: 'Only the passenger can cancel this booking.',
      });
    }
    if (booking.status === 'accepted') {
      useAppStore.setState((current) => ({
        trips: current.trips.map((trip) =>
          trip.id === booking.tripId
            ? { ...trip, seatsAvailable: trip.seatsAvailable + booking.seatsRequested }
            : trip,
        ),
      }));
    }
    return { ...booking, status: 'cancelled' };
  },
};
