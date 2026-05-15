import type { User, Trip, Booking, Review } from '@/types';

export interface AuthSlice {
  
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: 'passenger' | 'driver';
  lastError: string | null;
  users: User[];

  register: (data: { fullName: string; email: string; phone: string; password: string }) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: 'passenger' | 'driver') => void;
  loginAsAdmin: () => void;
  clearError: () => void;

  updateProfile: (data: Partial<User>) => void;

  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
}

export interface TripSlice {
  
  trips: Trip[];

  createTrip: (data: Omit<Trip, 'id' | 'driverId' | 'seatsAvailable' | 'status' | 'createdAt'>) => string;
  cancelTrip: (tripId: string) => boolean;
  completeTrip: (tripId: string) => boolean;

  deleteTrip: (tripId: string) => boolean;
}

export interface BookingSlice {
  
  bookings: Booking[];

  createBooking: (tripId: string, seats: number) => string;
  acceptBooking: (bookingId: string) => boolean;
  rejectBooking: (bookingId: string) => boolean;
  cancelBooking: (bookingId: string) => boolean;
}

export interface ReviewSlice {
  
  reviews: Review[];

  createReview: (data: { tripId: string; targetUserId: string; rating: number; comment: string }) => boolean;
}

export type AppState = AuthSlice & TripSlice & BookingSlice & ReviewSlice;
