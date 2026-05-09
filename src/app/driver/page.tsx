'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DriverDashboardPage() {
  const router = useRouter();
  const { trips, bookings, currentUser } = useAppStore();
  const myTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const activeTrips = myTrips.filter((t) => t.status === 'active');
  const pendingBookings = bookings.filter((b) => {
    const trip = myTrips.find((t) => t.id === b.tripId);
    return trip && b.status === 'pending';
  });
  const nextTrip = activeTrips
    .slice()
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const nextRequest = pendingBookings[0];
  const nextRequestTrip = nextRequest ? myTrips.find((t) => t.id === nextRequest.tripId) : undefined;

  return (
    <WebLayout title="Sürücü paneli">
      <ProtectedRoute mode="driver">
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
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Növbəti addım</p>
                {pendingBookings.length > 0 ? (
                  <p className="mt-1 text-sm text-text-secondary">
                    {pendingBookings.length} rezerv sorğusu gözləyir{nextRequestTrip ? `: ${nextRequestTrip.departureCity} → ${nextRequestTrip.arrivalCity}` : '.'}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-text-secondary">Hazırda gözləyən sorğu yoxdur.</p>
                )}
              </div>
              <Button size="sm" variant={pendingBookings.length > 0 ? 'primary' : 'outline'} onClick={() => router.push(ROUTES.bookingRequests)}>Bax</Button>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Yaxın aktiv gediş</p>
                {nextTrip ? (
                  <p className="mt-1 text-sm text-text-secondary">{nextTrip.departureCity} → {nextTrip.arrivalCity} · {nextTrip.date} · {nextTrip.time}</p>
                ) : (
                  <p className="mt-1 text-sm text-text-secondary">Aktiv gediş yoxdur. Yeni marşrut paylaşa bilərsiniz.</p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push(nextTrip ? ROUTES.myTrips : ROUTES.createTrip)}>
                {nextTrip ? 'Gedişlər' : 'Yarat'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      </ProtectedRoute>
    </WebLayout>
  );
}
