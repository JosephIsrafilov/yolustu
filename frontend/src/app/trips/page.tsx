'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { AZ_CITIES } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import type { TripSearchFilters } from '@/types';
import { MapContainer, RideMarkers } from '@/components/ui/Map';
import { I18N } from '@/lib/i18n';

function TripsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trips, users, fetchTrips, isLoadingTrips, lastError, clearError, language } = useAppStore();
  const copy = I18N[language];
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [filters, setFilters] = useState<TripSearchFilters>({
    departureCity: searchParams.get('from') || undefined,
    arrivalCity: searchParams.get('to') || undefined,
    date: searchParams.get('date') || undefined,
    minSeats: searchParams.get('passengers') ? Number(searchParams.get('passengers')) : undefined,
  });

  React.useEffect(() => {
    fetchTrips(filters);
  }, [fetchTrips, filters]);

  const filteredTrips = React.useMemo(() => {
    return trips.filter((t) => {
      if (filters.femaleOnly && !t.femaleOnly) return false;
      if (filters.smokingAllowed && !t.smokingAllowed) return false;
      if (filters.petsAllowed && !t.petsAllowed) return false;
      if (filters.musicAllowed && !t.musicAllowed) return false;
      return true;
    });
  }, [trips, filters.femaleOnly, filters.smokingAllowed, filters.petsAllowed, filters.musicAllowed]);

  const from = filters.departureCity || copy.common.all;
  const to = filters.arrivalCity || copy.common.all;
  const updateMinSeats = (nextSeats: number) => {
    setFilters((p) => ({ ...p, minSeats: nextSeats > 1 ? nextSeats : undefined }));
  };
  const activeFilters = [
    filters.departureCity && `${copy.tripsPage.filterFrom}: ${filters.departureCity}`,
    filters.arrivalCity && `${copy.tripsPage.filterTo}: ${filters.arrivalCity}`,
    filters.date && `${copy.tripsPage.filterDate}: ${filters.date}`,
    filters.minSeats && `${copy.common.passenger}: ${filters.minSeats}+`,
    filters.femaleOnly && copy.createTrip.femaleOnlyLabel,
    filters.smokingAllowed && copy.createTrip.smokingAllowedLabel,
    filters.petsAllowed && copy.createTrip.petsAllowedLabel,
    filters.musicAllowed && copy.createTrip.musicAllowedLabel,
  ].filter(Boolean);

  return (
    <WebLayout>
      <div className="flex flex-col md:flex-row gap-6">
        {}
        <aside className="order-2 w-full md:order-1 md:w-[280px] shrink-0">
          <div className="bg-white rounded-2xl border border-[#c0c8ca] p-5 sticky top-[80px]" style={{ boxShadow: '0 4px 12px rgba(5,71,82,0.05)' }}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#c0c8ca]">
              <h2 className="text-[18px] font-semibold text-[#002f37]">{copy.tripsPage.filters}</h2>
              <button onClick={() => setFilters({})} className="text-[#054752] text-[12px] font-bold hover:underline">{copy.tripsPage.reset}</button>
            </div>

            {}
            <div className="mb-5">
              <h3 className="text-[14px] font-bold text-[#40484a] mb-2">{copy.common.from}</h3>
              <div className="relative">
                <Icon name="map-pin" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b] pointer-events-none" />
                <select value={filters.departureCity || ''} onChange={(e) => setFilters((p) => ({ ...p, departureCity: e.target.value || undefined }))}
                  className="w-full rounded-xl border border-[#c0c8ca] bg-white pl-9 pr-3 py-2.5 text-[14px] text-[#011f23] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 outline-none transition-all appearance-none">
                  <option value="">{copy.common.allCities}</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-[14px] font-bold text-[#40484a] mb-2">{copy.common.to}</h3>
              <div className="relative">
                <Icon name="map-pin" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b] pointer-events-none" />
                <select value={filters.arrivalCity || ''} onChange={(e) => setFilters((p) => ({ ...p, arrivalCity: e.target.value || undefined }))}
                  className="w-full rounded-xl border border-[#c0c8ca] bg-white pl-9 pr-3 py-2.5 text-[14px] text-[#011f23] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 outline-none transition-all appearance-none">
                  <option value="">{copy.common.allCities}</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-[14px] font-bold text-[#40484a] mb-2">{copy.common.date}</h3>
              <input type="date" value={filters.date || ''} onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value || undefined }))}
                className="w-full rounded-xl border border-[#c0c8ca] bg-white px-3 py-2.5 text-[14px] text-[#011f23] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 outline-none transition-all" />
            </div>

            <div className="mb-5">
              <h3 className="text-[14px] font-bold text-[#40484a] mb-2">{copy.tripsPage.passengerCount}</h3>
              <div className="flex items-center justify-between rounded-xl border border-[#c0c8ca] bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => updateMinSeats(Math.max(1, (filters.minSeats || 1) - 1))}
                  className="h-8 w-8 rounded-lg bg-[#eef3f4] text-[14px] font-bold text-[#011f23] transition-colors hover:bg-[#dce4e6]"
                  aria-label={`${copy.common.passenger} -`}
                >
                  −
                </button>
                <span className="min-w-10 text-center text-[14px] font-bold text-[#011f23]">{filters.minSeats || 1}</span>
                <button
                  type="button"
                  onClick={() => updateMinSeats(Math.min(4, (filters.minSeats || 1) + 1))}
                  className="h-8 w-8 rounded-lg bg-[#eef3f4] text-[14px] font-bold text-[#011f23] transition-colors hover:bg-[#dce4e6]"
                  aria-label={`${copy.common.passenger} +`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-5 border-t border-[#c0c8ca] pt-4">
              <h3 className="text-[14px] font-bold text-[#40484a] mb-3">{copy.createTrip.preferencesTitle}</h3>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.femaleOnly || false}
                    onChange={(e) => setFilters((p) => ({ ...p, femaleOnly: e.target.checked || undefined }))}
                    className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span>{copy.createTrip.femaleOnlyLabel}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.smokingAllowed || false}
                    onChange={(e) => setFilters((p) => ({ ...p, smokingAllowed: e.target.checked || undefined }))}
                    className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span>{copy.createTrip.smokingAllowedLabel}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.petsAllowed || false}
                    onChange={(e) => setFilters((p) => ({ ...p, petsAllowed: e.target.checked || undefined }))}
                    className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span>{copy.createTrip.petsAllowedLabel}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.musicAllowed || false}
                    onChange={(e) => setFilters((p) => ({ ...p, musicAllowed: e.target.checked || undefined }))}
                    className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span>{copy.createTrip.musicAllowedLabel}</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-[#edfcff] p-3 text-[13px] leading-5 text-[#40484a]">
              {copy.tripsPage.helper}
            </div>
          </div>
        </aside>

        {}
        <section className="order-1 flex-1 flex flex-col gap-4 md:order-2">
          {}
          <div className="bg-[#dbf9fe] p-5 rounded-2xl border border-[#c0c8ca] flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-[24px] font-semibold text-[#002f37] mb-1">
                <span>{from}</span>
                <Icon name="arrow-right" size={20} className="text-[#70787b]" />
                <span>{to}</span>
              </div>
              <div className="text-[14px] text-[#40484a] flex items-center gap-2">
                <Icon name="calendar" size={14} />
                <span>{filters.date || copy.common.allDates}</span>
              </div>
            </div>
            <div className="mt-2 sm:mt-0 flex flex-col items-end gap-2">
              <div className="flex bg-white rounded-lg p-1 border border-[#c0c8ca] shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'list' ? 'bg-[#054752] text-white' : 'text-[#40484a] hover:bg-[#f0f3f4]'
                  }`}
                >
                  <Icon name="list" size={14} />
                  {copy.tripsPage.list}
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'map' ? 'bg-[#054752] text-white' : 'text-[#40484a] hover:bg-[#f0f3f4]'
                  }`}
                >
                  <Icon name="map" size={14} />
                  {copy.tripsPage.map}
                </button>
              </div>
              <span className="text-[14px] text-[#40484a] font-medium">
                {filteredTrips.length} {copy.tripsPage.resultsFound}
              </span>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-[#c0c8ca] bg-white px-3 py-1 text-[12px] font-semibold text-[#054752]">
                  {filter}
                </span>
              ))}
            </div>
          )}

          {}
          {viewMode === 'map' ? (
            <div className="h-[400px] md:h-[600px] w-full rounded-2xl overflow-hidden border border-[#c0c8ca] shadow-card">
              <MapContainer className="h-full">
                <RideMarkers trips={filteredTrips} users={users} />
              </MapContainer>
            </div>
          ) : isLoadingTrips ? (
            <LoadingState />
          ) : lastError ? (
            <EmptyState
              title={copy.tripsPage.emptyTitle}
              description={lastError}
              action={(
                <button
                  type="button"
                  onClick={clearError}
                  className="rounded-xl border border-[#c0c8ca] px-4 py-2 text-sm font-semibold text-[#054752] hover:bg-[#f7fbfc]"
                >
                  {copy.common.close}
                </button>
              )}
            />
          ) : filteredTrips.length > 0 ? (
            <div className="flex flex-col gap-3 stagger-children">
              {filteredTrips.map((trip) => {
                const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
                const isFull = trip.seatsAvailable === 0;
                return (
                  <article key={trip.id}
                    onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
                    className={`bg-white rounded-2xl border border-[#c0c8ca] p-5 shadow-card transition-all ${
                      isFull ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-[#9acfdc] hover:shadow-card-hover cursor-pointer'
                    }`}>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">                      <div className="order-2 flex items-center gap-3 sm:w-[180px] shrink-0">
                        <div className="relative">
                          {driver?.avatarUrl ? (
                            <Image src={driver.avatarUrl} alt={driver.fullName} width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-[#c0c8ca]" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#054752] flex items-center justify-center text-white text-[15px] font-bold">
                              {driver?.fullName.charAt(0) || '?'}
                            </div>
                          )}
                          {driver && driver.rating >= 4.5 && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-[#054752] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-[#002f37] flex items-center gap-1">
                            <span>{driver?.fullName.split(' ')[0] || copy.common.unknown}</span>
                            {driver?.verificationStatus === 'approved' && (
                              <Icon name="shield-check" size={14} className="text-green-600 shrink-0" />
                            )}
                          </h4>
                          <div className="flex items-center gap-1 text-[13px] text-[#40484a]">
                            <Icon name="star" size={13} className="text-[#F5A623]" fill="currentColor" />
                            <span className="font-bold">{driver?.rating.toFixed(1)}</span>
                            <span>({driver?.totalTrips})</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline / Route Banner */}
                      <div className="order-1 flex flex-col gap-2 flex-1 min-w-0">
                        {/* Cities Route */}
                        <div className="flex items-center gap-2 text-[18px] font-bold text-[#002f37]">
                          <span>{trip.departureCity}</span>
                          <Icon name="arrow-right" size={16} className="text-[#054752] shrink-0" />
                          <span>{trip.arrivalCity}</span>
                        </div>
                        
                        {/* Trip Info Meta Row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#40484a]">
                          {/* Departure Time */}
                          <div className="flex items-center gap-1 bg-[#edfcff] px-2 py-0.5 rounded text-[#054752] font-semibold border border-[#054752]/10">
                            <Icon name="clock" size={13} />
                            <span>{trip.time}</span>
                          </div>
                          
                          {/* Car Model */}
                          {trip.carModel && (
                            <div className="flex items-center gap-1.5 text-[#50585a]">
                              <Icon name="car" size={13} />
                              <span>{trip.carModel}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing, Seats, Preferences */}
                      <div className="order-3 flex flex-col items-end sm:w-[120px] shrink-0">
                        <div className="text-[20px] font-bold text-[#002f37]">{trip.pricePerSeat} ₼</div>
                        <div className={`flex items-center gap-1 mt-1 text-[12px] font-bold ${isFull ? 'text-[#ba1a1a]' : 'text-[#054752]'}`}>
                          {isFull ? <Icon name="ban" size={14} /> : <Icon name="armchair" size={14} />}
                          <span>{isFull ? copy.common.noSeats : `${trip.seatsAvailable} ${copy.common.seatsLeft}`}</span>
                        </div>
                        
                        {/* Comfort Preference Badges */}
                        <div className="flex items-center gap-1 mt-2.5">
                          {trip.femaleOnly && (
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-pink-50 text-pink-600 border border-pink-100 shadow-sm" title={copy.createTrip.femaleOnlyLabel}>
                              <Icon name="sparkles" size={11} />
                            </span>
                          )}
                          {trip.smokingAllowed && (
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-50 text-brand-600 border border-brand-100 shadow-sm" title={copy.createTrip.smokingAllowedLabel}>
                              <Icon name="cigarette-off" size={11} className="rotate-180" />
                            </span>
                          )}
                          {trip.petsAllowed && (
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-50 text-brand-600 border border-brand-100 shadow-sm" title={copy.createTrip.petsAllowedLabel}>
                              <Icon name="dog" size={11} />
                            </span>
                          )}
                          {trip.musicAllowed && (
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-50 text-brand-600 border border-brand-100 shadow-sm" title={copy.createTrip.musicAllowedLabel}>
                              <Icon name="repeat" size={11} />
                            </span>
                          )}
                        </div>

                        {!isFull && <span className="mt-2 text-[12px] font-bold text-[#054752]">{copy.common.details}</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title={copy.tripsPage.emptyTitle} description={copy.tripsPage.emptyDescription} />
          )}
        </section>
      </div>
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
