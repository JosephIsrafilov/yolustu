import type { Booking, Trip, User, UserRole } from '@/types';

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

export interface GetUsersOptions {
  page?: number;
  limit?: number;
  role?: string;
  status?: 'active' | 'blocked' | 'all';
  verification?: 'none' | 'pending' | 'approved' | 'rejected' | 'all';
  q?: string;
}

export interface AdminCreateUserInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
  city?: string;
}

export interface AdminService {
  getAdminStats(): Promise<AdminStats>;
  getUsers(options?: GetUsersOptions): Promise<Paginated<User>>;
  createUser(input: AdminCreateUserInput): Promise<User>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
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
