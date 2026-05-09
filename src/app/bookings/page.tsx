'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import BookingCard from '@/components/bookings/BookingCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function BookingsPage() {
  const router = useRouter();
  const { bookings, trips, users, currentUser, cancelBooking, lastError, clearError } = useAppStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const myBookings = bookings.filter((b) => b.passengerId === currentUser?.id);
  const upcoming = myBookings.filter((b) => ['pending', 'accepted'].includes(b.status));
  const past = myBookings.filter((b) => ['completed', 'cancelled', 'rejected'].includes(b.status));
  const current = tab === 'upcoming' ? upcoming : past;

  return (
    <WebLayout title="Rezervlərim">
      <ProtectedRoute>
      {lastError && (
        <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
          <div className="flex items-center justify-between gap-3">
            <span>{lastError}</span>
            <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">Bağla</button>
          </div>
        </div>
      )}
      <div className="flex gap-1 bg-surface-muted rounded-xl p-1 mb-6 max-w-xs">
        {(['upcoming', 'past'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-all', tab === t ? 'bg-white text-brand-600 shadow-sm' : 'text-text-muted')}>
            {t === 'upcoming' ? 'Gələn' : 'Keçmiş'}
          </button>
        ))}
      </div>
      {current.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {current.map((b) => {
            const trip = trips.find((t) => t.id === b.tripId);
            const driver = trip ? users.find((u) => u.id === trip.driverId) : undefined;
            return (<BookingCard key={b.id} booking={b} trip={trip} driver={driver} onCancel={() => cancelBooking(b.id)} onReview={() => router.push(`${ROUTES.createReview}?tripId=${b.tripId}&targetUserId=${trip?.driverId}`)} />);
          })}
        </div>
      ) : (
        <EmptyState icon={<Icon name="calendar-check" size={28} />} title={tab === 'upcoming' ? 'Gələn rezerv yoxdur' : 'Keçmiş rezerv yoxdur'} description="Gediş axtarın və ilk rezervinizi edin" />
      )}
      </ProtectedRoute>
    </WebLayout>
  );
}
