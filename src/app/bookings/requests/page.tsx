'use client';

import React from 'react';
import WebLayout from '@/components/layout/WebLayout';
import BookingRequestCard from '@/components/bookings/BookingRequestCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function BookingRequestsPage() {
  const { bookings, trips, users, currentUser, acceptBooking, rejectBooking, lastError, clearError } = useAppStore();

  const driverTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const driverTripIds = new Set(driverTrips.map((t) => t.id));
  const requests = bookings.filter((b) => driverTripIds.has(b.tripId));
  const pending = requests.filter((b) => b.status === 'pending');
  const others = requests.filter((b) => b.status !== 'pending');

  return (
    <WebLayout title="Rezerv sorğuları" showBack>
      <ProtectedRoute mode="driver">
      {lastError && (
        <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
          <div className="flex items-center justify-between gap-3">
            <span>{lastError}</span>
            <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">Bağla</button>
          </div>
        </div>
      )}
      <div className="stagger-children">
        {pending.length > 0 && (<><h3 className="text-lg font-semibold text-text mb-3">Gözləyən sorğular ({pending.length})</h3><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">{pending.map((b) => { const trip = trips.find((t) => t.id === b.tripId); return (<BookingRequestCard key={b.id} booking={b} passenger={users.find((u) => u.id === b.passengerId)} trip={trip} onAccept={() => acceptBooking(b.id)} onReject={() => rejectBooking(b.id)} />); })}</div></>)}
        {others.length > 0 && (<><h3 className="text-lg font-semibold text-text mb-3">Keçmiş sorğular</h3><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{others.map((b) => { const trip = trips.find((t) => t.id === b.tripId); return (<BookingRequestCard key={b.id} booking={b} passenger={users.find((u) => u.id === b.passengerId)} trip={trip} onAccept={() => {}} onReject={() => {}} />); })}</div></>)}
        {requests.length === 0 && (<EmptyState icon={<Icon name="inbox" size={28} />} title="Sorğu yoxdur" description="Gedişlərinizə sorğu gəldikdə burada görünəcək" />)}
      </div>
      </ProtectedRoute>
    </WebLayout>
  );
}
