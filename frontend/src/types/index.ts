

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
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  isEmailVerified: boolean;
  documentUrl?: string;
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
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  musicAllowed?: boolean;
  femaleOnly?: boolean;
  availableSpots?: string[];
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'paid' | 'completed';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type WalletTransactionType =
  | 'passenger_payment'
  | 'platform_fee'
  | 'driver_pending_earning'
  | 'driver_available_earning'
  | 'refund'
  | 'payout'
  | 'adjustment';

export interface Payment {
  id: string;
  bookingId: string;
  passengerId?: string;
  driverId?: string;
  amount: number;
  serviceFee: number;
  driverAmount: number;
  currency: string;
  provider: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
  status: PaymentStatus;
  transactionId?: string;
  failureReason?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  totalEarned: number;
  totalSpent: number;
  totalRefunded: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  paymentId?: string;
  bookingId?: string;
  rideId?: string;
  type: WalletTransactionType;
  direction: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'pending' | 'posted' | 'reversed';
  description?: string;
  createdAt: string;
}

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
  femaleOnly?: boolean;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  musicAllowed?: boolean;
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
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  musicAllowed?: boolean;
  femaleOnly?: boolean;
  availableSpots?: string[];
}
