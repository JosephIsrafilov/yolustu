'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
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
    <WebLayout title="Gedişlər" showBack>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted">{filteredTrips.length} gediş tapıldı</p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium hover:bg-surface-muted transition-colors"
        >
          <Filter size={16} className={showFilters ? 'text-brand-600' : 'text-text-muted'} />
          Filtrlər
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 animate-slide-up">
          <TripFilters filters={filters} onChange={setFilters} onSearch={() => setShowFilters(false)} />
        </div>
      )}

      {filteredTrips.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} driver={users.find((u) => u.id === trip.driverId)} />
          ))}
        </div>
      ) : (
        <EmptyState title="Gediş tapılmadı" description="Filtrləri dəyişdirin və ya başqa tarix seçin" />
      )}
    </WebLayout>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<WebLayout title="Gedişlər" showBack><LoadingState /></WebLayout>}>
      <TripsContent />
    </Suspense>
  );
}
