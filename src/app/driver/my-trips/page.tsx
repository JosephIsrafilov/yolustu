'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import TripCard from '@/components/trips/TripCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { Map, Plus } from 'lucide-react';

export default function MyTripsPage() {
  const router = useRouter();
  const { trips, users, currentUser, cancelTrip, completeTrip } = useAppStore();
  const myTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const active = myTrips.filter((t) => t.status === 'active');
  const past = myTrips.filter((t) => t.status !== 'active');

  return (
    <WebLayout title="Gedişlərim" showBack>
      <div className="stagger-children">
        <Button variant="secondary" className="mb-6" onClick={() => router.push(ROUTES.createTrip)}><Plus size={16} /> Yeni gediş yarat</Button>
        {active.length > 0 && (<><h3 className="text-lg font-semibold text-text mb-3">Aktiv gedişlər</h3><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">{active.map((t) => (<div key={t.id}><TripCard trip={t} driver={users.find((u) => u.id === t.driverId)} compact /><div className="flex gap-2 mt-2"><Button size="sm" variant="outline" fullWidth onClick={() => cancelTrip(t.id)}>Ləğv et</Button><Button size="sm" variant="secondary" fullWidth onClick={() => completeTrip(t.id)}>Tamamla</Button><Button size="sm" variant="primary" fullWidth onClick={() => router.push(ROUTES.bookingRequests)}>Sorğular</Button></div></div>))}</div></>)}
        {past.length > 0 && (<><h3 className="text-lg font-semibold text-text mb-3">Keçmiş gedişlər</h3><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{past.map((t) => <TripCard key={t.id} trip={t} compact />)}</div></>)}
        {myTrips.length === 0 && (<EmptyState icon={<Map size={28} />} title="Hələ gediş yaratmamısınız" action={<Button onClick={() => router.push(ROUTES.createTrip)}>Gediş yarat</Button>} />)}
      </div>
    </WebLayout>
  );
}
