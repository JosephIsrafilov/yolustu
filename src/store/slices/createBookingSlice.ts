import { StateCreator } from 'zustand';
import { AppState, BookingSlice } from '../types';
import { MOCK_BOOKINGS } from '@/data/mock-data';
import { generateId } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

export const createBookingSlice: StateCreator<
  AppState,
  [],
  [],
  BookingSlice
> = (set, get) => ({
  bookings: [...MOCK_BOOKINGS],

  createBooking: (tripId, seats) => {
    const { currentUser, trips, bookings } = get();
    if (!currentUser) {
      set({ lastError: 'Rezerv sorğusu üçün daxil olun.' });
      return '';
    }
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) {
      set({ lastError: 'Gediş tapılmadı.' });
      return '';
    }
    if (trip.driverId === currentUser.id) {
      set({ lastError: 'Öz gedişinizə rezerv edə bilməzsiniz.' });
      return '';
    }
    if (trip.status !== 'active') {
      set({ lastError: 'Bu gediş artıq aktiv deyil.' });
      return '';
    }
    if (!Number.isInteger(seats) || seats < 1) {
      set({ lastError: 'Yer sayı düzgün deyil.' });
      return '';
    }
    if (seats > trip.seatsAvailable) {
      set({ lastError: 'Kifayət qədər boş yer yoxdur.' });
      return '';
    }
    const hasActiveBooking = bookings.some((b) =>
      b.tripId === tripId &&
      b.passengerId === currentUser.id &&
      ['pending', 'accepted', 'completed'].includes(b.status),
    );
    if (hasActiveBooking) {
      set({ lastError: 'Bu gediş üçün artıq aktiv sorğunuz var.' });
      return '';
    }
    const id = generateId();
    const booking: Booking = {
      id,
      tripId,
      passengerId: currentUser.id,
      status: 'pending',
      seatsRequested: seats,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ bookings: [...s.bookings, booking], lastError: null }));
    return id;
  },

  acceptBooking: (bookingId) => {
    const { bookings, trips } = get();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      set({ lastError: 'Rezerv sorğusu tapılmadı.' });
      return false;
    }
    if (booking.status !== 'pending') {
      set({ lastError: 'Yalnız gözləyən sorğular qəbul edilə bilər.' });
      return false;
    }
    const trip = trips.find((t) => t.id === booking.tripId);
    if (!trip || trip.status !== 'active') {
      set({ lastError: 'Gediş aktiv deyil və ya tapılmadı.' });
      return false;
    }
    if (trip.seatsAvailable < booking.seatsRequested) {
      set({ lastError: 'Bu sorğu üçün kifayət qədər boş yer yoxdur.' });
      return false;
    }
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'accepted' as BookingStatus } : b,
      ),
      trips: s.trips.map((t) =>
        t.id === booking.tripId
          ? { ...t, seatsAvailable: t.seatsAvailable - booking.seatsRequested }
          : t,
      ),
      lastError: null,
    }));
    return true;
  },

  rejectBooking: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) {
      set({ lastError: 'Rezerv sorğusu tapılmadı.' });
      return false;
    }
    if (booking.status !== 'pending') {
      set({ lastError: 'Yalnız gözləyən sorğular rədd edilə bilər.' });
      return false;
    }
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'rejected' as BookingStatus } : b,
      ),
      lastError: null,
    }));
    return true;
  },

  cancelBooking: (bookingId) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) {
      set({ lastError: 'Rezerv tapılmadı.' });
      return false;
    }
    if (!['pending', 'accepted'].includes(booking.status)) {
      set({ lastError: 'Bu rezerv artıq ləğv edilə bilməz.' });
      return false;
    }
    const wasAccepted = booking.status === 'accepted';
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b,
      ),
      trips: wasAccepted
        ? s.trips.map((t) =>
            t.id === booking.tripId
              ? { ...t, seatsAvailable: Math.min(t.seatsTotal, t.seatsAvailable + booking.seatsRequested) }
              : t,
          )
        : s.trips,
      lastError: null,
    }));
    return true;
  },
});
