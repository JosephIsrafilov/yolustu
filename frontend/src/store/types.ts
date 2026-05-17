import type { User, Trip, Booking, Review, TripSearchFilters, CreateTripData } from '@/types';

export interface AuthSlice {
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: 'passenger' | 'driver';
  lastError: string | null;
  users: User[];

  register: (data: { fullName: string; phone: string; password: string }) => Promise<boolean>;
  login: (phone: string, password: string) => Promise<boolean>;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyAccount: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: 'passenger' | 'driver') => void;
  loginAsAdmin: () => Promise<void>;
  clearError: () => void;
  initAuth: () => Promise<void>;

  updateProfile: (data: Partial<User>) => Promise<void>;

  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  
  fetchUsers: () => Promise<void>;
}

export interface TripSlice {
  trips: Trip[];
  isLoadingTrips: boolean;

  fetchTrips: (filters?: TripSearchFilters) => Promise<void>;
  createTrip: (data: CreateTripData) => Promise<string>;
  cancelTrip: (tripId: string) => Promise<boolean>;
  completeTrip: (tripId: string) => Promise<boolean>;
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
}

export interface ReviewSlice {
  reviews: Review[];

  fetchReviews: (targetUserId: string) => Promise<void>;
  createReview: (data: { tripId: string; targetUserId: string; rating: number; comment: string }) => Promise<boolean>;
}

export type AppState = AuthSlice & TripSlice & BookingSlice & ReviewSlice;
