import type { User, Trip, Booking, Review } from '@/types';

export interface AuthSlice {
  // ─── Auth State ───────────────────────────────────────────
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: 'passenger' | 'driver';
  lastError: string | null;
  users: User[];

  // ─── Auth Actions ─────────────────────────────────────────
  register: (data: { fullName: string; email: string; phone: string; password: string }) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: 'passenger' | 'driver') => void;
  loginAsAdmin: () => void;
  clearError: () => void;

  // ─── Profile Actions ──────────────────────────────────────
  updateProfile: (data: Partial<User>) => void;

  // ─── Admin Actions (User related) ─────────────────────────
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
}

export interface TripSlice {
  // ─── Trip State ───────────────────────────────────────────
  trips: Trip[];

  // ─── Trip Actions ─────────────────────────────────────────
  createTrip: (data: Omit<Trip, 'id' | 'driverId' | 'seatsAvailable' | 'status' | 'createdAt'>) => string;
  cancelTrip: (tripId: string) => boolean;
  completeTrip: (tripId: string) => boolean;

  // ─── Admin Actions (Trip related) ─────────────────────────
  deleteTrip: (tripId: string) => boolean;
}

export interface BookingSlice {
  // ─── Booking State ────────────────────────────────────────
  bookings: Booking[];

  // ─── Booking Actions ──────────────────────────────────────
  createBooking: (tripId: string, seats: number) => string;
  acceptBooking: (bookingId: string) => boolean;
  rejectBooking: (bookingId: string) => boolean;
  cancelBooking: (bookingId: string) => boolean;
}

export interface ReviewSlice {
  // ─── Review State ─────────────────────────────────────────
  reviews: Review[];

  // ─── Review Actions ───────────────────────────────────────
  createReview: (data: { tripId: string; targetUserId: string; rating: number; comment: string }) => boolean;
}

// ─── Combined Store State ───────────────────────────────────
export type AppState = AuthSlice & TripSlice & BookingSlice & ReviewSlice;
