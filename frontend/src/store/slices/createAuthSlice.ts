import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { MOCK_USERS } from '@/data/mock-data';
import { generateId } from '@/lib/utils';
import type { User, UserRole } from '@/types';

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
  users: [...MOCK_USERS],

  register: (data) => {
    const newUser: User = {
      id: generateId(),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      city: '',
      avatarUrl: '',
      role: 'passenger',
      rating: 0,
      totalTrips: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      users: [...s.users, newUser],
      currentUser: newUser,
      isAuthenticated: true,
      activeRole: 'passenger',
      lastError: null,
    }));
  },

  login: (email: string, password: string) => {
    void password;
    const normalizedEmail = email.trim().toLowerCase();
    const user = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      set({ currentUser: null, isAuthenticated: false, activeRole: 'passenger', lastError: 'Email və ya şifrə yanlışdır.' });
      return false;
    }
    if (user.isBlocked) {
      set({ currentUser: null, isAuthenticated: false, activeRole: 'passenger', lastError: 'Hesabınız bloklanıb. Dəstək xidməti ilə əlaqə saxlayın.' });
      return false;
    }

    set({
      currentUser: user,
      isAuthenticated: true,
      activeRole: user.role === 'driver' ? 'driver' : 'passenger',
      lastError: null,
    });
    return true;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, activeRole: 'passenger', lastError: null });
  },

  switchRole: (role) => {
    const { currentUser } = get();
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
      set({ activeRole: role, lastError: null });
      return;
    }
    set({
      activeRole: role,
      currentUser: { ...currentUser, role: role as UserRole },
      lastError: null,
    });
  },

  loginAsAdmin: () => {
    const admin = get().users.find((u) => u.role === 'admin');
    if (admin) {
      set({ currentUser: admin, isAuthenticated: true, activeRole: 'passenger', lastError: null });
    }
  },

  clearError: () => {
    set({ lastError: null });
  },

  updateProfile: (data) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    set((s) => ({
      currentUser: updated,
      users: s.users.map((u) => (u.id === currentUser.id ? updated : u)),
    }));
  },

  blockUser: (userId) => {
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? { ...u, isBlocked: true } : u)),
    }));
  },

  unblockUser: (userId) => {
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? { ...u, isBlocked: false } : u)),
    }));
  },
});
