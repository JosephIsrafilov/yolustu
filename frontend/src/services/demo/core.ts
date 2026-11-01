import type { AuthService } from '@/services/contracts/auth-service';
import type { TripsService } from '@/services/contracts/trips-service';
import type { BookingsService } from '@/services/contracts/bookings-service';
import type { ReviewsService } from '@/services/contracts/reviews-service';
import type { Booking, Trip, User } from '@/types';
import { filterTrips, validateEmail, validatePassword, validatePhone } from '@/lib/mock-api';
import { getCityCoordinates } from '@/lib/utils';
import { currentDemoUser, demoId, getDemoData, notifyDemoUser, requireDemo, saveDemoData } from './data';
import { refundDemoBooking } from './extra';

const delay = () => new Promise((resolve) => setTimeout(resolve, 180));
const tripFor = (trip: Trip): Trip => {
  const data = getDemoData();
  return { ...trip, driver: data.users.find((user) => user.id === trip.driverId), vehicle: data.vehicles.find((vehicle) => vehicle.userId === trip.driverId) };
};
const bookingFor = (booking: Booking): Booking => ({ ...booking, trip: tripFor(requireDemo(getDemoData().trips.find((trip) => trip.id === booking.tripId), 'Trip unavailable.')), passenger: getDemoData().users.find((user) => user.id === booking.passengerId) });
const ownTrip = (id: string): Trip => {
  const trip = requireDemo(getDemoData().trips.find((item) => item.id === id), 'Trip not found.');
  if (trip.driverId !== currentDemoUser().id) throw new Error('This trip belongs to another driver.');
  return trip;
};
const ownRequest = (id: string): Booking => {
  const booking = requireDemo(getDemoData().bookings.find((item) => item.id === id), 'Booking not found.');
  ownTrip(booking.tripId);
  return booking;
};
export async function updateDemoTrip(id: string, changes: { date: string; time: string; pricePerSeat: number; seatsTotal: number }): Promise<Trip> {
  await delay();
  const trip = ownTrip(id);
  const reserved = trip.seatsTotal - trip.seatsAvailable;
  if (trip.status !== 'active' || !changes.date || !changes.time || changes.pricePerSeat <= 0 || !Number.isInteger(changes.seatsTotal) || changes.seatsTotal < Math.max(1, reserved)) throw new Error(`Enter a valid date, time, price and at least ${Math.max(1, reserved)} seats.`);
  Object.assign(trip, changes, { seatsAvailable: changes.seatsTotal - reserved });
  saveDemoData();
  return tripFor(trip);
}

export const demoAuthService: AuthService = {
  async login({ phone, password }) { await delay(); const data = getDemoData(); const user = data.users.find((entry) => entry.phone === phone || entry.email === phone); if (!user || data.passwords[user.id] !== password) throw new Error('Invalid demo phone or password.'); data.currentUserId = user.id; saveDemoData(); return user; },
  async register(input) { await delay(); if (!validatePhone(input.phone) || !validateEmail(input.email) || !validatePassword(input.password)) throw new Error('Enter a valid phone, email and password (6 or more characters).'); const data = getDemoData(); if (data.users.some((user) => user.phone === input.phone || user.email === input.email)) throw new Error('This demo account already exists.'); const user: User = { id: demoId('user'), fullName: input.fullName.trim(), phone: input.phone, email: input.email, city: 'Baku', role: 'passenger', rating: 0, totalTrips: 0, isBlocked: false, verificationStatus: 'none', isEmailVerified: false, createdAt: new Date().toISOString() }; if (!user.fullName) throw new Error('Enter your name.'); data.users.push(user); data.passwords[user.id] = input.password; data.currentUserId = user.id; saveDemoData(); return user; },
  async requestOtp(phone) { await delay(); if (!validatePhone(phone)) throw new Error('Enter a valid phone number.'); },
  async verifyOtp({ otp }) { await delay(); if (otp !== '123456') throw new Error('Use demo OTP 123456.'); const user = getDemoData().users.find((item) => item.id === getDemoData().currentUserId); if (user) { user.isEmailVerified = true; saveDemoData(); } },
  async requestPasswordReset(email) { await delay(); if (!getDemoData().users.some((user) => user.email === email)) throw new Error('Email not found in this demo.'); },
  async resetPassword(email, otp, newPassword) { await delay(); if (otp !== '123456' || !validatePassword(newPassword)) throw new Error('Use OTP 123456 and a password of 6 or more characters.'); const data = getDemoData(); const user = requireDemo(data.users.find((item) => item.email === email), 'Email not found.'); data.passwords[user.id] = newPassword; saveDemoData(); },
  async requestEmailVerification() { await delay(); currentDemoUser(); },
  async verifyEmail(otp) { await delay(); if (otp !== '123456') throw new Error('Use demo OTP 123456.'); const user = currentDemoUser(); user.isEmailVerified = true; saveDemoData(); return user; },
  async logout() { getDemoData().currentUserId = null; saveDemoData(); },
  async getCurrentUser() { await delay(); return getDemoData().users.find((user) => user.id === getDemoData().currentUserId) ?? null; },
  async updateProfile(input) { await delay(); const user = currentDemoUser(); Object.assign(user, input); saveDemoData(); return { ...user }; },
  async submitVerification() { await delay(); const user = currentDemoUser(); user.verificationStatus = 'approved'; saveDemoData(); return { ...user }; },
  async uploadAvatar(file) { await delay(); if (!file.type.startsWith('image/') || file.size > 500_000) throw new Error('Choose an image under 500 KB for this browser demo.'); const user = currentDemoUser(); user.avatarUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read image.')); reader.readAsDataURL(file); }); saveDemoData(); return { ...user }; },
  async registerDeviceToken() {},
};

export const demoTripsService: TripsService = {
  async searchTrips(filters) { await delay(); const data = getDemoData(); const items = filterTrips(data.trips, filters).map(tripFor); const offset = filters.offset ?? 0; const limit = filters.limit ?? items.length; return { items: items.slice(offset, offset + limit), total: items.length, page: Math.floor(offset / (limit || 1)) + 1, size: limit, pages: Math.ceil(items.length / (limit || 1)) }; },
  async getTripById(id) { await delay(); return tripFor(requireDemo(getDemoData().trips.find((trip) => trip.id === id), 'Trip not found.')); },
  async createTrip(input) { await delay(); const user = currentDemoUser(); if (user.role !== 'driver') throw new Error('Choose the driver demo account first.'); if (!input.departureCity || !input.arrivalCity || input.departureCity === input.arrivalCity || input.seatsTotal < 1 || input.pricePerSeat <= 0) throw new Error('Enter a valid route, seat count and price.'); const data = getDemoData(); const vehicle = input.newVehicle ? { ...input.newVehicle, id: demoId('vehicle'), userId: user.id, createdAt: new Date().toISOString(), plateNumber: input.newVehicle.plateNumber } : data.vehicles.find((item) => item.id === input.vehicleId || item.userId === user.id); if (input.newVehicle) data.vehicles.push(vehicle!); const trip: Trip = { ...input, id: demoId('ride'), driverId: user.id, seatsAvailable: input.seatsTotal, status: 'active', createdAt: new Date().toISOString(), shareToken: demoId('track'), origin: input.origin ?? getCityCoordinates(input.departureCity), destination: input.destination ?? getCityCoordinates(input.arrivalCity), carModel: input.carModel || `${vehicle?.brand} ${vehicle?.model}` }; data.trips.unshift(trip); saveDemoData(); return tripFor(trip); },
  async getMyTrips() { await delay(); return getDemoData().trips.filter((trip) => trip.driverId === currentDemoUser().id).map(tripFor); },
  async cancelTrip(id) { await delay(); const trip = ownTrip(id); if (trip.status !== 'active') throw new Error('Only published trips can be cancelled.'); trip.status = 'cancelled'; for (const booking of getDemoData().bookings.filter((item) => item.tripId === id && !['cancelled', 'rejected', 'completed'].includes(item.status))) { refundDemoBooking(booking); booking.status = 'cancelled'; } saveDemoData(); return tripFor(trip); },
  async completeTrip(id) { await delay(); const trip = ownTrip(id); if (!['active', 'boarding'].includes(trip.status)) throw new Error('Trip cannot be completed.'); trip.status = 'completed'; for (const booking of getDemoData().bookings.filter((item) => item.tripId === id && ['paid', 'boarded', 'accepted'].includes(item.status))) booking.status = 'completed'; saveDemoData(); return tripFor(trip); },
  async startBoarding(id) { await delay(); const trip = ownTrip(id); if (trip.status !== 'active') throw new Error('Trip is not active.'); trip.status = 'boarding'; saveDemoData(); return tripFor(trip); },
  async simulateTrip(id) { await demoTripsService.startBoarding(id); },
  async endTrip(id) { return demoTripsService.completeTrip(id); },
  async getPublicTrack(token) { await delay(); const trip = requireDemo(getDemoData().trips.find((item) => item.shareToken === token), 'Tracking link not found.'); return { rideId: trip.id, status: trip.status, originCity: trip.departureCity, destinationCity: trip.arrivalCity, origin: trip.origin ?? getCityCoordinates(trip.departureCity)!, destination: trip.destination ?? getCityCoordinates(trip.arrivalCity)!, driverName: getDemoData().users.find((user) => user.id === trip.driverId)?.fullName, carModel: trip.carModel }; },
};

export const demoBookingsService: BookingsService = {
  async createBooking({ tripId, seatsRequested }) { await delay(); const user = currentDemoUser(); const trip = requireDemo(getDemoData().trips.find((item) => item.id === tripId), 'Trip not found.'); if (trip.driverId === user.id || trip.status !== 'active' || !Number.isInteger(seatsRequested) || seatsRequested < 1 || seatsRequested > trip.seatsAvailable) throw new Error('Select available seats on another driver’s active trip.'); if (getDemoData().bookings.some((item) => item.tripId === tripId && item.passengerId === user.id && !['cancelled', 'rejected'].includes(item.status))) throw new Error('You already requested this trip.'); const booking: Booking = { id: demoId('booking'), tripId, passengerId: user.id, status: 'pending', seatsRequested, totalPrice: seatsRequested * trip.pricePerSeat, createdAt: new Date().toISOString() }; getDemoData().bookings.unshift(booking); notifyDemoUser(trip.driverId, 'Booking request', `${user.fullName} requested ${seatsRequested} seat(s) to ${trip.arrivalCity}.`); saveDemoData(); return bookingFor(booking); },
  async getMyBookings() { await delay(); return getDemoData().bookings.filter((item) => item.passengerId === currentDemoUser().id).map(bookingFor); },
  async getBookingRequests() { await delay(); const id = currentDemoUser().id; return getDemoData().bookings.filter((item) => getDemoData().trips.some((trip) => trip.id === item.tripId && trip.driverId === id)).map(bookingFor); },
  async acceptBooking(id) { await delay(); const booking = ownRequest(id); const trip = ownTrip(booking.tripId); if (booking.status !== 'pending' || trip.status !== 'active' || trip.seatsAvailable < booking.seatsRequested) throw new Error('This request cannot be accepted.'); booking.status = 'accepted'; trip.seatsAvailable -= booking.seatsRequested; notifyDemoUser(booking.passengerId, 'Booking accepted', `Your seat to ${trip.arrivalCity} is confirmed. You can now pay in the demo.`); saveDemoData(); return bookingFor(booking); },
  async rejectBooking(id) { await delay(); const booking = ownRequest(id); if (booking.status !== 'pending') throw new Error('Only pending requests can be rejected.'); booking.status = 'rejected'; notifyDemoUser(booking.passengerId, 'Booking declined', 'The driver declined this request. Search for another ride.'); saveDemoData(); return bookingFor(booking); },
  async cancelBooking(id) { await delay(); const booking = requireDemo(getDemoData().bookings.find((item) => item.id === id && item.passengerId === currentDemoUser().id), 'Booking not found.'); if (!['pending', 'accepted', 'paid'].includes(booking.status)) throw new Error('This booking cannot be cancelled.'); const trip = requireDemo(getDemoData().trips.find((item) => item.id === booking.tripId), 'Trip not found.'); if (['accepted', 'paid'].includes(booking.status) && trip.status !== 'completed') trip.seatsAvailable += booking.seatsRequested; if (booking.status === 'paid') refundDemoBooking(booking); booking.status = 'cancelled'; saveDemoData(); return bookingFor(booking); },
  async markBoarded(id) { await delay(); const booking = ownRequest(id); if (!['accepted', 'paid'].includes(booking.status)) throw new Error('Booking is not confirmed.'); booking.status = 'boarded'; saveDemoData(); return bookingFor(booking); },
  async markNoShow(id) { await delay(); const booking = ownRequest(id); if (!['accepted', 'paid'].includes(booking.status)) throw new Error('Booking is not confirmed.'); booking.status = 'no_show'; saveDemoData(); return bookingFor(booking); },
};

export const demoReviewsService: ReviewsService = {
  async createReview(input) { await delay(); const user = currentDemoUser(); if (input.rating < 1 || input.rating > 5 || !input.comment.trim()) throw new Error('Choose a rating and enter a comment.'); if (!getDemoData().bookings.some((booking) => booking.tripId === input.tripId && booking.passengerId === user.id && booking.status === 'completed')) throw new Error('Complete a booked trip before reviewing.'); if (getDemoData().reviews.some((review) => review.tripId === input.tripId && review.authorId === user.id)) throw new Error('You already reviewed this trip.'); const review = { ...input, id: demoId('review'), authorId: user.id, createdAt: new Date().toISOString() }; const data = getDemoData(); data.reviews.push(review); const target = requireDemo(data.users.find((item) => item.id === input.targetUserId), 'Driver not found.'); const reviews = data.reviews.filter((item) => item.targetUserId === target.id); target.rating = Math.round(reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length * 10) / 10; saveDemoData(); return review; },
  async getReviewsForUser(id) { await delay(); return getDemoData().reviews.filter((item) => item.targetUserId === id); },
};
