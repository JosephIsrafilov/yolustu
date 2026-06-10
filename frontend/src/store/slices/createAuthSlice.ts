import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { adminService, authService } from '@/services';
import { toApiError } from '@/services/api-error';
import { getUserCapabilities } from '@/lib/access-control';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authStatus: 'unknown',
  activeRole: 'passenger',
  activeMode: 'passenger',
  lastError: null,
  users: [],
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

  requestPasswordReset: async (email) => {
    try {
      set({ lastError: null });
      await authService.requestPasswordReset(email);
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to request password reset.' });
      return false;
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      set({ lastError: null });
      await authService.resetPassword(email, otp, newPassword);
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to reset password.' });
      return false;
    }
  },

  requestEmailVerification: async () => {
    try {
      set({ lastError: null });
      await authService.requestEmailVerification();
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to request email verification.' });
      return false;
    }
  },

  verifyEmail: async (otp) => {
    try {
      set({ lastError: null });
      const user = await authService.verifyEmail(otp);
      set({ currentUser: user });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to verify email.' });
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
        authStatus: 'authenticated',
        activeRole: user.role === 'driver' ? 'driver' : 'passenger',
        activeMode: user.role === 'driver' ? 'driver' : 'passenger',
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
        authStatus: 'authenticated',
        activeRole: user.role === 'driver' ? 'driver' : 'passenger',
        activeMode: user.role === 'driver' ? 'driver' : 'passenger',
        lastError: null,
      });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      set({
        currentUser: null,
        isAuthenticated: false,
        authStatus: 'unauthenticated',
        activeRole: 'passenger',
        activeMode: 'passenger',
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
        authStatus: 'unauthenticated',
        activeRole: 'passenger',
        activeMode: 'passenger',
        lastError: null,
      });
    }
  },

  switchRole: (role) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const capabilities = getUserCapabilities(currentUser, true, get().activeMode);
    if (role === 'driver' && !capabilities.canAccessDriverDashboard) {
      set({
        lastError: 'Driver mode is unavailable until verification is approved.',
      });
      return;
    }

    set({
      activeRole: role,
      activeMode: role,
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
          authStatus: 'authenticated',
          activeRole: 'passenger',
          activeMode: 'passenger',
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
      set({ authStatus: 'loading' });
      const user = await authService.getCurrentUser();
      if (user) {
        set({
          currentUser: user,
          isAuthenticated: true,
          authStatus: 'authenticated',
          activeRole: user.role === 'driver' ? 'driver' : 'passenger',
          activeMode: user.role === 'driver' ? 'driver' : 'passenger',
          lastError: null,
        });
      } else {
        set({
          currentUser: null,
          isAuthenticated: false,
          authStatus: 'unauthenticated',
          activeRole: 'passenger',
          activeMode: 'passenger',
        });
      }
    } catch (error) {
      const isUnauthorized =
        error && typeof error === 'object' && 'status' in error && error.status === 401;

      if (!isUnauthorized) {
        console.error('Failed to initialize auth:', error);
      }

      set({
        currentUser: null,
        isAuthenticated: false,
        authStatus: 'unauthenticated',
        activeRole: 'passenger',
        activeMode: 'passenger',
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
      const updated = await adminService.blockUser(userId);
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? updated : u)),
      }));
    } catch (error) {
      console.error('Block user error:', error);
    }
  },

  unblockUser: async (userId) => {
    try {
      const updated = await adminService.unblockUser(userId);
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? updated : u)),
      }));
    } catch (error) {
      console.error('Unblock user error:', error);
    }
  },

  fetchUsers: async () => {
    try {
      const response = await adminService.getUsers();
      set({ users: response.items });
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  },

  fetchPendingVerifications: async () => {
    try {
      const response = await adminService.getPendingVerifications();
      set({ pendingVerifications: response.items });
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

  uploadAvatar: async (file) => {
    try {
      set({ lastError: null });
      const updated = await authService.uploadAvatar(file);
      set((s) => ({
        currentUser: updated,
        users: s.users.map((u) => (u.id === updated.id ? updated : u)),
        lastError: null,
      }));
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to upload avatar.' });
      throw error;
    }
  },
});
