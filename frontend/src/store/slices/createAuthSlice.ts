import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { adminService, authService } from '@/services';
import { MOCK_USERS } from '@/data/mock-data';
import { toApiError } from '@/services/api-error';
import type { UserRole } from '@/types';
import { isMockDataMode } from '@/lib/env';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  activeRole: 'passenger',
  lastError: null,
  users: isMockDataMode ? [...MOCK_USERS] : [],
  pendingVerifications: [],

  requestOtp: async (phone) => {
    try {
      set({ lastError: null });
      await authService.requestOtp(phone);
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to request OTP.' });
      return false;
    }
  },

  verifyAccount: async (phone, otp) => {
    try {
      set({ lastError: null });
      await authService.verifyOtp({ phone, otp });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to verify OTP.' });
      return false;
    }
  },

  register: async (data) => {
    try {
      set({ lastError: null });
      const user = await authService.register(data);
      set({
        currentUser: user,
        isAuthenticated: true,
        activeRole: user.role === 'driver' ? 'driver' : 'passenger',
        lastError: null,
      });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Registration failed.' });
      return false;
    }
  },

  login: async (phone, password) => {
    try {
      set({ lastError: null });
      const user = await authService.login({ phone, password });
      set({
        currentUser: user,
        isAuthenticated: true,
        activeRole: user.role === 'driver' ? 'driver' : 'passenger',
        lastError: null,
      });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({
        currentUser: null,
        isAuthenticated: false,
        activeRole: 'passenger',
        lastError: apiError.message || 'Invalid phone or password.',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        currentUser: null,
        isAuthenticated: false,
        activeRole: 'passenger',
        lastError: null,
      });
    }
  },

  switchRole: (role) => {
    const { currentUser } = get();
    if (!currentUser) return;

    if (!isMockDataMode) {
      set({
        lastError: 'Role switching is disabled in API mode.',
      });
      return;
    }

    set({
      activeRole: role,
      currentUser: { ...currentUser, role: role as UserRole },
      lastError: null,
    });
  },

  loginAsAdmin: async () => {
    try {
      const users = get().users;
      const admin = users.find((u) => u.role === 'admin');
      if (admin) {
        set({
          currentUser: admin,
          isAuthenticated: true,
          activeRole: 'passenger',
          lastError: null,
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
    }
  },

  clearError: () => {
    set({ lastError: null });
  },

  initAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({
          currentUser: null,
          isAuthenticated: false,
          activeRole: 'passenger',
        });
        return;
      }

      const user = await authService.getCurrentUser();
      if (user) {
        set({
          currentUser: user,
          isAuthenticated: true,
          activeRole: user.role === 'driver' ? 'driver' : 'passenger',
          lastError: null,
        });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        set({
          currentUser: null,
          isAuthenticated: false,
          activeRole: 'passenger',
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      set({
        currentUser: null,
        isAuthenticated: false,
        activeRole: 'passenger',
      });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ lastError: null });
      const updated = await authService.updateProfile(data);
      set((s) => ({
        currentUser: updated,
        users: s.users.map((u) => (u.id === updated.id ? updated : u)),
        lastError: null,
      }));
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to update profile.' });
      throw error;
    }
  },

  blockUser: async (userId) => {
    try {
      const updated = isMockDataMode
        ? undefined
        : await adminService.blockUser(userId);
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? updated ?? { ...u, isBlocked: true } : u)),
      }));
    } catch (error) {
      console.error('Block user error:', error);
    }
  },

  unblockUser: async (userId) => {
    try {
      const updated = isMockDataMode
        ? undefined
        : await adminService.unblockUser(userId);
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? updated ?? { ...u, isBlocked: false } : u)),
      }));
    } catch (error) {
      console.error('Unblock user error:', error);
    }
  },

  fetchUsers: async () => {
    try {
      if (isMockDataMode) return;
      const users = await adminService.getUsers();
      set({ users });
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  },

  fetchPendingVerifications: async () => {
    try {
      if (isMockDataMode) return;
      const users = await adminService.getPendingVerifications();
      set({ pendingVerifications: users });
    } catch (error) {
      console.error('Fetch pending verifications error:', error);
    }
  },

  approveVerification: async (userId) => {
    try {
      const updated = await adminService.approveVerification(userId);
      set((s) => ({
        pendingVerifications: s.pendingVerifications.filter((u) => u.id !== userId),
        users: s.users.map((u) => (u.id === userId ? updated : u)),
      }));
    } catch (error) {
      console.error('Approve verification error:', error);
    }
  },

  rejectVerification: async (userId) => {
    try {
      const updated = await adminService.rejectVerification(userId);
      set((s) => ({
        pendingVerifications: s.pendingVerifications.filter((u) => u.id !== userId),
        users: s.users.map((u) => (u.id === userId ? updated : u)),
      }));
    } catch (error) {
      console.error('Reject verification error:', error);
    }
  },

  submitVerification: async (file) => {
    try {
      set({ lastError: null });
      const updated = await authService.submitVerification(file);
      set({ currentUser: updated, lastError: null });
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to submit verification.' });
      throw error;
    }
  },
});
