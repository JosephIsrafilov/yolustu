import type { Booking, SeatSpot } from '@/types';

export interface CreateBookingInput {
  tripId: string;
  seatsRequested: number;
  selectedSpots: SeatSpot[];
}

export interface BookingsService {
  createBooking(input: CreateBookingInput): Promise<Booking>;
  getMyBookings(): Promise<Booking[]>;
  getBookingRequests(): Promise<Booking[]>;
  acceptBooking(bookingId: string): Promise<Booking>;
  rejectBooking(bookingId: string): Promise<Booking>;
  cancelBooking(bookingId: string): Promise<Booking>;
  markBoarded(bookingId: string): Promise<Booking>;
  markNoShow(bookingId: string): Promise<Booking>;
}
