import type { Booking, Trip, User } from '@/types';

export interface AdminStats {
  totalUsers: number;
  blockedUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  pendingBookings: number;
}

export interface AdminService {
  getAdminStats(): Promise<AdminStats>;
  getUsers(): Promise<User[]>;
  blockUser(userId: string): Promise<User>;
  unblockUser(userId: string): Promise<User>;
  getTrips(): Promise<Trip[]>;
  deleteTrip(tripId: string): Promise<void>;
  getBookings(): Promise<Booking[]>;
}
