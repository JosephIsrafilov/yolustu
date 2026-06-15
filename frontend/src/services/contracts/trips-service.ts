import type { CreateTripData, Trip, TripSearchFilters } from '@/types';

export type CreateTripInput = CreateTripData;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PublicTrackInfo {
  rideId: string;
  status: string;
  originCity: string;
  destinationCity: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  driverName?: string;
  carModel?: string;
}

export interface TripsService {
  searchTrips(filters: TripSearchFilters, options?: RequestInit): Promise<PaginatedResponse<Trip>>;
  getTripById(tripId: string): Promise<Trip>;
  createTrip(input: CreateTripInput): Promise<Trip>;
  getMyTrips(): Promise<Trip[]>;
  cancelTrip(tripId: string): Promise<Trip>;
  completeTrip(tripId: string): Promise<Trip>;
  startBoarding(tripId: string): Promise<Trip>;
  simulateTrip(tripId: string): Promise<void>;
  endTrip(tripId: string): Promise<Trip>;
  getPublicTrack(shareToken: string): Promise<PublicTrackInfo>;
}
