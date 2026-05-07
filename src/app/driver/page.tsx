'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { Plus, Map, Inbox, Car } from 'lucide-react';

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
    <MobileShell title="Sürücü paneli">
      <div className="px-4 pt-2 pb-4 stagger-children">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-brand-600">{activeTrips.length}</p>
            <p className="text-[11px] text-text-muted">Aktiv gediş</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-accent-500">{pendingBookings.length}</p>
            <p className="text-[11px] text-text-muted">Gözləyən</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-text">{myTrips.length}</p>
            <p className="text-[11px] text-text-muted">Ümumi</p>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button fullWidth size="lg" onClick={() => router.push(ROUTES.createTrip)}>
            <Plus size={18} /> Yeni gediş yarat
          </Button>
          <Button fullWidth size="lg" variant="outline" onClick={() => router.push(ROUTES.myTrips)}>
            <Map size={18} /> Gedişlərim
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => router.push(ROUTES.bookingRequests)}>
            <Inbox size={18} /> Rezerv sorğuları
            {pendingBookings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-accent-500 text-white text-[10px] font-bold rounded-full">
                {pendingBookings.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
