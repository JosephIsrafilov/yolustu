import { apiClient } from '@/services/api-client';
import type {
  BookingsService,
  CreateBookingInput,
} from '@/services/contracts/bookings-service';
import type { Booking } from '@/types';

export const apiBookingsService: BookingsService = {
  async createBooking(input: CreateBookingInput) {
    return apiClient.post<Booking>('/bookings', input);
  },

  async getMyBookings() {
    return apiClient.get<Booking[]>('/bookings/me');
  },

  async getBookingRequests() {
    return apiClient.get<Booking[]>('/bookings/requests');
  },

  async acceptBooking(bookingId) {
    return apiClient.patch<Booking>(`/bookings/${bookingId}/accept`);
  },

  async rejectBooking(bookingId) {
    return apiClient.patch<Booking>(`/bookings/${bookingId}/reject`);
  },

  async cancelBooking(bookingId) {
    return apiClient.patch<Booking>(`/bookings/${bookingId}/cancel`);
  },
};
