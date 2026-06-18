import type { User, Trip, Booking, Review, TripSearchFilters, CreateTripData } from '@/types';
import type { UpdateProfileInput } from '@/services/contracts/auth-service';
import type { Language } from '@/lib/i18n';
import type { ActiveMode } from '@/lib/access-control';

export interface AuthSlice {
  currentUser: User | null;
  isAuthenticated: boolean;
  authStatus: 'unknown' | 'loading' | 'authenticated' | 'unauthenticated' | 'pending_verification';
  activeRole: 'passenger' | 'driver';
  activeMode: ActiveMode;
  lastError: string | null;
  users: User[];
  pendingVerifications: User[];

  register: (data: { fullName: string; phone: string; email: string; password: string }) => Promise<boolean>;
  login: (phone: string, password: string) => Promise<boolean>;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyAccount: (phone: string, otp: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  requestEmailVerification: () => Promise<boolean>;
  verifyEmail: (otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearSession: () => void;
  switchRole: (role: 'passenger' | 'driver') => void;
  loginAsAdmin: () => Promise<void>;
  clearError: () => void;
  initAuth: () => Promise<void>;

  updateProfile: (data: UpdateProfileInput) => Promise<void>;

  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  
  fetchUsers: () => Promise<void>;
  
  fetchPendingVerifications: () => Promise<void>;
  approveVerification: (userId: string) => Promise<void>;
  rejectVerification: (userId: string) => Promise<void>;
  submitVerification: (file: File) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

export interface TripSlice {
  trips: Trip[];
  myTrips: Trip[];
  isLoadingTrips: boolean;

  fetchTrips: (filters?: TripSearchFilters) => Promise<void>;
  fetchMyTrips: () => Promise<void>;
  createTrip: (data: CreateTripData) => Promise<string>;
  cancelTrip: (tripId: string) => Promise<boolean>;
  completeTrip: (tripId: string) => Promise<boolean>;
  startBoarding: (tripId: string) => Promise<boolean>;
  simulateTrip: (tripId: string) => Promise<boolean>;
  endTrip: (tripId: string) => Promise<boolean>;
  deleteTrip: (tripId: string) => Promise<boolean>;
}

export interface BookingSlice {
  bookings: Booking[];

  fetchBookings: () => Promise<void>;
  fetchBookingRequests: () => Promise<void>;
  createBooking: (tripId: string, seats: number) => Promise<string>;
  acceptBooking: (bookingId: string) => Promise<boolean>;
  rejectBooking: (bookingId: string) => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  markBoarded: (bookingId: string) => Promise<boolean>;
  markNoShow: (bookingId: string) => Promise<boolean>;
}

export interface ReviewSlice {
  reviews: Review[];

  fetchReviews: (targetUserId: string) => Promise<void>;
  createReview: (data: { tripId: string; targetUserId: string; rating: number; comment: string }) => Promise<boolean>;
}

export interface UiSlice {
  language: Language;
  setLanguage: (language: Language) => void;
  unreadRides: Record<string, boolean>;
  markRideAsRead: (rideId: string) => void;
  markRideAsUnread: (rideId: string) => void;
}

export type AppState = AuthSlice & TripSlice & BookingSlice & ReviewSlice & UiSlice;
