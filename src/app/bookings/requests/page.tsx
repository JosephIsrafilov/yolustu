'use client';

import React from 'react';
import MobileShell from '@/components/layout/MobileShell';
import BookingRequestCard from '@/components/bookings/BookingRequestCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { Inbox } from 'lucide-react';

export default function BookingRequestsPage() {
  const { bookings, trips, users, currentUser, acceptBooking, rejectBooking } = useAppStore();

  // Get trips by current driver and their booking requests
  const driverTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const driverTripIds = new Set(driverTrips.map((t) => t.id));
  const requests = bookings.filter((b) => driverTripIds.has(b.tripId));

  const pending = requests.filter((b) => b.status === 'pending');
  const others = requests.filter((b) => b.status !== 'pending');

  return (
    <MobileShell title="Rezerv sorğuları" showBack>
      <div className="px-4 pt-2 pb-4 stagger-children">
        {pending.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-text mb-2">Gözləyən sorğular ({pending.length})</h3>
            <div className="flex flex-col gap-3 mb-4">
              {pending.map((b) => {
                const trip = trips.find((t) => t.id === b.tripId);
                return (
                  <BookingRequestCard key={b.id} booking={b} passenger={users.find((u) => u.id === b.passengerId)} trip={trip}
                    onAccept={() => acceptBooking(b.id)} onReject={() => rejectBooking(b.id)} />
                );
              })}
            </div>
          </>
        )}
        {others.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-text mb-2">Keçmiş sorğular</h3>
            <div className="flex flex-col gap-3">
              {others.map((b) => {
                const trip = trips.find((t) => t.id === b.tripId);
                return (
                  <BookingRequestCard key={b.id} booking={b} passenger={users.find((u) => u.id === b.passengerId)} trip={trip}
                    onAccept={() => {}} onReject={() => {}} />
                );
              })}
            </div>
          </>
        )}
        {requests.length === 0 && (
          <EmptyState icon={<Inbox size={28} />} title="Sorğu yoxdur" description="Gedişlərinizə sorğu gəldikdə burada görünəcək" />
        )}
      </div>
    </MobileShell>
  );
}
