import { apiClient } from '@/services/api-client';
import type { AdminService, AdminStats } from '@/services/contracts/admin-service';

interface ApiPaginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
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

  async getUsers(options = {}) {
    const { page = 1, limit = 10, role, status, verification, q } = options;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (verification) params.set('verification', verification);
    if (q && q.trim()) params.set('q', q.trim());
    const res = await apiClient.get<ApiPaginated<ApiUser>>(`/admin/users?${params.toString()}`);
    return {
      ...res,
      items: res.items.map(mapApiUserToUser)
    };
  },

  async createUser(input) {
    const body = {
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      email: input.email || undefined,
      password: input.password,
      role: input.role,
      city: input.city || undefined,
    };
    const user = await apiClient.post<ApiUser>('/admin/users', body);
    return mapApiUserToUser(user);
  },

  async updateUserRole(userId, role) {
    const user = await apiClient.patch<ApiUser>(`/admin/users/${userId}/role`, { role });
    return mapApiUserToUser(user);
  },

  async blockUser(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/users/${userId}/block`);
    return mapApiUserToUser(user);
  },

  async unblockUser(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/users/${userId}/unblock`);
    return mapApiUserToUser(user);
  },

  async getTrips(page = 1, limit = 10) {
    const res = await apiClient.get<ApiPaginated<ApiTrip>>(`/admin/rides?page=${page}&limit=${limit}`);
    return {
      ...res,
      items: res.items.map(mapApiTripToTrip)
    };
  },

  async deleteTrip(tripId) {
    await apiClient.delete<unknown>(`/admin/rides/${tripId}`);
  },

  async getBookings(page = 1, limit = 10) {
    const res = await apiClient.get<ApiPaginated<ApiBooking>>(`/admin/bookings?page=${page}&limit=${limit}`);
    return {
      ...res,
      items: res.items.map(mapApiBookingToBooking)
    };
  },
  
  async getPendingVerifications(page = 1, limit = 10) {
    const res = await apiClient.get<ApiPaginated<ApiUser>>(`/admin/verifications?page=${page}&limit=${limit}`);
    return {
      ...res,
      items: res.items.map(mapApiUserToUser)
    };
  },

  async approveVerification(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/verifications/${userId}/approve`);
    return mapApiUserToUser(user);
  },

  async rejectVerification(userId) {
    const user = await apiClient.patch<ApiUser>(`/admin/verifications/${userId}/reject`);
    return mapApiUserToUser(user);
  },

  async simulateJourney() {
    return apiClient.post<{ message: string; ride_id: string }>('/admin/mock/journey');
  },
};
