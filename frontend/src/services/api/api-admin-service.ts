import { apiClient } from '@/services/api-client';
import type { AdminService, AdminStats } from '@/services/contracts/admin-service';
import {
  mapApiBookingToBooking,
  mapApiTripToTrip,
  mapApiUserToUser,
  type ApiBooking,
  type ApiTrip,
  type ApiUser,
} from './mappers';

export const apiAdminService: AdminService = {
  async getAdminStats() {
    return apiClient.get<AdminStats>('/admin/stats');
  },

  async getUsers() {
    const users = await apiClient.get<ApiUser[]>('/admin/users');
    return users.map(mapApiUserToUser);
  },

  async blockUser(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/users/${userId}/block`);
    return mapApiUserToUser(user);
  },

  async unblockUser(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/users/${userId}/unblock`);
    return mapApiUserToUser(user);
  },

  async getTrips() {
    const trips = await apiClient.get<ApiTrip[]>('/admin/rides');
    return trips.map(mapApiTripToTrip);
  },

  async deleteTrip(tripId) {
    await apiClient.delete<unknown>(`/admin/rides/${tripId}`);
  },

  async getBookings() {
    const bookings = await apiClient.get<ApiBooking[]>('/admin/bookings');
    return bookings.map(mapApiBookingToBooking);
  },
  
  async getPendingVerifications() {
    const users = await apiClient.get<ApiUser[]>('/admin/verifications');
    return users.map(mapApiUserToUser);
  },

  async approveVerification(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/verifications/${userId}/approve`);
    return mapApiUserToUser(user);
  },

  async rejectVerification(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/verifications/${userId}/reject`);
    return mapApiUserToUser(user);
  },
};
