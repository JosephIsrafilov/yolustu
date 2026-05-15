import { apiClient } from '@/services/api-client';
import type { AdminService, AdminStats } from '@/services/contracts/admin-service';
import type { Booking, Trip, User } from '@/types';

export const apiAdminService: AdminService = {
  async getAdminStats() {
    return apiClient.get<AdminStats>('/admin/stats');
  },

  async getUsers() {
    return apiClient.get<User[]>('/admin/users');
  },

  async blockUser(userId) {
    return apiClient.patch<User>(`/admin/users/${userId}/block`);
  },

  async unblockUser(userId) {
    return apiClient.patch<User>(`/admin/users/${userId}/unblock`);
  },

  async getTrips() {
    return apiClient.get<Trip[]>('/admin/rides');
  },

  async deleteTrip(tripId) {
    await apiClient.delete<unknown>(`/admin/rides/${tripId}`);
  },

  async getBookings() {
    return apiClient.get<Booking[]>('/admin/bookings');
  },
};
