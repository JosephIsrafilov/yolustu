import { demoBookingsService, demoTripsService, updateDemoTrip } from '@/services/demo/core';
import { demoPaymentsService } from '@/services/demo/extra';
import { getDemoData, saveDemoData, seedDemoData } from '@/services/demo/data';

let nextId = 0;
Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: () => `test-${++nextId}` });

beforeEach(() => {
  Object.assign(getDemoData(), seedDemoData());
  saveDemoData();
});

it('keeps seats and wallet balances consistent from request through refund', async () => {
  const data = getDemoData();
  data.currentUserId = 'passenger';
  const booking = await demoBookingsService.createBooking({ tripId: 'ride-baku-quba', seatsRequested: 2 });
  expect(data.trips.find((trip) => trip.id === 'ride-baku-quba')?.seatsAvailable).toBe(4);
  data.currentUserId = 'driver';
  await demoBookingsService.acceptBooking(booking.id);
  expect(data.trips.find((trip) => trip.id === 'ride-baku-quba')?.seatsAvailable).toBe(2);
  data.currentUserId = 'passenger';
  await demoPaymentsService.payFromWallet(booking.id);
  expect((await demoPaymentsService.getWallet()).availableBalance).toBe(36);
  expect(data.bookings.find((item) => item.id === booking.id)?.status).toBe('paid');
  await demoBookingsService.cancelBooking(booking.id);
  expect(data.trips.find((trip) => trip.id === 'ride-baku-quba')?.seatsAvailable).toBe(4);
  expect((await demoPaymentsService.getWallet()).availableBalance).toBe(60);
  expect(data.payments.find((item) => item.bookingId === booking.id)?.status).toBe('refunded');
  expect(data.balances.driver).toBe(42);
});

it('makes newly created trips searchable by passengers', async () => {
  getDemoData().currentUserId = 'driver';
  const trip = await demoTripsService.createTrip({ departureCity: 'Baku', arrivalCity: 'Sheki', date: '2026-11-07', time: '11:00', seatsTotal: 3, pricePerSeat: 15, meetingPoint: 'Centre', dropoffPoint: 'Centre', carModel: 'Toyota Prius', comment: '' });
  await updateDemoTrip(trip.id, { date: '2026-11-08', time: '12:00', seatsTotal: 2, pricePerSeat: 17 });
  getDemoData().currentUserId = 'passenger';
  const result = await demoTripsService.searchTrips({ departureCity: 'Baku', arrivalCity: 'Sheki', minSeats: 2, maxPrice: 17 });
  expect(result.items.some((item) => item.id === trip.id)).toBe(true);
});
