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
  lastError: string | null;

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
  clearError: () => void;

  // ─── Profile actions ──────────────────────────────────────
  updateProfile: (data: Partial<User>) => void;

  // ─── Trip actions ─────────────────────────────────────────
  createTrip: (data: Omit<Trip, 'id' | 'driverId' | 'seatsAvailable' | 'status' | 'createdAt'>) => string;
  cancelTrip: (tripId: string) => boolean;
  completeTrip: (tripId: string) => boolean;

  // ─── Booking actions ──────────────────────────────────────
  createBooking: (tripId: string, seats: number) => string;
  acceptBooking: (bookingId: string) => boolean;
  rejectBooking: (bookingId: string) => boolean;
  cancelBooking: (bookingId: string) => boolean;

  // ─── Review actions ───────────────────────────────────────
  createReview: (data: { tripId: string; targetUserId: string; rating: number; comment: string }) => boolean;

  // ─── Admin actions ────────────────────────────────────────
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  deleteTrip: (tripId: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Initial state ────────────────────────────────────────
  currentUser: null,
  isAuthenticated: false,
  activeRole: 'passenger',
  lastError: null,

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
      lastError: null,
    }));
  },

  login: (email: string, password: string) => {
    void password;
    const normalizedEmail = email.trim().toLowerCase();
    const user = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      set({ currentUser: null, isAuthenticated: false, activeRole: 'passenger', lastError: 'Email vЙ™ ya ЕџifrЙ™ yanlД±ЕџdД±r.' });
      return false;
    }
    if (user.isBlocked) {
      set({ currentUser: null, isAuthenticated: false, activeRole: 'passenger', lastError: 'HesabД±nД±z bloklanД±b. DЙ™stЙ™k xidmЙ™ti ilЙ™ Й™laqЙ™ saxlayД±n.' });
      return false;
    }

    // Sprint 0 mock auth intentionally accepts any valid password for demo users.
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
    if (!currentUser) {
      set({ lastError: 'GediЕџ yaratmaq ГјГ§Гјn daxil olun.' });
      return '';
    }
    if (currentUser.role !== 'driver' && get().activeRole !== 'driver') {
      set({ lastError: 'GediЕџ yaratmaq ГјГ§Гјn sГјrГјcГј roluna keГ§in.' });
      return '';
    }
    const id = generateId();
    const trip: Trip = {
      ...data,
      id,
      driverId: currentUser.id,
      seatsAvailable: data.seatsTotal,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ trips: [...s.trips, trip], lastError: null }));
    return id;
  },

  cancelTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'GediЕџ tapД±lmadД±.' });
      return false;
    }
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
      lastError: null,
    }));
    return true;
  },

  completeTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'GediЕџ tapД±lmadД±.' });
      return false;
    }
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
      lastError: null,
    }));
    return true;
  },

  // ─── Bookings ─────────────────────────────────────────────
  createBooking: (tripId, seats) => {
    const { currentUser, trips, bookings } = get();
    if (!currentUser) {
      set({ lastError: 'Rezerv sorДџusu ГјГ§Гјn daxil olun.' });
      return '';
    }
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'GediЕџ tapД±lmadД±.' });
      return '';
    }
    if (trip.driverId === currentUser.id) {
      set({ lastError: 'Г–z gediЕџinizЙ™ rezerv edЙ™ bilmЙ™zsiniz.' });
      return '';
    }
    if (trip.status !== 'active') {
      set({ lastError: 'Bu gediЕџ artД±q aktiv deyil.' });
      return '';
    }
    if (!Number.isInteger(seats) || seats < 1) {
      set({ lastError: 'Yer sayД± dГјzgГјn deyil.' });
      return '';
    }
    if (seats > trip.seatsAvailable) {
      set({ lastError: 'KifayЙ™t qЙ™dЙ™r boЕџ yer yoxdur.' });
      return '';
    }
    const hasActiveBooking = bookings.some((b) =>
      b.tripId === tripId &&
      b.passengerId === currentUser.id &&
      ['pending', 'accepted', 'completed'].includes(b.status),
    );
    if (hasActiveBooking) {
      set({ lastError: 'Bu gediЕџ ГјГ§Гјn artД±q aktiv sorДџunuz var.' });
      return '';
    }
    const id = generateId();
    const booking: Booking = {
      id,
      tripId,
      passengerId: currentUser.id,
      status: 'pending',
      seatsRequested: seats,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ bookings: [...s.bookings, booking], lastError: null }));
    return id;
  },

  acceptBooking: (bookingId) => {
    const { bookings, trips } = get();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      set({ lastError: 'Rezerv sorДџusu tapД±lmadД±.' });
      return false;
    }
    if (booking.status !== 'pending') {
      set({ lastError: 'YalnД±z gГ¶zlЙ™yЙ™n sorДџular qЙ™bul edilЙ™ bilЙ™r.' });
      return false;
    }
    const trip = trips.find((t) => t.id === booking.tripId);
    if (!trip || trip.status !== 'active') {
      set({ lastError: 'GediЕџ aktiv deyil vЙ™ ya tapД±lmadД±.' });
      return false;
    }
    if (trip.seatsAvailable < booking.seatsRequested) {
      set({ lastError: 'Bu sorДџu ГјГ§Гјn kifayЙ™t qЙ™dЙ™r boЕџ yer yoxdur.' });
      return false;
    }
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'accepted' as BookingStatus } : b,
      ),
      trips: s.trips.map((t) =>
        t.id === booking.tripId
          ? { ...t, seatsAvailable: t.seatsAvailable - booking.seatsRequested }
          : t,
      ),
      lastError: null,
    }));
    return true;
  },

  rejectBooking: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) {
      set({ lastError: 'Rezerv sorДџusu tapД±lmadД±.' });
      return false;
    }
    if (booking.status !== 'pending') {
      set({ lastError: 'YalnД±z gГ¶zlЙ™yЙ™n sorДџular rЙ™dd edilЙ™ bilЙ™r.' });
      return false;
    }
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'rejected' as BookingStatus } : b,
      ),
      lastError: null,
    }));
    return true;
  },

  cancelBooking: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) {
      set({ lastError: 'Rezerv tapД±lmadД±.' });
      return false;
    }
    if (!['pending', 'accepted'].includes(booking.status)) {
      set({ lastError: 'Bu rezerv artД±q lЙ™Дџv edilЙ™ bilmЙ™z.' });
      return false;
    }
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
      lastError: null,
    }));
    return true;
  },

  // ─── Reviews ──────────────────────────────────────────────
  createReview: (data) => {
    const { currentUser, trips, users, reviews, bookings } = get();
    if (!currentUser) {
      set({ lastError: 'RЙ™y yazmaq ГјГ§Гјn daxil olun.' });
      return false;
    }
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      set({ lastError: 'Reytinq 1-5 arasД±nda olmalД±dД±r.' });
      return false;
    }
    const trip = trips.find((t) => t.id === data.tripId);
    if (!trip) {
      set({ lastError: 'GediЕџ tapД±lmadД±.' });
      return false;
    }
    const targetUser = users.find((u) => u.id === data.targetUserId);
    if (!targetUser) {
      set({ lastError: 'QiymЙ™tlЙ™ndirilЙ™cЙ™k istifadЙ™Г§i tapД±lmadД±.' });
      return false;
    }
    const completedBooking = bookings.find((b) =>
      b.tripId === data.tripId &&
      b.passengerId === currentUser.id &&
      b.status === 'completed',
    );
    if (trip.status !== 'completed' || !completedBooking) {
      set({ lastError: 'RЙ™y yalnД±z tamamlanmД±Еџ rezervdЙ™n sonra yazД±la bilЙ™r.' });
      return false;
    }
    const duplicateReview = reviews.some((r) =>
      r.authorId === currentUser.id &&
      r.tripId === data.tripId &&
      r.targetUserId === data.targetUserId,
    );
    if (duplicateReview) {
      set({ lastError: 'Bu gediЕџ ГјГ§Гјn artД±q rЙ™y yazmД±sД±nД±z.' });
      return false;
    }
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
        lastError: null,
      };
    });
    return true;
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
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'GediЕџ tapД±lmadД±.' });
      return false;
    }
    set((s) => ({
      trips: s.trips.filter((t) => t.id !== tripId),
      // Keep historical booking rows but cancel open bookings to avoid orphan active state.
      bookings: s.bookings.map((b) =>
        b.tripId === tripId && (b.status === 'pending' || b.status === 'accepted')
          ? { ...b, status: 'cancelled' as BookingStatus }
          : b,
      ),
      reviews: s.reviews.filter((r) => r.tripId !== tripId),
      lastError: null,
    }));
    return true;
  },
}));
