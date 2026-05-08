'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import TripCard from '@/components/trips/TripCard';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { filterTrips } from '@/lib/mock-api';
import { AZ_CITIES } from '@/lib/utils';
import type { TripSearchFilters } from '@/types';

function TripsContent() {
  const searchParams = useSearchParams();
  const { trips, users } = useAppStore();

  const [filters, setFilters] = useState<TripSearchFilters>({
    departureCity: searchParams.get('from') || undefined,
    arrivalCity: searchParams.get('to') || undefined,
    date: searchParams.get('date') || undefined,
  });

  const [showFilters, setShowFilters] = useState(true);
  const filteredTrips = useMemo(() => filterTrips(trips, filters), [trips, filters]);
  const from = filters.departureCity || 'Bütün';
  const to = filters.arrivalCity || 'Bütün';

  return (
    <WebLayout>
      <main className="flex flex-col md:flex-row gap-6">
        {/* ── Sidebar Filters ──────────────── */}
        <aside className="w-full md:w-1/4 shrink-0">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sticky top-[100px]">
            <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
              <h2 className="text-lg font-semibold text-primary">Filtrlər</h2>
              <button
                onClick={() => setFilters({})}
                className="text-secondary text-xs font-bold hover:underline"
              >
                Sıfırla
              </button>
            </div>

            {/* Departure city */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-on-surface-variant mb-2">Haradan</h3>
              <select
                value={filters.departureCity || ''}
                onChange={(e) => setFilters((p) => ({ ...p, departureCity: e.target.value || undefined }))}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              >
                <option value="">Bütün şəhərlər</option>
                {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Arrival city */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-on-surface-variant mb-2">Haraya</h3>
              <select
                value={filters.arrivalCity || ''}
                onChange={(e) => setFilters((p) => ({ ...p, arrivalCity: e.target.value || undefined }))}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              >
                <option value="">Bütün şəhərlər</option>
                {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Date */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-on-surface-variant mb-2">Tarix</h3>
              <input
                type="date"
                value={filters.date || ''}
                onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value || undefined }))}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
            </div>

            {/* Departure time */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-on-surface-variant mb-2">Gediş vaxtı</h3>
              <div className="space-y-1">
                {['Səhər (06:00 - 12:00)', 'Günorta (12:00 - 18:00)', 'Axşam (18:00 - 00:00)'].map((label) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary-container focus:ring-primary-container border-outline-variant" />
                    <span className="text-sm text-on-surface">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-base font-bold text-on-surface-variant mb-2">Xüsusiyyətlər</h3>
              <div className="space-y-1">
                {[
                  { icon: 'smoke_free', label: 'Siqaret çəkilmir' },
                  { icon: 'female', label: 'Yalnız qadınlar' },
                  { icon: 'pets', label: 'Ev heyvanlarına icazə' },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary-container focus:ring-primary-container border-outline-variant" />
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{item.icon}</span>
                    <span className="text-sm text-on-surface">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Results ──────────────────────── */}
        <section className="w-full md:w-3/4 flex flex-col gap-4">
          {/* Search summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <div>
              <div className="flex items-center gap-2 text-2xl font-semibold text-primary mb-1">
                <span>{from}</span>
                <span className="material-symbols-outlined text-outline">arrow_right_alt</span>
                <span>{to}</span>
              </div>
              <div className="text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{filters.date || 'Bütün tarixlər'}</span>
              </div>
            </div>
            <span className="mt-2 sm:mt-0 text-sm text-on-surface-variant">
              {filteredTrips.length} nəticə tapıldı
            </span>
          </div>

          {/* Trip cards */}
          {filteredTrips.length > 0 ? (
            <div className="flex flex-col gap-4 stagger-children">
              {filteredTrips.map((trip) => {
                const driver = users.find((u) => u.id === trip.driverId);
                return (
                  <article
                    key={trip.id}
                    className={`bg-surface-container-lowest rounded-xl border border-outline-variant p-4 hover:shadow-card-hover transition-shadow cursor-pointer ${
                      trip.seatsAvailable === 0 ? 'opacity-75 grayscale cursor-not-allowed' : ''
                    }`}
                    onClick={() => trip.seatsAvailable > 0 && (window.location.href = `/trips/${trip.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      {/* Driver info */}
                      <div className="flex items-center gap-2 sm:w-1/4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-lg">
                            {driver?.fullName.charAt(0) || '?'}
                          </div>
                          {driver && driver.rating >= 4.5 && (
                            <span className="absolute bottom-0 right-0 bg-action rounded-full w-4 h-4 flex items-center justify-center border-2 border-surface-container-lowest" title="Təsdiqlənmiş">
                              <span className="material-symbols-outlined text-white text-[10px]">check</span>
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-primary">{driver?.fullName.split(' ')[0] || 'Naməlum'}</h4>
                          <div className="flex items-center text-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-[#F5A623] text-[16px]">star</span>
                            <span className="ml-1 font-bold">{driver?.rating.toFixed(1) || '—'}</span>
                            <span className="ml-1">({driver?.totalTrips || 0})</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-grow flex items-center justify-center sm:w-1/2 relative">
                        <div className="flex flex-col items-end text-right pr-2">
                          <span className="text-lg font-semibold text-primary">{trip.time}</span>
                          <span className="text-sm text-on-surface-variant">{trip.departureCity}</span>
                        </div>
                        <div className="flex flex-col items-center px-2 relative z-10 w-24">
                          <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                          <div className="h-8 w-0.5 bg-outline-variant my-1 border-l border-dashed border-outline-variant relative">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest text-xs text-outline px-1 whitespace-nowrap">
                              {trip.carModel}
                            </span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                        </div>
                        <div className="flex flex-col items-start text-left pl-2">
                          <span className="text-lg font-semibold text-primary">—</span>
                          <span className="text-sm text-on-surface-variant">{trip.arrivalCity}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col sm:items-end justify-between sm:w-1/4 mt-2 sm:mt-0">
                        <div className="text-xl font-bold text-primary">{trip.pricePerSeat} ₼</div>
                        <div className={`flex items-center gap-1 mt-1 ${trip.seatsAvailable > 0 ? 'text-secondary' : 'text-error'}`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {trip.seatsAvailable > 0 ? 'airline_seat_recline_normal' : 'block'}
                          </span>
                          <span className="text-xs font-bold">
                            {trip.seatsAvailable > 0 ? `${trip.seatsAvailable} yer qalıb` : 'Yer yoxdur'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Gediş tapılmadı" description="Filtrləri dəyişdirin və ya başqa tarix seçin" />
          )}
        </section>
      </main>
    </WebLayout>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<WebLayout title="Gedişlər"><LoadingState /></WebLayout>}>
      <TripsContent />
    </Suspense>
  );
}
