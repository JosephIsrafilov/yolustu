import type { MessagesService } from '@/services/contracts/messages-service';
import type { PaymentsService } from '@/services/contracts/payments-service';
import type { GamificationService } from '@/services/contracts/gamification-service';
import type { AdminService, Paginated } from '@/services/contracts/admin-service';
import type { Booking, Payment, WalletTransaction } from '@/types';
import { currentDemoUser, demoId, getDemoData, notifyDemoUser, requireDemo, saveDemoData } from './data';

const page = <T>(items: T[], number = 1, limit = 20): Paginated<T> => ({ items: items.slice((number - 1) * limit, number * limit), total: items.length, page: number, size: limit, pages: Math.ceil(items.length / limit) });
const timestamp = () => new Date().toISOString();
const transaction = (userId: string, amount: number, type: WalletTransaction['type'], direction: WalletTransaction['direction'], bookingId?: string) => {
  getDemoData().transactions.unshift({ id: demoId('txn'), userId, amount, type, direction, bookingId, currency: 'AZN', status: 'posted', description: `Simulated ${type.replaceAll('_', ' ')}`, createdAt: timestamp() });
};
const bookingById = (id: string) => requireDemo(getDemoData().bookings.find((item) => item.id === id), 'Booking not found.');
const paymentById = (id: string) => requireDemo(getDemoData().payments.find((item) => item.id === id), 'Payment not found.');
export function refundDemoBooking(booking: Booking): void {
  const payment = getDemoData().payments.find((item) => item.bookingId === booking.id && item.status === 'succeeded');
  if (!payment) return;
  payment.status = 'refunded'; payment.refundedAt = timestamp();
  if (payment.provider === 'demo-wallet') getDemoData().balances[booking.passengerId] = (getDemoData().balances[booking.passengerId] ?? 0) + payment.amount;
  if (payment.driverId) getDemoData().balances[payment.driverId] = Math.max(0, (getDemoData().balances[payment.driverId] ?? 0) - payment.driverAmount);
  transaction(booking.passengerId, payment.amount, 'refund', 'credit', booking.id);
  if (payment.driverId) transaction(payment.driverId, payment.driverAmount, 'driver_available_earning', 'debit', booking.id);
}

export const demoPaymentsService: PaymentsService = {
  async createPaymentSession(bookingId) { const booking = bookingById(bookingId); if (booking.passengerId !== currentDemoUser().id || booking.status !== 'accepted') throw new Error('Only accepted bookings can be paid.'); const payment: Payment = { id: demoId('payment'), bookingId, passengerId: booking.passengerId, driverId: getDemoData().trips.find((trip) => trip.id === booking.tripId)?.driverId, amount: booking.totalPrice ?? 0, serviceFee: 0, driverAmount: booking.totalPrice ?? 0, currency: 'AZN', provider: 'mock', status: 'pending', createdAt: timestamp() }; getDemoData().payments.push(payment); saveDemoData(); return { paymentId: payment.id, bookingId, amount: payment.amount, serviceFee: 0, driverAmount: payment.driverAmount, currency: 'AZN', provider: 'mock', status: payment.status, checkoutUrl: '', transactionId: payment.id }; },
  async getPayment(id) { return paymentById(id); },
  async mockSucceed(id) { const payment = paymentById(id); if (payment.status !== 'pending') throw new Error('Payment already processed.'); const booking = bookingById(payment.bookingId); payment.status = 'succeeded'; payment.paidAt = timestamp(); booking.status = 'paid'; transaction(booking.passengerId, payment.amount, 'passenger_payment', 'debit', booking.id); if (payment.driverId) { getDemoData().balances[payment.driverId] = (getDemoData().balances[payment.driverId] ?? 0) + payment.driverAmount; transaction(payment.driverId, payment.driverAmount, 'driver_available_earning', 'credit', booking.id); } saveDemoData(); },
  async mockFail(id) { paymentById(id).status = 'failed'; saveDemoData(); },
  async refund(id) { const payment = paymentById(id); if (payment.status !== 'succeeded') throw new Error('Only paid bookings can be refunded.'); refundDemoBooking(bookingById(payment.bookingId)); saveDemoData(); },
  async simulateWebhook(payload) { if (payload.status === 'success' || payload.status === 'succeeded') await demoPaymentsService.mockSucceed(payload.transaction_id); else if (payload.status === 'refunded') await demoPaymentsService.refund(payload.transaction_id); else await demoPaymentsService.mockFail(payload.transaction_id); },
  async getWallet() { const user = currentDemoUser(); const tx = getDemoData().transactions.filter((item) => item.userId === user.id); return { userId: user.id, availableBalance: getDemoData().balances[user.id] ?? 0, pendingBalance: 0, currency: 'AZN', totalEarned: tx.filter((item) => item.type === 'driver_available_earning').reduce((sum, item) => sum + item.amount, 0), totalSpent: tx.filter((item) => item.type === 'passenger_payment').reduce((sum, item) => sum + item.amount, 0), totalRefunded: tx.filter((item) => item.type === 'refund').reduce((sum, item) => sum + item.amount, 0) }; },
  async getWalletTransactions(number, limit, filter) { let items = getDemoData().transactions.filter((item) => item.userId === currentDemoUser().id); if (filter === 'payments') items = items.filter((item) => item.type === 'passenger_payment'); if (filter === 'refunds') items = items.filter((item) => item.type === 'refund'); if (filter === 'income') items = items.filter((item) => item.type === 'driver_available_earning'); if (filter === 'topups') items = items.filter((item) => item.type === 'adjustment'); return page(items, number, limit); },
  async topupWallet(amount) { if (!Number.isFinite(amount) || amount <= 0 || amount > 500) throw new Error('Choose a demo top-up from 1 to 500 AZN.'); const user = currentDemoUser(); getDemoData().balances[user.id] = (getDemoData().balances[user.id] ?? 0) + amount; transaction(user.id, amount, 'adjustment', 'credit'); saveDemoData(); return { detail: 'Simulated top-up complete', new_balance: getDemoData().balances[user.id] }; },
  async payFromWallet(bookingId) { const booking = bookingById(bookingId); const user = currentDemoUser(); const amount = booking.totalPrice ?? 0; if (booking.passengerId !== user.id || booking.status !== 'accepted') throw new Error('Booking is not ready for payment.'); if ((getDemoData().balances[user.id] ?? 0) < amount) throw new Error('Demo wallet balance is too low.'); const session = await demoPaymentsService.createPaymentSession(bookingId); paymentById(session.paymentId).provider = 'demo-wallet'; getDemoData().balances[user.id] -= amount; await demoPaymentsService.mockSucceed(session.paymentId); return { detail: 'Simulated wallet payment complete' }; },
  async requestPayout(amount) { const user = currentDemoUser(); if (amount <= 0 || amount > (getDemoData().balances[user.id] ?? 0)) throw new Error('Invalid demo payout amount.'); getDemoData().balances[user.id] -= amount; transaction(user.id, amount, 'payout', 'debit'); saveDemoData(); return { id: demoId('payout'), userId: user.id, amount, currency: 'AZN', status: 'completed', method: 'demo', createdAt: timestamp(), processedAt: timestamp() }; },
  async getPayouts(number, limit) { return page([], number, limit); },
  async listAdminPayments(params) { return page(getDemoData().payments, params?.page, params?.limit); },
};

export const demoMessagesService: MessagesService = {
  async getRideMessages(rideId) { return getDemoData().messages.filter((item) => item.ride_id === rideId); },
  async sendMessage(input) { const user = currentDemoUser(); if (!input.content.trim()) throw new Error('Enter a message.'); const message = { id: demoId('message'), ride_id: input.ride_id, conversation_id: input.conversation_id, content: input.content.trim(), sender_id: user.id, sender_name: user.fullName, created_at: timestamp() }; getDemoData().messages.push(message); const chat = getDemoData().conversations.find((item) => item.id === input.conversation_id); for (const participant of chat?.participants ?? []) if (participant.user_id !== user.id) notifyDemoUser(participant.user_id, 'New demo message', `${user.fullName}: ${message.content.slice(0, 80)}`); saveDemoData(); return message; },
  async getChats() { const id = currentDemoUser().id; return getDemoData().conversations.filter((item) => item.participants.some((participant) => participant.user_id === id)); },
  async getChat(id) { return requireDemo(getDemoData().conversations.find((item) => item.id === id), 'Conversation not found.'); },
  async getChatMessages(id) { return getDemoData().messages.filter((item) => item.conversation_id === id); },
  async createSupportChat() { const user = currentDemoUser(); const data = getDemoData(); const existing = data.conversations.find((item) => item.type === 'support' && item.participants.some((participant) => participant.user_id === user.id)); if (existing) return existing; const chat = { id: demoId('chat'), type: 'support' as const, status: 'open', created_at: timestamp(), updated_at: timestamp(), participants: [{ user_id: user.id, role: 'user' }, { user_id: 'admin', role: 'support' }] }; data.conversations.push(chat); saveDemoData(); return chat; },
  async createRideChat(bookingId) { const booking = bookingById(bookingId); const trip = requireDemo(getDemoData().trips.find((item) => item.id === booking.tripId), 'Trip not found.'); if (![booking.passengerId, trip.driverId].includes(currentDemoUser().id)) throw new Error('You are not in this trip.'); const data = getDemoData(); const existing = data.conversations.find((item) => item.booking_id === bookingId); if (existing) return existing; const chat = { id: demoId('chat'), type: 'ride' as const, ride_id: trip.id, booking_id: booking.id, status: 'open', created_at: timestamp(), updated_at: timestamp(), participants: [{ user_id: booking.passengerId, role: 'passenger' }, { user_id: trip.driverId, role: 'driver' }] }; data.conversations.push(chat); saveDemoData(); return chat; },
  async sendChatMessage(id, content) { await demoMessagesService.getChat(id); return demoMessagesService.sendMessage({ conversation_id: id, content }); },
  async markChatRead(id) { for (const message of getDemoData().messages.filter((item) => item.conversation_id === id && item.sender_id !== currentDemoUser().id)) message.read_at = timestamp(); saveDemoData(); return { ok: true }; },
};

export const demoGamificationService: GamificationService = { async getBadges() { return []; }, async getMyBadges() { return []; } };
export const demoAdminService: AdminService = {
  async getAdminStats() { const data = getDemoData(); return { totalUsers: data.users.length, blockedUsers: data.users.filter((u) => u.isBlocked).length, drivers: data.users.filter((u) => u.role === 'driver').length, passengers: data.users.filter((u) => u.role === 'passenger').length, totalTrips: data.trips.length, activeTrips: data.trips.filter((t) => t.status === 'active').length, completedTrips: data.trips.filter((t) => t.status === 'completed').length, cancelledTrips: data.trips.filter((t) => t.status === 'cancelled').length, totalBookings: data.bookings.length, pendingBookings: data.bookings.filter((b) => b.status === 'pending').length, acceptedBookings: data.bookings.filter((b) => b.status === 'accepted').length, cancelledBookings: data.bookings.filter((b) => b.status === 'cancelled').length, completedBookings: data.bookings.filter((b) => b.status === 'completed').length, pendingVerifications: 0, revenueTotal: 0 }; },
  async getUsers(options) { let items = getDemoData().users; if (options?.role) items = items.filter((item) => item.role === options.role); if (options?.q) items = items.filter((item) => item.fullName.toLowerCase().includes(options.q!.toLowerCase())); return page(items, options?.page, options?.limit); },
  async createUser() { throw new Error('Admin account creation is unavailable in this portfolio demo.'); },
  async updateUserRole(id, role) { const user = requireDemo(getDemoData().users.find((item) => item.id === id), 'User not found.'); user.role = role; saveDemoData(); return user; },
  async blockUser(id) { const user = requireDemo(getDemoData().users.find((item) => item.id === id), 'User not found.'); user.isBlocked = true; saveDemoData(); return user; },
  async unblockUser(id) { const user = requireDemo(getDemoData().users.find((item) => item.id === id), 'User not found.'); user.isBlocked = false; saveDemoData(); return user; },
  async getTrips(number, limit) { return page(getDemoData().trips, number, limit); },
  async deleteTrip(id) { const trip = requireDemo(getDemoData().trips.find((item) => item.id === id), 'Trip not found.'); trip.status = 'cancelled'; saveDemoData(); },
  async getBookings(number, limit) { return page(getDemoData().bookings as Booking[], number, limit); },
  async getPendingVerifications(number, limit) { return page(getDemoData().users.filter((item) => item.verificationStatus === 'pending'), number, limit); },
  async approveVerification(id) { const user = requireDemo(getDemoData().users.find((item) => item.id === id), 'User not found.'); user.verificationStatus = 'approved'; saveDemoData(); return user; },
  async rejectVerification(id) { const user = requireDemo(getDemoData().users.find((item) => item.id === id), 'User not found.'); user.verificationStatus = 'rejected'; saveDemoData(); return user; },
  async simulateJourney() { const trip = requireDemo(getDemoData().trips.find((item) => item.status === 'active'), 'No active trip.'); return { message: 'Simulated journey ready', ride_id: trip.id }; },
  async openVerificationDocument() { throw new Error('No private identity documents are included in the demo.'); },
};
