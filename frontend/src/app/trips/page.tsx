'use client';

import { useState, Suspense, useEffect, useMemo } from "react";
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { AZ_CITIES, formatPrice } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import type { TripSearchFilters } from '@/types';
import { MapContainer, RideMarkers } from '@/components/ui/Map';
import { I18N } from '@/lib/i18n';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import FadeInOnScroll from '@/components/ui/FadeInOnScroll';

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

  const [searchFrom, setSearchFrom] = useState(filters.departureCity || '');
  const [searchTo, setSearchTo] = useState(filters.arrivalCity || '');
  const [searchDate, setSearchDate] = useState(filters.date || '');

  useEffect(() => {
    fetchTrips(filters);
  }, [fetchTrips, filters]);

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (filters.femaleOnly && !t.femaleOnly) return false;
      if (filters.smokingAllowed && !t.smokingAllowed) return false;
      if (filters.petsAllowed && !t.petsAllowed) return false;
      if (filters.musicAllowed && !t.musicAllowed) return false;
      return true;
    });
  }, [trips, filters.femaleOnly, filters.smokingAllowed, filters.petsAllowed, filters.musicAllowed]);

  const handleSearch = () => {
    setFilters((p) => ({
      ...p,
      departureCity: searchFrom || undefined,
      arrivalCity: searchTo || undefined,
      date: searchDate || undefined,
    }));

    const params = new URLSearchParams();
    if (searchFrom) params.set('from', searchFrom);
    if (searchTo) params.set('to', searchTo);
    if (searchDate) params.set('date', searchDate);
    if (filters.minSeats) params.set('passengers', String(filters.minSeats));
    router.replace(`/trips?${params.toString()}`);
  };

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
  ].filter((f): f is string => !!f);

  const renderTripCard = (trip: typeof trips[number], index: number) => {
    const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
    const isFull = trip.seatsAvailable === 0;

    return (
      <FadeInOnScroll key={trip.id} delay={index * 100}>
        <article
          onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
          className={`group relative flex flex-col sm:flex-row items-stretch justify-between gap-6 rounded-[24px] bg-white p-5 transition-all duration-300 border border-white/50 ${
            isFull ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(20,184,166,0.12)] hover:-translate-y-1 hover:border-teal-200'
          }`}
        >
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold text-navy">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1.5 border border-navy/10">
                <Icon name="calendar" size={14} className="text-navy/70" />
                {trip.date}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1.5 border border-navy/10">
                <Icon name="clock" size={14} className="text-navy/70" />
                {trip.time}
              </span>
              {trip.carModel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1.5 border border-navy/10">
                  <Icon name="car" size={14} className="text-navy/70" />
                  {trip.carModel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-4">
              <div className="flex flex-col items-center pt-1.5 pb-1">
                <span className="h-3 w-3 rounded-full border-2 border-navy bg-white" />
                <span className="my-1.5 flex-1 w-[2px] rounded-full bg-gray-200 group-hover:bg-teal-300 transition-colors duration-500" />
                <span className="h-3 w-3 rounded-full bg-navy" />
              </div>
              <div className="min-w-0 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{copy.common.from}</p>
                  <p className="truncate font-heading text-[22px] font-extrabold text-navy leading-tight">{trip.departureCity}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{copy.common.to}</p>
                  <p className="truncate font-heading text-[22px] font-extrabold text-navy leading-tight">{trip.arrivalCity}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-3">
                {driver?.avatarUrl ? (
                  <Image
                    src={driver.avatarUrl}
                    alt={driver.fullName}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-navy">
                    {driver?.fullName.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-navy">{driver?.fullName || copy.common.unknown}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name="star" size={12} className="text-navy" />
                    <span className="font-bold text-navy">{driver?.rating.toFixed(1)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-medium">{driver?.totalTrips ?? 0} trips</span>
                    {driver?.verificationStatus === 'approved' && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Icon name="shield-check" size={14} className="text-teal-600" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                {trip.femaleOnly && <span className="bg-slate-50 p-1.5 rounded-md" title={copy.createTrip.femaleOnlyLabel}><Icon name="venus" size={16} /></span>}
                {trip.musicAllowed && <span className="bg-slate-50 p-1.5 rounded-md" title={copy.createTrip.musicAllowedLabel}><Icon name="music" size={16} /></span>}
                {trip.petsAllowed && <span className="bg-slate-50 p-1.5 rounded-md" title={copy.createTrip.petsAllowedLabel}><Icon name="paw-print" size={16} /></span>}
                {trip.smokingAllowed && <span className="bg-slate-50 p-1.5 rounded-md" title={copy.createTrip.smokingAllowedLabel}><Icon name="cigarette" size={16} /></span>}
              </div>
            </div>
          </div>

          {/* Pricing & CTA Area */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:w-48 sm:border-l sm:border-gray-100 sm:pl-6">
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{copy.createTrip.summaryPrice}</p>
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">{formatPrice(trip.pricePerSeat)}</p>
            </div>
            
            <div className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold w-full sm:w-auto justify-center ${
              isFull ? 'bg-gray-100 text-gray-500' : 'bg-slate-50 text-navy'
            }`}>
              {isFull ? <Icon name="ban" size={16} /> : <Icon name="users" size={16} />}
              {isFull ? copy.common.noSeats : `${trip.seatsAvailable} ${copy.common.seatsLeft}`}
            </div>

            {!isFull && (
               <div className="hidden sm:block w-full">
                 <button className="w-full rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-bold text-white transition-all hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
                   {copy.common.details}
                 </button>
               </div>
            )}
          </div>
        </article>
      </FadeInOnScroll>
    );
  };

  const renderMapTripCard = (trip: typeof trips[number], index: number) => {
    const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
    const isFull = trip.seatsAvailable === 0;

    return (
      <FadeInOnScroll key={trip.id} delay={index * 50}>
        <article
          onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
          className={`rounded-[20px] bg-white p-4 transition-all duration-300 border border-white/50 ${
            isFull ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-pointer shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(20,184,166,0.12)] hover:-translate-y-1 hover:border-teal-200'
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-navy">
                <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2.5 py-1 border border-navy/10">
                  <Icon name="calendar" size={12} className="text-navy/70" />
                  {trip.date}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2.5 py-1 border border-navy/10">
                  <Icon name="clock" size={12} className="text-navy/70" />
                  {trip.time}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-heading text-xl font-extrabold text-navy">{formatPrice(trip.pricePerSeat)}</p>
            </div>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 mb-3">
            <div className="flex flex-col items-center pt-1">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-navy bg-white" />
              <span className="my-1 h-6 w-[2px] bg-gray-200 rounded-full" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy" />
            </div>
            <div className="min-w-0 space-y-2.5">
              <p className="truncate text-sm font-bold text-navy leading-none mt-0.5">{trip.departureCity}</p>
              <p className="truncate text-sm font-bold text-navy leading-none pt-1">{trip.arrivalCity}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {driver?.avatarUrl ? (
                <Image
                  src={driver.avatarUrl}
                  alt={driver.fullName}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-navy">
                  {driver?.fullName.charAt(0) || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-navy">{driver?.fullName || copy.common.unknown}</p>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <Icon name="star" size={10} className="text-navy" />
                  <span className="text-navy font-bold">{driver?.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
              isFull ? 'bg-gray-100 text-gray-500' : 'bg-slate-50 text-navy'
            }`}>
              {isFull ? copy.common.noSeats : `${trip.seatsAvailable} ${copy.common.seatsLeft}`}
            </div>
          </div>
        </article>
      </FadeInOnScroll>
    );
  };

  return (
    <WebLayout>
      <div className="min-h-screen relative overflow-hidden bg-slate-50 pb-24 pt-8">
        {/* Soft, vibrant atmospheric color orbs (non-glassmorphic, just background light) */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-teal-400/10 blur-[120px] pointer-events-none animate-pulse-slow-1" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none animate-pulse-slow-2" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          {/* Header & Search Block */}
          <FadeInOnScroll>
            <section className="mb-8 w-full relative overflow-hidden rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-white/50">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-heading text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                    {copy.tripsPage.title}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-slate-500">{copy.searchPage.routeDesc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_auto] md:items-end">
                <Select
                  value={searchFrom}
                  onChange={(value) => setSearchFrom(String(value))}
                  options={[
                    { value: '', label: copy.common.allCities },
                    ...AZ_CITIES.map((city) => ({ value: city, label: city })),
                  ]}
                  label={copy.common.from}
                  placeholder={copy.common.from}
                  icon="map-pin"
                  searchable
                />

                <Select
                  value={searchTo}
                  onChange={(value) => setSearchTo(String(value))}
                  options={[
                    { value: '', label: copy.common.allCities },
                    ...AZ_CITIES.map((city) => ({ value: city, label: city })),
                  ]}
                  label={copy.common.to}
                  placeholder={copy.common.to}
                  icon="map-pin"
                  searchable
                />

                <DatePicker
                  value={searchDate}
                  onChange={(newDate) => setSearchDate(newDate || '')}
                  label={copy.common.date}
                  placeholder={copy.common.selectDate}
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex h-12 w-full md:w-32 items-center justify-center rounded-xl bg-teal-600 text-white transition-all hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  aria-label={copy.common.search}
                >
                  <Icon name="search" size={20} />
                  <span className="ml-2 font-bold md:hidden">{copy.common.search}</span>
                </button>
              </div>
            </section>
          </FadeInOnScroll>

          {/* Main Grid: Filters Sidebar + Results / Map */}
          <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
            {/* Left Sidebar Filters */}
            <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-72 z-10">
              <FadeInOnScroll delay={100}>
                <div className="flex flex-col gap-6 rounded-[24px] border border-white/50 bg-white p-6 shadow-[0_4px_25px_rgb(0,0,0,0.03)]">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h2 className="font-heading font-extrabold text-lg text-navy">{copy.tripsPage.filters}</h2>
                    <button
                      onClick={() => {
                        setFilters({
                          minSeats: undefined,
                          femaleOnly: undefined,
                          smokingAllowed: undefined,
                          petsAllowed: undefined,
                          musicAllowed: undefined,
                        });
                        setSearchFrom('');
                        setSearchTo('');
                        setSearchDate('');
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-navy transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {copy.tripsPage.reset}
                    </button>
                  </div>

                  {/* Passenger Count Filter */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{copy.tripsPage.passengerCount}</label>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-1.5 border border-gray-100">
                      <button
                        type="button"
                        onClick={() => updateMinSeats(Math.max(1, (filters.minSeats || 1) - 1))}
                        className="h-10 w-10 rounded-lg bg-white shadow-sm text-navy transition-transform hover:scale-105 flex items-center justify-center active:scale-95"
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <span className="font-heading text-lg font-extrabold text-navy">{filters.minSeats || 1}</span>
                      <button
                        type="button"
                        onClick={() => updateMinSeats(Math.min(4, (filters.minSeats || 1) + 1))}
                        className="h-10 w-10 rounded-lg bg-white shadow-sm text-navy transition-transform hover:scale-105 flex items-center justify-center active:scale-95"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Preference Checkboxes */}
                  <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{copy.createTrip.preferencesTitle}</label>
                    <div className="flex flex-col gap-4">
                      {[
                        { key: 'femaleOnly', label: copy.createTrip.femaleOnlyLabel, icon: 'venus' as const },
                        { key: 'smokingAllowed', label: copy.createTrip.smokingAllowedLabel, icon: 'cigarette' as const },
                        { key: 'petsAllowed', label: copy.createTrip.petsAllowedLabel, icon: 'paw-print' as const },
                        { key: 'musicAllowed', label: copy.createTrip.musicAllowedLabel, icon: 'music' as const },
                      ].map((pref) => (
                        <label key={pref.key} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${filters[pref.key as keyof TripSearchFilters] ? 'bg-navy text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                              <Icon name={pref.icon} size={16} />
                            </div>
                            <span className={`text-sm font-bold transition-colors ${filters[pref.key as keyof TripSearchFilters] ? 'text-navy' : 'text-slate-500 group-hover:text-navy'}`}>{pref.label}</span>
                          </div>
                          <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${filters[pref.key as keyof TripSearchFilters] ? 'bg-navy' : 'bg-gray-200'}`}>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={Boolean(filters[pref.key as keyof TripSearchFilters])}
                              onChange={(e) => setFilters((p) => ({ ...p, [pref.key]: e.target.checked || undefined }))}
                            />
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${filters[pref.key as keyof TripSearchFilters] ? 'translate-x-4' : 'translate-x-1'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            </aside>

            {/* Results section */}
            <section className="flex-1 min-w-0 flex flex-col gap-6 w-full">
              {/* Header Banner */}
              <FadeInOnScroll delay={200}>
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center px-2">
                  <div className="flex flex-col gap-1">
                    <div className="text-xl font-heading font-extrabold text-navy flex flex-wrap items-center gap-2">
                      <span>{filters.departureCity || copy.common.all}</span>
                      <Icon name="arrow-right" size={18} className="text-gray-300" />
                      <span>{filters.arrivalCity || copy.common.all}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <span>{filters.date || copy.common.allDates}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-bold text-navy">
                        {filteredTrips.length} {copy.tripsPage.resultsFound}
                      </span>
                    </div>
                  </div>

                  {/* Toggle buttons */}
                  <div className="flex rounded-xl bg-white p-1 shadow-sm border border-gray-100">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold cursor-pointer ${
                        viewMode === 'list' ? 'bg-slate-100 text-navy' : 'text-slate-400 hover:text-navy'
                      }`}
                    >
                      <Icon name="list" size={16} />
                      {copy.tripsPage.list}
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold cursor-pointer ${
                        viewMode === 'map' ? 'bg-slate-100 text-navy' : 'text-slate-400 hover:text-navy'
                      }`}
                    >
                      <Icon name="map" size={16} />
                      {copy.tripsPage.map}
                    </button>
                  </div>
                </div>
              </FadeInOnScroll>

              {/* Active filters badges */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                  {activeFilters.map((filter) => (
                    <span key={filter} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold text-navy flex items-center shadow-sm">
                      {filter}
                    </span>
                  ))}
                </div>
              )}

              {/* Main Content Area */}
              {viewMode === 'map' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                  <div className="lg:col-span-5 xl:col-span-4 flex max-h-[700px] flex-col gap-4 overflow-y-auto pr-2 pb-10 scrollbar-hide">
                    {isLoadingTrips ? (
                      <LoadingState />
                    ) : lastError ? (
                      <EmptyState title={copy.tripsPage.emptyTitle} description={lastError} action={<button onClick={clearError} className="font-bold text-navy underline">Close</button>} />
                    ) : filteredTrips.length > 0 ? (
                      filteredTrips.map((trip, idx) => renderMapTripCard(trip, idx))
                    ) : (
                      <EmptyState title={copy.tripsPage.emptyTitle} description={copy.tripsPage.emptyDescription} />
                    )}
                  </div>

                  <div className="lg:col-span-7 xl:col-span-8 h-[500px] lg:h-[700px] lg:sticky lg:top-28 rounded-[32px] overflow-hidden border border-gray-100 shadow-[0_4px_30px_rgb(0,0,0,0.05)] w-full relative z-0">
                    <MapContainer className="h-full w-full">
                      <RideMarkers trips={filteredTrips} users={users} />
                    </MapContainer>
                  </div>
                </div>
              ) : (
                isLoadingTrips ? (
                  <LoadingState />
                ) : lastError ? (
                  <EmptyState title={copy.tripsPage.emptyTitle} description={lastError} action={<button onClick={clearError} className="font-bold text-navy underline">Close</button>} />
                ) : filteredTrips.length > 0 ? (
                  <div className="flex w-full flex-col gap-5">
                    {filteredTrips.map((trip, idx) => renderTripCard(trip, idx))}
                  </div>
                ) : (
                  <EmptyState title={copy.tripsPage.emptyTitle} description={copy.tripsPage.emptyDescription} />
                )
              )}
            </section>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}

export default function TripsPage() {
  const { language } = useAppStore();
  const copy = I18N[language];

  return (
    <Suspense fallback={<WebLayout title={copy.tripsPage.title}><LoadingState /></WebLayout>}>
      <TripsContent />
    </Suspense>
  );
}
