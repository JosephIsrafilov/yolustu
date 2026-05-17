import type { CreateTripData, Trip, TripSearchFilters } from '@/types';

export type CreateTripInput = CreateTripData;

export interface TripsService {
  searchTrips(filters: TripSearchFilters): Promise<Trip[]>;
  getTripById(tripId: string): Promise<Trip>;
  createTrip(input: CreateTripInput): Promise<Trip>;
  getMyTrips(): Promise<Trip[]>;
  cancelTrip(tripId: string): Promise<Trip>;
  completeTrip(tripId: string): Promise<Trip>;
}
