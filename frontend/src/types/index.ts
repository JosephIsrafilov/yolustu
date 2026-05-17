

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

export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
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
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  driver?: User;
  vehicle?: Vehicle;
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  status: BookingStatus;
  seatsRequested: number;
  createdAt: string;
  trip?: Trip;
  passenger?: User;
}

export interface Review {
  id: string;
  tripId: string;
  authorId: string;
  targetUserId: string;
  rating: number; 
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
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

export interface TripSearchFilters {
  departureCity?: string;
  arrivalCity?: string;
  date?: string;
  maxPrice?: number;
  minSeats?: number;
}

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
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  vehicleId?: string;
  newVehicle?: {
    brand: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
  };
}
