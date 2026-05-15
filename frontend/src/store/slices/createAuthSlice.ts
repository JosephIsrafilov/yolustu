import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { authService } from '@/services';
import type { UserRole } from '@/types';

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
  users: [],

  register: async (data) => {
    try {
      const user = await authService.register(data);
      set({
        currentUser: user,
        isAuthenticated: true,
        activeRole: 'passenger',
        lastError: null,
      });
      return true;
    } catch (error: any) {
      set({ lastError: error.message || 'Qeydiyyat zamanı xəta baş verdi.' });
      return false;
    }
  },

  login: async (email, password) => {
    try {
      set({ lastError: null });
      const user = await authService.login({ email, password });
      set({
        currentUser: user,
        isAuthenticated: true,
        activeRole: user.role === 'driver' ? 'driver' : 'passenger',
        lastError: null,
      });
      return true;
    } catch (error: any) {
      set({
        currentUser: null,
        isAuthenticated: false,
        lastError: error.message || 'Email və ya şifrə yanlışdır.',
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

  updateProfile: async (data) => {
    try {
      const updated = await authService.updateProfile(data);
      set((s) => ({
        currentUser: updated,
        users: s.users.map((u) => (u.id === updated.id ? updated : u)),
      }));
    } catch (error: any) {
      set({ lastError: error.message || 'Profil yenilənməsi zamanı xəta baş verdi.' });
      throw error;
    }
  },

  blockUser: async (userId) => {
    try {
      
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, isBlocked: true } : u)),
      }));
    } catch (error) {
      console.error('Block user error:', error);
    }
  },

  unblockUser: async (userId) => {
    try {
      
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, isBlocked: false } : u)),
      }));
    } catch (error) {
      console.error('Unblock user error:', error);
    }
  },

  fetchUsers: async () => {
    try {
      
      
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  },
});
