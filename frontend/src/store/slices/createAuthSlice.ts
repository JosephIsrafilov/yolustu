import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { adminService, authService } from '@/services';
import { toApiError } from '@/services/api-error';
import { getUserCapabilities } from '@/lib/access-control';

function hasSessionHint() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split('; ')
    .some((entry) => entry.startsWith('csrf_token='));
}

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
      const { currentUser } = get();
      set({
        isAuthenticated: true,
        authStatus: 'authenticated',
        activeRole: currentUser?.role === 'driver' ? 'driver' : 'passenger',
        activeMode: currentUser?.role === 'driver' ? 'driver' : 'passenger',
      });
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
      const otp = await authService.requestPasswordReset(email);
      return otp;
    } catch (error) {
      const apiError = toApiError(error);
      set({ lastError: apiError.message || 'Failed to request password reset.' });
      return null;
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
      const currentUser = get().currentUser;
      if (currentUser) {
        set({ currentUser: { ...currentUser, isEmailVerified: true } });
      }
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
      // MVP: registration no longer gates on SMS OTP. The /auth/register
      // response already carries an authenticated session (cookies set
      // server-side), so the account is active immediately. Email
      // verification is an opt-in step on the profile page.
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
    } catch {
      // Error handled silently
    } finally {
      get().clearSession();
    }
  },

  clearSession: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
      authStatus: 'unauthenticated',
      activeRole: 'passenger',
      activeMode: 'passenger',
      lastError: null,
    });
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
      // Error handled silently
    }
  },

  clearError: () => {
    set({ lastError: null });
  },

  initAuth: async () => {
    if (!hasSessionHint()) {
      get().clearSession();
      return;
    }

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
        get().clearSession();
      }
    } catch (error) {
      const isUnauthorized =
        error && typeof error === 'object' && 'status' in error && error.status === 401;

      if (!isUnauthorized) {
        // Error handled silently
      }

      get().clearSession();
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
      // Error handled silently
    }
  },

  unblockUser: async (userId) => {
    try {
      const updated = await adminService.unblockUser(userId);
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? updated : u)),
      }));
    } catch (error) {
      // Error handled silently
    }
  },

  fetchUsers: async () => {
    try {
      const response = await adminService.getUsers();
      set({ users: response.items });
    } catch (error) {
      // Error handled silently
    }
  },

  fetchPendingVerifications: async () => {
    try {
      const response = await adminService.getPendingVerifications();
      set({ pendingVerifications: response.items });
    } catch (error) {
      // Error handled silently
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
      // Error handled silently
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
      // Error handled silently
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
