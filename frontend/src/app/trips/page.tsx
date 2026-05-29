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

  // Local state for search inputs
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

  const renderTripCard = (trip: typeof trips[number]) => {
    const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
    const isFull = trip.seatsAvailable === 0;

    return (
      <article
        key={trip.id}
        onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
        className={`group grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 sm:grid-cols-[minmax(0,1fr)_180px] ${
          isFull ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-pointer hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md'
        }`}
      >
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
              <Icon name="calendar" size={13} />
              {trip.date}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
              <Icon name="clock" size={13} />
              {trip.time}
            </span>
            {trip.carModel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                <Icon name="car" size={13} />
                {trip.carModel}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <div className="flex flex-col items-center pt-1">
              <span className="h-3 w-3 rounded-full bg-teal-500 ring-4 ring-teal-50" />
              <span className="my-1 h-10 w-px bg-slate-200" />
              <span className="h-3 w-3 rounded-full bg-navy ring-4 ring-slate-100" />
            </div>
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{copy.common.from}</p>
                <p className="truncate font-heading text-lg font-extrabold text-navy">{trip.departureCity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{copy.common.to}</p>
                <p className="truncate font-heading text-lg font-extrabold text-navy">{trip.arrivalCity}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              {driver?.avatarUrl ? (
                <Image
                  src={driver.avatarUrl}
                  alt={driver.fullName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {driver?.fullName.charAt(0) || '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-navy">{driver?.fullName || copy.common.unknown}</p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Icon name="star" size={12} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">{driver?.rating.toFixed(1)}</span>
                  <span>- {driver?.totalTrips ?? 0} trips</span>
                  {driver?.verificationStatus === 'approved' && (
                    <span className="ml-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">Verified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              {trip.femaleOnly && <span title={copy.createTrip.femaleOnlyLabel}><Icon name="venus" size={14} /></span>}
              {trip.musicAllowed && <span title={copy.createTrip.musicAllowedLabel}><Icon name="music" size={14} /></span>}
              {trip.petsAllowed && <span title={copy.createTrip.petsAllowedLabel}><Icon name="paw-print" size={14} /></span>}
              {trip.smokingAllowed && <span title={copy.createTrip.smokingAllowedLabel}><Icon name="cigarette" size={14} /></span>}
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-4 rounded-xl bg-teal-50/70 p-4 sm:flex-col sm:items-stretch sm:justify-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">{copy.createTrip.summaryPrice}</p>
            <p className="font-heading text-3xl font-extrabold text-navy">{formatPrice(trip.pricePerSeat)}</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
            isFull ? 'bg-red-50 text-red-600' : 'bg-white text-teal-700 ring-1 ring-teal-100'
          }`}>
            {isFull ? <Icon name="ban" size={15} /> : <Icon name="users" size={15} />}
            {isFull ? copy.common.noSeats : `${trip.seatsAvailable} ${copy.common.seatsLeft}`}
          </div>
          <span className="hidden rounded-lg bg-navy px-4 py-2 text-center text-sm font-bold text-white transition-colors group-hover:bg-teal-700 sm:block">
            {copy.common.details}
          </span>
        </div>
      </article>
    );
  };

  const renderMapTripCard = (trip: typeof trips[number]) => {
    const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
    const isFull = trip.seatsAvailable === 0;

    return (
      <article
        key={trip.id}
        onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
        className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 ${
          isFull ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-pointer hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
                <Icon name="calendar" size={12} />
                {trip.date}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
                <Icon name="clock" size={12} />
                {trip.time}
              </span>
            </div>
            {trip.carModel && (
              <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                <Icon name="car" size={12} />
                <span className="truncate">{trip.carModel}</span>
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400">{copy.createTrip.summaryPrice}</p>
            <p className="font-heading text-2xl font-extrabold text-navy">{formatPrice(trip.pricePerSeat)}</p>
          </div>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
          <div className="flex flex-col items-center pt-1">
            <span className="h-3 w-3 rounded-full bg-teal-500 ring-4 ring-teal-50" />
            <span className="my-1 h-8 w-px bg-slate-200" />
            <span className="h-3 w-3 rounded-full bg-navy ring-4 ring-slate-100" />
          </div>
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.common.from}</p>
              <p className="truncate text-base font-extrabold text-navy">{trip.departureCity}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{copy.common.to}</p>
              <p className="truncate text-base font-extrabold text-navy">{trip.arrivalCity}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {driver?.avatarUrl ? (
              <Image
                src={driver.avatarUrl}
                alt={driver.fullName}
                width={34}
                height={34}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                {driver?.fullName.charAt(0) || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy">{driver?.fullName || copy.common.unknown}</p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Icon name="star" size={11} className="fill-amber-400 text-amber-400" />
                <span>{driver?.rating.toFixed(1)}</span>
                <span>- {driver?.totalTrips ?? 0}</span>
              </div>
            </div>
          </div>

          <div className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
            isFull ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700 ring-1 ring-teal-100'
          }`}>
            {isFull ? copy.common.noSeats : `${trip.seatsAvailable} ${copy.common.seatsLeft}`}
          </div>
        </div>
      </article>
    );
  };

  return (
    <WebLayout>
      <section className="mb-6 w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {copy.tripsPage.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{copy.searchPage.routeDesc}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700">
            <Icon name="list" size={14} />
            {filteredTrips.length} {copy.tripsPage.resultsFound}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_56px] md:items-end">
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
            className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0"
            aria-label={copy.common.search}
          >
            <Icon name="search" size={20} />
          </button>
        </div>
      </section>

      {/* Main Grid: Filters Sidebar + Results / Map */}
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        {/* Left Sidebar Filters */}
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72">
          <div className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {/* Sidebar Title */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h2 className="font-heading font-bold text-base text-navy">{copy.tripsPage.filters}</h2>
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
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
              >
                {copy.tripsPage.reset}
              </button>
            </div>

            {/* Passenger Count Filter */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{copy.tripsPage.passengerCount}</label>
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 p-1.5">
                <button
                  type="button"
                  onClick={() => updateMinSeats(Math.max(1, (filters.minSeats || 1) - 1))}
                  className="h-9 w-9 rounded-xl bg-white border border-gray-100 text-navy transition-all duration-200 hover:bg-gray-50 flex items-center justify-center shadow-xs active:scale-90 cursor-pointer"
                  aria-label={`${copy.common.passenger} -`}
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="font-heading font-extrabold text-navy min-w-10 text-center">{filters.minSeats || 1}</span>
                <button
                  type="button"
                  onClick={() => updateMinSeats(Math.min(4, (filters.minSeats || 1) + 1))}
                  className="h-9 w-9 rounded-xl bg-white border border-gray-100 text-navy transition-all duration-200 hover:bg-gray-50 flex items-center justify-center shadow-xs active:scale-90 cursor-pointer"
                  aria-label={`${copy.common.passenger} +`}
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>

            {/* Preference Checkboxes */}
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{copy.createTrip.preferencesTitle}</label>
              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'femaleOnly',
                    label: copy.createTrip.femaleOnlyLabel,
                    icon: 'venus' as const,
                  },
                  {
                    key: 'smokingAllowed',
                    label: copy.createTrip.smokingAllowedLabel,
                    icon: 'cigarette' as const,
                  },
                  {
                    key: 'petsAllowed',
                    label: copy.createTrip.petsAllowedLabel,
                    icon: 'paw-print' as const,
                  },
                  {
                    key: 'musicAllowed',
                    label: copy.createTrip.musicAllowedLabel,
                    icon: 'music' as const,
                  },
                ].map((pref) => (
                  <label key={pref.key} className="flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-navy cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(filters[pref.key as keyof TripSearchFilters])}
                      onChange={(e) => setFilters((p) => ({ ...p, [pref.key]: e.target.checked || undefined }))}
                      className="peer h-5 w-5 rounded-lg border-gray-200 text-teal-600 focus:ring-teal-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Icon name={pref.icon} size={15} className="text-gray-400" />
                      <span>{pref.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Helper Info Card */}
            <div className="rounded-2xl bg-teal-50/60 p-4 border border-teal-100/70 text-xs leading-relaxed text-teal-800 font-medium">
              <div className="flex gap-2">
                <Icon name="info" size={14} className="shrink-0 text-teal-600 mt-0.5" />
                <span>{copy.tripsPage.helper}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Results section */}
        <section className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {/* Header Banner - Results Info & List/Map Toggles */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <div className="text-lg font-heading font-extrabold text-navy flex flex-wrap items-center gap-2">
                <span>{filters.departureCity || copy.common.all}</span>
                <Icon name="arrow-right" size={16} className="text-gray-400" />
                <span>{filters.arrivalCity || copy.common.all}</span>
              </div>
              <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Icon name="calendar" size={14} />
                <span>{filters.date || copy.common.allDates}</span>
                <span className="text-gray-200">-</span>
                <span>
                  {filteredTrips.length} {copy.tripsPage.resultsFound}
                </span>
              </div>
            </div>

            {/* Toggle buttons */}
            <div className="flex rounded-2xl border border-gray-100 bg-slate-50 p-1 shadow-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  viewMode === 'list' ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-navy hover:bg-gray-100/50'
                }`}
              >
                <Icon name="list" size={14} />
                {copy.tripsPage.list}
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  viewMode === 'map' ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-navy hover:bg-gray-100/50'
                }`}
              >
                <Icon name="map" size={14} />
                {copy.tripsPage.map}
              </button>
            </div>
          </div>

          {/* Active filters badges */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-gray-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700 flex items-center shadow-xs">
                  {filter}
                </span>
              ))}
            </div>
          )}

          {/* Main Content Area */}
          {viewMode === 'map' ? (
            /* Side-by-side list + map */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
              {/* Scrollable list column */}
              <div className="lg:col-span-4 flex max-h-[650px] flex-col gap-3 overflow-y-auto pr-1">
                {isLoadingTrips ? (
                  <LoadingState />
                ) : lastError ? (
                  <EmptyState
                    title={copy.tripsPage.emptyTitle}
                    description={lastError}
                    action={(
                      <button
                        type="button"
                        onClick={clearError}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                      >
                        {copy.common.close}
                      </button>
                    )}
                  />
                ) : filteredTrips.length > 0 ? (
                  filteredTrips.map(renderMapTripCard)
                ) : (
                  <EmptyState title={copy.tripsPage.emptyTitle} description={copy.tripsPage.emptyDescription} />
                )}
              </div>

              {/* Map column */}
              <div className="lg:col-span-8 h-[450px] lg:h-[650px] lg:sticky lg:top-24 rounded-3xl overflow-hidden border border-gray-100 shadow-sm w-full">
                <MapContainer className="h-full w-full">
                  <RideMarkers trips={filteredTrips} users={users} />
                </MapContainer>
              </div>
            </div>
          ) : (
            /* Full width readable list */
            isLoadingTrips ? (
              <LoadingState />
            ) : lastError ? (
              <EmptyState
                title={copy.tripsPage.emptyTitle}
                description={lastError}
                action={(
                  <button
                    type="button"
                    onClick={clearError}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                  >
                    {copy.common.close}
                  </button>
                )}
              />
            ) : filteredTrips.length > 0 ? (
              <div className="flex w-full flex-col gap-4">
                {filteredTrips.map(renderTripCard)}
              </div>
            ) : (
              <EmptyState title={copy.tripsPage.emptyTitle} description={copy.tripsPage.emptyDescription} />
            )
          )}
        </section>
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
