

import type { Trip, TripSearchFilters } from '@/types';

export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function filterTrips(trips: Trip[], filters: TripSearchFilters): Trip[] {
  return trips.filter((t) => {
    if (t.status !== 'active') return false;
    if (t.seatsAvailable <= 0) return false;
    if (filters.departureCity && t.departureCity !== filters.departureCity) return false;
    if (filters.arrivalCity && t.arrivalCity !== filters.arrivalCity) return false;
    if (filters.date && t.date !== filters.date) return false;
    if (filters.maxPrice && t.pricePerSeat > filters.maxPrice) return false;
    if (filters.minSeats && t.seatsAvailable < filters.minSeats) return false;
    return true;
  });
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validatePhone(phone: string): boolean {
  return /^\+994\d{9}$/.test(phone) || phone.length >= 10;
}
