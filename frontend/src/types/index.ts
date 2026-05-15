// ============================================================
// Yolüstü — Domain Types
// ============================================================

export type UserRole = 'passenger' | 'driver' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  avatarUrl?: string;
  role: UserRole;
  rating: number;
  totalTrips: number;
  isBlocked: boolean;
  bio?: string;
  createdAt: string;
}

export interface Profile {
  userId: string;
  bio: string;
  photoUrl?: string;
  preferredLanguage: string;
  rating: number;
  reviewsCount: number;
}

export type TripStatus = 'active' | 'cancelled' | 'completed';

export interface Trip {
  id: string;
  driverId: string;
  departureCity: string;
  arrivalCity: string;
  meetingPoint: string;
  dropoffPoint: string;
  date: string;
  time: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  carModel: string;
  comment?: string;
  status: TripStatus;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  status: BookingStatus;
  seatsRequested: number;
  createdAt: string;
}

export interface Review {
  id: string;
  tripId: string;
  authorId: string;
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export type ModerationItemType = 'user' | 'trip' | 'booking';

export interface AdminModerationItem {
  id: string;
  type: ModerationItemType;
  targetId: string;
  status: string;
  reason: string;
  createdAt: string;
}

// Search / Filter helpers
export interface TripSearchFilters {
  departureCity?: string;
  arrivalCity?: string;
  date?: string;
  maxPrice?: number;
  minSeats?: number;
}

// Create-trip stepper
export interface CreateTripData {
  departureCity: string;
  arrivalCity: string;
  meetingPoint: string;
  dropoffPoint: string;
  date: string;
  time: string;
  seatsTotal: number;
  pricePerSeat: number;
  carModel: string;
  comment: string;
}
