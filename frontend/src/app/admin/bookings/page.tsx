'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';
import { adminService } from '@/services';

const STATUSES: (BookingStatus | 'all')[] = ['all', 'pending', 'accepted', 'rejected', 'cancelled', 'completed'];

export default function AdminBookingsPage() {
  const { trips, users } = useAppStore();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  React.useEffect(() => {
    adminService.getBookings()
      .then(setBookings)
      .catch((error) => {
        console.error('Fetch admin bookings error:', error);
      });
  }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-2xl font-bold text-text">Rezervlər</h1>

      <div className="mb-4 flex flex-wrap gap-1">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === status ? 'bg-brand-600 text-white' : 'bg-surface-muted text-text-muted hover:bg-surface-dim',
            )}
          >
            {status === 'all' ? 'Hamısı' : status}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Sərnişin</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Marşrut</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Yerlər</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const trip = booking.trip ?? trips.find((item) => item.id === booking.tripId);
                const passenger = booking.passenger ?? users.find((user) => user.id === booking.passengerId);
                return (
                  <tr key={booking.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-dim">
                    <td className="px-4 py-3 font-medium">{passenger?.fullName || '—'}</td>
                    <td className="px-4 py-3">{trip ? `${trip.departureCity} → ${trip.arrivalCity}` : '—'}</td>
                    <td className="px-4 py-3">{booking.seatsRequested}</td>
                    <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                    <td className="px-4 py-3 text-text-muted">{new Date(booking.createdAt).toLocaleDateString('az-AZ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
