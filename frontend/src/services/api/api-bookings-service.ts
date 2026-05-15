import { apiClient } from '@/services/api-client';
import type { BookingsService } from '@/services/contracts/bookings-service';
import { mapApiBookingToBooking, type ApiBooking } from './mappers';

export const apiBookingsService: BookingsService = {
  async createBooking(input) {
    const backendInput = {
      ride_id: input.tripId,
      seats_booked: input.seatsRequested,
    };
    const response = await apiClient.post<ApiBooking>('/bookings', backendInput);
    return mapApiBookingToBooking(response);
  },

  async getMyBookings() {
    const response = await apiClient.get<ApiBooking[]>('/bookings/my');
    return response.map(mapApiBookingToBooking);
  },

  async getBookingRequests() {
    const response = await apiClient.get<ApiBooking[]>('/bookings/requests');
    return response.map(mapApiBookingToBooking);
  },

  async acceptBooking(bookingId) {
    const response = await apiClient.post<ApiBooking>(`/bookings/${bookingId}/confirm`);
    return mapApiBookingToBooking(response);
  },

  async rejectBooking(bookingId) {
    const response = await apiClient.post<ApiBooking>(`/bookings/${bookingId}/reject`);
    return mapApiBookingToBooking(response);
  },

  async cancelBooking(bookingId) {
    const response = await apiClient.post<ApiBooking>(`/bookings/${bookingId}/cancel`);
    return mapApiBookingToBooking(response);
  },
};
