import { currentDemoUser, demoId, getDemoData, requireDemo, saveDemoData } from './data';

// A few original profile and vehicle screens still use apiClient directly.
export function demoDirectRequest(method: string, path: string, body?: unknown): unknown {
  const data = getDemoData();
  const vehicle = (item: typeof data.vehicles[number]) => ({ id: item.id, user_id: item.userId, brand: item.brand, model: item.model, year: item.year, color: item.color, plate_number: item.plateNumber, created_at: item.createdAt });
  if (path === '/vehicles/my' && method === 'GET') return data.vehicles.filter((item) => item.userId === currentDemoUser().id).map(vehicle);
  if (path === '/vehicles' && method === 'POST') { const input = body as { brand: string; model: string; year: number; color: string; plate_number: string }; if (!input.brand || !input.model || !input.plate_number) throw new Error('Enter vehicle details.'); const item = { id: demoId('vehicle'), userId: currentDemoUser().id, brand: input.brand, model: input.model, year: input.year, color: input.color, plateNumber: input.plate_number, createdAt: new Date().toISOString() }; data.vehicles.push(item); saveDemoData(); return vehicle(item); }
  if (path.startsWith('/vehicles/') && method === 'DELETE') { const id = path.split('/')[2]; const index = data.vehicles.findIndex((item) => item.id === id && item.userId === currentDemoUser().id); if (index < 0) throw new Error('Vehicle not found.'); data.vehicles.splice(index, 1); saveDemoData(); return null; }
  if (path.startsWith('/users/') && method === 'GET') { const user = requireDemo(data.users.find((item) => item.id === path.split('/')[2]), 'User not found.'); const names = user.fullName.split(' '); return { id: user.id, first_name: names[0], last_name: names.slice(1).join(' '), phone: user.phone, email: user.email, role: user.role, city: user.city, rating: user.rating, total_rides: user.totalTrips, bio: user.bio, created_at: user.createdAt, is_verified: user.verificationStatus === 'approved', verification_status: user.verificationStatus, is_email_verified: user.isEmailVerified }; }
  throw new Error(`This action is unavailable in the local demo: ${method} ${path}`);
}
