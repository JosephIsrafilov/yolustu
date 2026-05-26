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

  async getUsers(page = 1, limit = 10) {
    requireAdminUser();
    const items = useAppStore.getState().users;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);
    return {
      items: paginatedItems,
      total: items.length,
      page,
      size: limit,
      pages: Math.ceil(items.length / limit),
    };
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

  async getTrips(page = 1, limit = 10) {
    requireAdminUser();
    const items = useAppStore.getState().trips;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);
    return {
      items: paginatedItems,
      total: items.length,
      page,
      size: limit,
      pages: Math.ceil(items.length / limit),
    };
  },

  async deleteTrip(tripId) {
    requireAdminUser();
    const ok = await useAppStore.getState().deleteTrip(tripId);
    if (!ok) {
      throw buildStoreError('Trip could not be deleted.', 'NOT_FOUND');
    }
  },

  async getBookings(page = 1, limit = 10) {
    requireAdminUser();
    const items = useAppStore.getState().bookings;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);
    return {
      items: paginatedItems,
      total: items.length,
      page,
      size: limit,
      pages: Math.ceil(items.length / limit),
    };
  },

  async getPendingVerifications(page = 1, limit = 10) {
    requireAdminUser();
    const items = useAppStore.getState().users.filter((user) => user.verificationStatus === 'pending');
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);
    return {
      items: paginatedItems,
      total: items.length,
      page,
      size: limit,
      pages: Math.ceil(items.length / limit),
    };
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

  async simulateJourney() {
    requireAdminUser();
    return { message: "Mock journey created successfully", ride_id: "mock-ride-id" };
  },
};
