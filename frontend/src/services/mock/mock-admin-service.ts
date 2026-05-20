import { ApiError } from '@/services/api-error';
import type { AdminService } from '@/services/contracts/admin-service';
import { useAppStore } from '@/store/useAppStore';
import { buildStoreError, requireAdminUser } from '@/services/mock/mock-service-utils';

export const mockAdminService: AdminService = {
  async getAdminStats() {
    requireAdminUser();
    const state = useAppStore.getState();

    return {
      totalUsers: state.users.length,
      blockedUsers: state.users.filter((user) => user.isBlocked).length,
      totalTrips: state.trips.length,
      activeTrips: state.trips.filter((trip) => trip.status === 'active').length,
      totalBookings: state.bookings.length,
      pendingBookings: state.bookings.filter((booking) => booking.status === 'pending').length,
      pendingVerifications: state.users.filter((user) => user.verificationStatus === 'pending').length,
    };
  },

  async getUsers() {
    requireAdminUser();
    return useAppStore.getState().users;
  },

  async blockUser(userId) {
    requireAdminUser();
    await useAppStore.getState().blockUser(userId);
    const user = useAppStore.getState().users.find((item) => item.id === userId);
    if (!user) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'User not found.',
      });
    }
    return user;
  },

  async unblockUser(userId) {
    requireAdminUser();
    await useAppStore.getState().unblockUser(userId);
    const user = useAppStore.getState().users.find((item) => item.id === userId);
    if (!user) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'User not found.',
      });
    }
    return user;
  },

  async getTrips() {
    requireAdminUser();
    return useAppStore.getState().trips;
  },

  async deleteTrip(tripId) {
    requireAdminUser();
    const ok = await useAppStore.getState().deleteTrip(tripId);
    if (!ok) {
      throw buildStoreError('Trip could not be deleted.', 'NOT_FOUND');
    }
  },

  async getBookings() {
    requireAdminUser();
    return useAppStore.getState().bookings;
  },

  async getPendingVerifications() {
    requireAdminUser();
    return useAppStore.getState().users.filter((user) => user.verificationStatus === 'pending');
  },

  async approveVerification(userId) {
    requireAdminUser();
    const user = useAppStore.getState().users.find((item) => item.id === userId);
    if (!user) {
      throw buildStoreError('User not found.', 'NOT_FOUND');
    }

    const updatedUser = { ...user, verificationStatus: 'approved' as const };
    useAppStore.setState((state) => ({
      users: state.users.map((item) => (item.id === userId ? updatedUser : item)),
      pendingVerifications: state.pendingVerifications.filter((item) => item.id !== userId),
    }));
    return updatedUser;
  },

  async rejectVerification(userId) {
    requireAdminUser();
    const user = useAppStore.getState().users.find((item) => item.id === userId);
    if (!user) {
      throw buildStoreError('User not found.', 'NOT_FOUND');
    }

    const updatedUser = { ...user, verificationStatus: 'rejected' as const };
    useAppStore.setState((state) => ({
      users: state.users.map((item) => (item.id === userId ? updatedUser : item)),
      pendingVerifications: state.pendingVerifications.filter((item) => item.id !== userId),
    }));
    return updatedUser;
  },
};
