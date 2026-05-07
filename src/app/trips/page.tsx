'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import TripCard from '@/components/trips/TripCard';
import TripFilters from '@/components/trips/TripFilters';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { filterTrips } from '@/lib/mock-api';
import { Filter } from 'lucide-react';
import type { TripSearchFilters } from '@/types';

function TripsContent() {
  const searchParams = useSearchParams();
  const { trips, users } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<TripSearchFilters>({
    departureCity: searchParams.get('from') || undefined,
    arrivalCity: searchParams.get('to') || undefined,
    date: searchParams.get('date') || undefined,
  });

  const filteredTrips = useMemo(() => filterTrips(trips, filters), [trips, filters]);

  return (
    <MobileShell
      title="Gedişlər"
      showBack
      rightAction={
        <button onClick={() => setShowFilters(!showFilters)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-muted transition-colors">
          <Filter size={18} className={showFilters ? 'text-brand-600' : 'text-text-muted'} />
        </button>
      }
    >
      <div className="px-4 pt-2 pb-4">
        {showFilters && (
          <div className="mb-4 animate-slide-up">
            <TripFilters filters={filters} onChange={setFilters} onSearch={() => setShowFilters(false)} />
          </div>
        )}

        {filteredTrips.length > 0 ? (
          <div className="flex flex-col gap-3 stagger-children">
            <p className="text-xs text-text-muted">{filteredTrips.length} gediş tapıldı</p>
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} driver={users.find((u) => u.id === trip.driverId)} />
            ))}
          </div>
        ) : (
          <EmptyState title="Gediş tapılmadı" description="Filtrləri dəyişdirin və ya başqa tarix seçin" />
        )}
      </div>
    </MobileShell>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<MobileShell title="Gedişlər" showBack><LoadingState /></MobileShell>}>
      <TripsContent />
    </Suspense>
  );
}
