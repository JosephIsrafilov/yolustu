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
  const { bookings, trips, users, currentUser, cancelBooking, fetchBookings, lastError, clearError } = useAppStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const myBookings = bookings.filter((booking) => booking.passengerId === currentUser?.id);
  const upcoming = myBookings.filter((booking) => ['pending', 'accepted'].includes(booking.status));
  const past = myBookings.filter((booking) => ['completed', 'cancelled', 'rejected'].includes(booking.status));
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
        <div className="mb-6 flex max-w-xs gap-1 rounded-xl bg-surface-muted p-1">
          {(['upcoming', 'past'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                tab === item ? 'bg-white text-brand-600 shadow-sm' : 'text-text-muted',
              )}
            >
              {item === 'upcoming' ? 'Gələn' : 'Keçmiş'}
            </button>
          ))}
        </div>
        {current.length > 0 ? (
          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.map((booking) => {
              const trip = booking.trip ?? trips.find((item) => item.id === booking.tripId);
              const driver = trip ? trip.driver ?? users.find((user) => user.id === trip.driverId) : undefined;
              return (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  trip={trip}
                  driver={driver}
                  onCancel={() => cancelBooking(booking.id)}
                  onReview={() => router.push(`${ROUTES.createReview}?tripId=${booking.tripId}&targetUserId=${trip?.driverId}`)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="calendar-check" size={28} />}
            title={tab === 'upcoming' ? 'Gələn rezerv yoxdur' : 'Keçmiş rezerv yoxdur'}
            description="Gediş axtarın və ilk rezervinizi edin"
          />
        )}
      </ProtectedRoute>
    </WebLayout>
  );
}
