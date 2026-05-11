import type { Trip, TripSearchFilters } from '@/types';

export type CreateTripInput = Omit<
  Trip,
  'id' | 'driverId' | 'seatsAvailable' | 'status' | 'createdAt'
>;

export interface TripsService {
  searchTrips(filters: TripSearchFilters): Promise<Trip[]>;
  getTripById(tripId: string): Promise<Trip>;
  createTrip(input: CreateTripInput): Promise<Trip>;
  getMyTrips(): Promise<Trip[]>;
  cancelTrip(tripId: string): Promise<Trip>;
  completeTrip(tripId: string): Promise<Trip>;
}
