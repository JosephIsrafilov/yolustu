// ============================================================
// Yolüstü — Zustand Global Store
// All state is in-memory mock data for Sprint 0.
// TODO: Replace with real API calls in Sprint 1+
// ============================================================
'use client';

import { create } from 'zustand';
import type { User, Trip, Booking, Review, BookingStatus, UserRole } from '@/types';
import {
  MOCK_USERS,
  MOCK_TRIPS,
  MOCK_BOOKINGS,
  MOCK_REVIEWS,
} from '@/data/mock-data';
import { generateId } from '@/lib/utils';

interface AppState {
  // ─── Auth ─────────────────────────────────────────────────
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: 'passenger' | 'driver';

  // ─── Data ─────────────────────────────────────────────────
  users: User[];
  trips: Trip[];
  bookings: Booking[];
  reviews: Review[];

  // ─── Auth actions ─────────────────────────────────────────
  register: (data: { fullName: string; email: string; phone: string; password: string }) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: 'passenger' | 'driver') => void;
  loginAsAdmin: () => void;

  // ─── Profile actions ──────────────────────────────────────
  updateProfile: (data: Partial<User>) => void;

  // ─── Trip actions ─────────────────────────────────────────
  createTrip: (data: Omit<Trip, 'id' | 'driverId' | 'seatsAvailable' | 'status' | 'createdAt'>) => string;
  cancelTrip: (tripId: string) => void;
  completeTrip: (tripId: string) => void;

  // ─── Booking actions ──────────────────────────────────────
  createBooking: (tripId: string, seats: number) => string;
  acceptBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string) => void;
  cancelBooking: (bookingId: string) => void;

  // ─── Review actions ───────────────────────────────────────
  createReview: (data: { tripId: string; targetUserId: string; rating: number; comment: string }) => void;

  // ─── Admin actions ────────────────────────────────────────
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  deleteTrip: (tripId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Initial state ────────────────────────────────────────
  currentUser: null,
  isAuthenticated: false,
  activeRole: 'passenger',

  users: [...MOCK_USERS],
  trips: [...MOCK_TRIPS],
  bookings: [...MOCK_BOOKINGS],
  reviews: [...MOCK_REVIEWS],

  // ─── Auth ─────────────────────────────────────────────────
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
    }));
  },

  login: (email: string) => {
    const user = get().users.find((u) => u.email === email);
    if (user) {
      set({ currentUser: user, isAuthenticated: true, activeRole: user.role === 'admin' ? 'passenger' : (user.role as 'passenger' | 'driver') });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, activeRole: 'passenger' });
  },

  switchRole: (role) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set({
      activeRole: role,
      currentUser: { ...currentUser, role: role as UserRole },
    });
  },

  loginAsAdmin: () => {
    const admin = get().users.find((u) => u.role === 'admin');
    if (admin) {
      set({ currentUser: admin, isAuthenticated: true });
    }
  },

  // ─── Profile ──────────────────────────────────────────────
  updateProfile: (data) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    set((s) => ({
      currentUser: updated,
      users: s.users.map((u) => (u.id === currentUser.id ? updated : u)),
    }));
  },

  // ─── Trips ────────────────────────────────────────────────
  createTrip: (data) => {
    const { currentUser } = get();
    if (!currentUser) return '';
    const id = generateId();
    const trip: Trip = {
      ...data,
      id,
      driverId: currentUser.id,
      seatsAvailable: data.seatsTotal,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ trips: [...s.trips, trip] }));
    return id;
  },

  cancelTrip: (tripId) => {
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId ? { ...t, status: 'cancelled' as const } : t,
      ),
      // Also cancel all pending/accepted bookings for this trip
      bookings: s.bookings.map((b) => {
        if (b.tripId === tripId && (b.status === 'pending' || b.status === 'accepted')) {
          return { ...b, status: 'cancelled' as BookingStatus };
        }
        return b;
      }),
    }));
  },

  completeTrip: (tripId) => {
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId ? { ...t, status: 'completed' as const } : t,
      ),
      bookings: s.bookings.map((b) => {
        if (b.tripId === tripId && b.status === 'accepted') {
          return { ...b, status: 'completed' as BookingStatus };
        }
        return b;
      }),
    }));
  },

  // ─── Bookings ─────────────────────────────────────────────
  createBooking: (tripId, seats) => {
    const { currentUser } = get();
    if (!currentUser) return '';
    const id = generateId();
    const booking: Booking = {
      id,
      tripId,
      passengerId: currentUser.id,
      status: 'pending',
      seatsRequested: seats,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ bookings: [...s.bookings, booking] }));
    return id;
  },

  acceptBooking: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'accepted' as BookingStatus } : b,
      ),
      trips: s.trips.map((t) =>
        t.id === booking.tripId
          ? { ...t, seatsAvailable: Math.max(0, t.seatsAvailable - booking.seatsRequested) }
          : t,
      ),
    }));
  },

  rejectBooking: (bookingId) => {
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'rejected' as BookingStatus } : b,
      ),
    }));
  },

  cancelBooking: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const wasAccepted = booking.status === 'accepted';
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b,
      ),
      trips: wasAccepted
        ? s.trips.map((t) =>
            t.id === booking.tripId
              ? { ...t, seatsAvailable: Math.min(t.seatsTotal, t.seatsAvailable + booking.seatsRequested) }
              : t,
          )
        : s.trips,
    }));
  },

  // ─── Reviews ──────────────────────────────────────────────
  createReview: (data) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const review: Review = {
      id: generateId(),
      tripId: data.tripId,
      authorId: currentUser.id,
      targetUserId: data.targetUserId,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const allReviews = [...s.reviews, review];
      // Recalculate average rating for target user
      const targetReviews = allReviews.filter((r) => r.targetUserId === data.targetUserId);
      const avgRating = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
      return {
        reviews: allReviews,
        users: s.users.map((u) =>
          u.id === data.targetUserId ? { ...u, rating: Math.round(avgRating * 10) / 10 } : u,
        ),
        currentUser:
          s.currentUser?.id === data.targetUserId
            ? { ...s.currentUser, rating: Math.round(avgRating * 10) / 10 }
            : s.currentUser,
      };
    });
  },

  // ─── Admin ────────────────────────────────────────────────
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

  deleteTrip: (tripId) => {
    set((s) => ({
      trips: s.trips.filter((t) => t.id !== tripId),
    }));
  },
}));
