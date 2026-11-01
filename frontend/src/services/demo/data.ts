import type { Booking, Conversation, Message, Payment, Review, Trip, User, Vehicle, WalletTransaction } from '@/types';
import { getCityCoordinates } from '@/lib/utils';

export interface DemoData {
  notifications: { id: string; userId: string; title: string; body: string; read: boolean; createdAt: string }[];
  users: User[];
  vehicles: Vehicle[];
  trips: Trip[];
  bookings: Booking[];
  reviews: Review[];
  conversations: Conversation[];
  messages: Message[];
  payments: Payment[];
  transactions: WalletTransaction[];
  balances: Record<string, number>;
  currentUserId: string | null;
  passwords: Record<string, string>;
}

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};
const now = () => new Date().toISOString();
const user = (id: string, fullName: string, role: User['role'], city: string, rating: number): User => ({
  id, fullName, role, city, rating, email: `${id}@example.com`, phone: `+99450${id === 'passenger' ? '0000001' : id === 'driver' ? '0000002' : '0000003'}`,
  totalTrips: role === 'driver' ? 24 : 6, isBlocked: false, verificationStatus: 'approved', isEmailVerified: true,
  createdAt: '2025-03-01T10:00:00.000Z', bio: role === 'driver' ? 'I enjoy comfortable intercity journeys across Azerbaijan.' : 'Exploring Azerbaijan one city at a time.',
});
const makeTrip = (id: string, driverId: string, departureCity: string, arrivalCity: string, date: string, pricePerSeat: number, seatsAvailable: number, status: Trip['status'] = 'active'): Trip => ({
  id, driverId, departureCity, arrivalCity, date, pricePerSeat, seatsAvailable, seatsTotal: 4, status, time: '09:30',
  meetingPoint: `${departureCity} city centre`, dropoffPoint: `${arrivalCity} city centre`, carModel: 'Toyota Prius',
  comment: 'Comfortable ride with one short break.', createdAt: now(), shareToken: `demo-${id}`,
  origin: getCityCoordinates(departureCity), destination: getCityCoordinates(arrivalCity),
  smokingAllowed: false, petsAllowed: true, musicAllowed: true, femaleOnly: false,
});

export function seedDemoData(): DemoData {
  const users = [user('passenger', 'Aylin Məmmədova', 'passenger', 'Baku', 4.9), user('driver', 'Murad Əliyev', 'driver', 'Baku', 4.8), user('driver2', 'Leyla Həsənova', 'driver', 'Ganja', 4.9), user('admin', 'Demo Moderator', 'admin', 'Baku', 5)];
  const vehicles: Vehicle[] = [
    { id: 'vehicle-1', userId: 'driver', brand: 'Toyota', model: 'Prius', year: 2021, color: 'White', plateNumber: '10-DE-321', createdAt: now() },
    { id: 'vehicle-2', userId: 'driver2', brand: 'Hyundai', model: 'Elantra', year: 2022, color: 'Silver', plateNumber: '20-DE-456', createdAt: now() },
  ];
  const trips = [
    makeTrip('ride-baku-ganja', 'driver', 'Baku', 'Ganja', day(2), 18, 3),
    makeTrip('ride-baku-quba', 'driver', 'Baku', 'Quba', day(3), 12, 4),
    makeTrip('ride-ganja-baku', 'driver2', 'Ganja', 'Baku', day(4), 18, 2),
    makeTrip('ride-baku-sheki', 'driver2', 'Baku', 'Sheki', day(5), 16, 4),
    makeTrip('ride-past', 'driver', 'Baku', 'Ganja', day(-3), 18, 3, 'completed'),
  ];
  const bookings: Booking[] = [
    { id: 'booking-request', tripId: 'ride-baku-ganja', passengerId: 'passenger', status: 'pending', seatsRequested: 1, totalPrice: 18, createdAt: now() },
    { id: 'booking-past', tripId: 'ride-past', passengerId: 'passenger', status: 'completed', seatsRequested: 1, totalPrice: 18, createdAt: now() },
  ];
  return { users, vehicles, trips, bookings, reviews: [], conversations: [], messages: [], payments: [], transactions: [], notifications: [{ id: 'notice-request', userId: 'driver', title: 'Booking request', body: 'Aylin requested a seat to Ganja.', read: false, createdAt: now() }], balances: { passenger: 60, driver: 42, driver2: 24, admin: 0 }, currentUserId: null, passwords: { passenger: 'demo123', driver: 'demo123', driver2: 'demo123', admin: 'demo123' } };
}

const key = 'yolmates-portfolio-demo-v1';
let data: DemoData | null = null;
export function getDemoData(): DemoData {
  if (data) return data;
  if (typeof window === 'undefined') return seedDemoData();
  try { data = JSON.parse(localStorage.getItem(key) || 'null') as DemoData | null; } catch { data = null; }
  data ??= seedDemoData();
  data.notifications ??= [];
  return data;
}
export function notifyDemoUser(userId: string, title: string, body: string): void {
  getDemoData().notifications.unshift({ id: demoId('notice'), userId, title, body, read: false, createdAt: new Date().toISOString() });
}
export function saveDemoData(): void {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(getDemoData()));
  window.dispatchEvent(new Event('yolmates-demo-change'));
}
export function resetDemoData(): void {
  data = seedDemoData();
  localStorage.removeItem('yolmates-demo-ui');
  saveDemoData();
  window.location.assign('/');
}
export function switchDemoAccount(id: 'passenger' | 'driver'): void {
  const state = getDemoData();
  state.currentUserId = id;
  saveDemoData();
  window.location.assign(id === 'driver' ? '/driver/' : '/trips/');
}
export function currentDemoUser(): User {
  const state = getDemoData();
  const found = state.users.find((entry) => entry.id === state.currentUserId);
  if (!found) throw new Error('Choose a demo account to continue.');
  return found;
}
export function requireDemo<T>(value: T | undefined | null, message: string): T {
  if (value == null) throw new Error(message);
  return value;
}
export function demoId(prefix: string): string { return `${prefix}-${crypto.randomUUID()}`; }
