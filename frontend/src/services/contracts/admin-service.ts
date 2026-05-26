import type { Booking, Trip, User } from '@/types';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}


export interface AdminStats {
  totalUsers: number;
  blockedUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  pendingBookings: number;
  pendingVerifications: number;
}

export interface AdminService {
  getAdminStats(): Promise<AdminStats>;
  getUsers(page?: number, limit?: number): Promise<Paginated<User>>;
  blockUser(userId: string): Promise<User>;
  unblockUser(userId: string): Promise<User>;
  getTrips(page?: number, limit?: number): Promise<Paginated<Trip>>;
  deleteTrip(tripId: string): Promise<void>;
  getBookings(page?: number, limit?: number): Promise<Paginated<Booking>>;
  getPendingVerifications(page?: number, limit?: number): Promise<Paginated<User>>;
  approveVerification(userId: string): Promise<User>;
  rejectVerification(userId: string): Promise<User>;
  simulateJourney(): Promise<{ message: string; ride_id: string }>;
}
