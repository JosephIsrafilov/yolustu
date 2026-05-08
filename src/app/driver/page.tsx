'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';

export default function DriverDashboardPage() {
  const router = useRouter();
  const { trips, bookings, currentUser } = useAppStore();
  const myTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const activeTrips = myTrips.filter((t) => t.status === 'active');
  const pendingBookings = bookings.filter((b) => {
    const trip = myTrips.find((t) => t.id === b.tripId);
    return trip && b.status === 'pending';
  });

  return (
    <WebLayout title="Sürücü paneli">
      <div className="stagger-children">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card padding="lg" className="text-center"><p className="text-3xl font-bold text-brand-600">{activeTrips.length}</p><p className="text-sm text-text-muted mt-1">Aktiv gediş</p></Card>
          <Card padding="lg" className="text-center"><p className="text-3xl font-bold text-accent-500">{pendingBookings.length}</p><p className="text-sm text-text-muted mt-1">Gözləyən sorğu</p></Card>
          <Card padding="lg" className="text-center"><p className="text-3xl font-bold text-text">{myTrips.length}</p><p className="text-sm text-text-muted mt-1">Ümumi gediş</p></Card>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Button fullWidth size="lg" onClick={() => router.push(ROUTES.createTrip)}><Icon name="plus" size={18} /> Yeni gediş yarat</Button>
          <Button fullWidth size="lg" variant="outline" onClick={() => router.push(ROUTES.myTrips)}><Icon name="map" size={18} /> Gedişlərim</Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => router.push(ROUTES.bookingRequests)}>
            <Icon name="inbox" size={18} /> Rezerv sorğuları
            {pendingBookings.length > 0 && (<span className="ml-1 px-1.5 py-0.5 bg-accent-500 text-white text-[10px] font-bold rounded-full">{pendingBookings.length}</span>)}
          </Button>
        </div>
      </div>
    </WebLayout>
  );
}
