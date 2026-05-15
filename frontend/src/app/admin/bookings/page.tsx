'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const STATUSES: (BookingStatus | 'all')[] = ['all', 'pending', 'accepted', 'rejected', 'cancelled', 'completed'];

export default function AdminBookingsPage() {
  const { bookings, trips, users } = useAppStore();
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-text mb-4">Rezervlər</h1>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap mb-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === s ? 'bg-brand-600 text-white' : 'bg-surface-muted text-text-muted hover:bg-surface-dim')}>
            {s === 'all' ? 'Hamısı' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Sərnişin</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Marşrut</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Yerlər</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const trip = trips.find((t) => t.id === b.tripId);
                const passenger = users.find((u) => u.id === b.passengerId);
                return (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-surface-dim transition-colors">
                    <td className="px-4 py-3 font-medium">{passenger?.fullName || '—'}</td>
                    <td className="px-4 py-3">{trip ? `${trip.departureCity} → ${trip.arrivalCity}` : '—'}</td>
                    <td className="px-4 py-3">{b.seatsRequested}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-text-muted">{new Date(b.createdAt).toLocaleDateString('az-AZ')}</td>
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
