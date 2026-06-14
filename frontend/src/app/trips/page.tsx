'use client';

import { useState, Suspense, useMemo } from "react";
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/utils';
import { getLocalizedCityName, getLocalizedCityOptions, PUBLIC_CITY_KEYS, CITY_COORDINATES, CITY_LABELS, getCityCoordinatesByName } from '@/lib/cities';
import Icon from '@/components/ui/Icon';
import type { TripSearchFilters } from '@/types';
import { useOsrmMultipleRoutes } from '@/components/ui/Map/utils';
import type { MapMarkerData } from '@/components/ui/Map/types';
import { I18N } from '@/lib/i18n';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import FadeInOnScroll from '@/components/ui/FadeInOnScroll';
import { useTripsPage } from '@/hooks/useTrips';

const MapContainer = dynamic(() => import('@/components/ui/Map').then(mod => ({ default: mod.MapContainer })), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl animate-pulse" />,
});

function TripsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { users, language, clearError } = useAppStore();
  const copy = I18N[language];
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const cityOptions = getLocalizedCityOptions(language);

  const [filters, setFilters] = useState<TripSearchFilters>({
    departureCity: searchParams.get('from') || undefined,
    arrivalCity: searchParams.get('to') || undefined,
    date: searchParams.get('date') || undefined,
    minSeats: searchParams.get('passengers') ? Number(searchParams.get('passengers')) : undefined,
  });

  const [searchFrom, setSearchFrom] = useState(filters.departureCity || '');
  const [searchTo, setSearchTo] = useState(filters.arrivalCity || '');
  const [searchDate, setSearchDate] = useState(filters.date || '');

  // React Query — replaces Zustand fetchTrips
  const { data: trips = [], isLoading: isLoadingTrips, error: queryError } = useTripsPage(filters);
  const lastError = queryError ? String(queryError) : null;

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (filters.femaleOnly && !t.femaleOnly) return false;
      if (filters.smokingAllowed && !t.smokingAllowed) return false;
      if (filters.petsAllowed && !t.petsAllowed) return false;
      if (filters.musicAllowed && !t.musicAllowed) return false;
      return true;
    });
  }, [trips, filters.femaleOnly, filters.smokingAllowed, filters.petsAllowed, filters.musicAllowed]);

  // Fetch routes for visible trips
  const routePolylinesMap = useOsrmMultipleRoutes(filteredTrips);

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

  const handleMapMarkerClick = (cityCanonicalName: string) => {
    let nextFrom = searchFrom;
    let nextTo = searchTo;

    if (searchFrom === cityCanonicalName) {
      nextFrom = '';
    } else if (searchTo === cityCanonicalName) {
      nextTo = '';
    } else if (!searchFrom) {
      nextFrom = cityCanonicalName;
    } else if (!searchTo) {
      nextTo = cityCanonicalName;
    } else {
      nextFrom = cityCanonicalName;
      nextTo = '';
    }

    setSearchFrom(nextFrom);
    setSearchTo(nextTo);

    setFilters((p) => ({
      ...p,
      departureCity: nextFrom || undefined,
      arrivalCity: nextTo || undefined,
    }));

    const params = new URLSearchParams();
    if (nextFrom) params.set('from', nextFrom);
    if (nextTo) params.set('to', nextTo);
    if (searchDate) params.set('date', searchDate);
    if (filters.minSeats) params.set('passengers', String(filters.minSeats));
    router.replace(`/trips?${params.toString()}`);
  };

  const updateMinSeats = (nextSeats: number) => {
    setFilters((p) => ({ ...p, minSeats: nextSeats > 1 ? nextSeats : undefined }));
  };

  const activeFilters = [
    filters.departureCity && `${copy.tripsPage.filterFrom}: ${getLocalizedCityName(filters.departureCity, language)}`,
    filters.arrivalCity && `${copy.tripsPage.filterTo}: ${getLocalizedCityName(filters.arrivalCity, language)}`,
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
    const departureCity = getLocalizedCityName(trip.departureCity, language);
    const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);

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
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-navy">
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{copy.common.from}</p>
                  <p className="truncate font-heading text-[22px] font-semibold text-navy leading-tight">{departureCity}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{copy.common.to}</p>
                  <p className="truncate font-heading text-[22px] font-semibold text-navy leading-tight">{arrivalCity}</p>
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-navy">
                    {driver?.fullName.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-navy">{driver?.fullName || copy.common.unknown}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name="star" size={12} className="text-navy" />
                    <span className="font-semibold text-navy">{driver?.rating.toFixed(1)}</span>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{copy.createTrip.summaryPrice}</p>
              <p className="font-heading text-3xl sm:text-[2.25rem] font-semibold text-navy tracking-tight">{formatPrice(trip.pricePerSeat)}</p>
            </div>
            
            <div className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold w-full sm:w-auto justify-center ${
              isFull ? 'bg-gray-100 text-gray-500' : 'bg-slate-50 text-navy'
            }`}>
              {isFull ? <Icon name="ban" size={16} /> : <Icon name="users" size={16} />}
              {isFull ? copy.common.noSeats : `${trip.seatsAvailable} ${copy.common.seatsLeft}`}
            </div>

            {!isFull && (
               <div className="hidden sm:block w-full">
                 <button className="w-full rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
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
    const departureCity = getLocalizedCityName(trip.departureCity, language);
    const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);

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
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-navy">
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
              <p className="font-heading text-xl font-semibold text-navy">{formatPrice(trip.pricePerSeat)}</p>
            </div>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 mb-3">
            <div className="flex flex-col items-center pt-1">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-navy bg-white" />
              <span className="my-1 h-6 w-[2px] bg-gray-200 rounded-full" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy" />
            </div>
            <div className="min-w-0 space-y-2.5">
              <p className="truncate text-sm font-semibold text-navy leading-none mt-0.5">{departureCity}</p>
              <p className="truncate text-sm font-semibold text-navy leading-none pt-1">{arrivalCity}</p>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-navy">
                  {driver?.fullName.charAt(0) || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-navy">{driver?.fullName || copy.common.unknown}</p>
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <Icon name="star" size={10} className="text-navy" />
                  <span className="text-navy font-semibold">{driver?.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
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
                  <h1 className="font-heading text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
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
                    ...cityOptions,
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
                    ...cityOptions,
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
                  <span className="ml-2 font-semibold md:hidden">{copy.common.search}</span>
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
                    <h2 className="font-heading font-semibold text-lg text-navy">{copy.tripsPage.filters}</h2>
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
                      className="text-xs font-semibold text-slate-400 hover:text-navy transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {copy.tripsPage.reset}
                    </button>
                  </div>

                  {/* Passenger Count Filter */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{copy.tripsPage.passengerCount}</label>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-1.5 border border-gray-100">
                      <button
                        type="button"
                        onClick={() => updateMinSeats(Math.max(1, (filters.minSeats || 1) - 1))}
                        className="h-10 w-10 rounded-lg bg-white shadow-sm text-navy transition-transform hover:scale-105 flex items-center justify-center active:scale-95"
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <span className="font-heading text-lg font-semibold text-navy">{filters.minSeats || 1}</span>
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
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{copy.createTrip.preferencesTitle}</label>
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
                            <span className={`text-sm font-semibold transition-colors ${filters[pref.key as keyof TripSearchFilters] ? 'text-navy' : 'text-slate-500 group-hover:text-navy'}`}>{pref.label}</span>
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
                    <div className="text-xl font-heading font-semibold text-navy flex flex-wrap items-center gap-2">
                      <span>{filters.departureCity ? getLocalizedCityName(filters.departureCity, language) : copy.common.all}</span>
                      <Icon name="arrow-right" size={18} className="text-gray-300" />
                      <span>{filters.arrivalCity ? getLocalizedCityName(filters.arrivalCity, language) : copy.common.all}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <span>{filters.date || copy.common.allDates}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-semibold text-navy">
                        {filteredTrips.length} {copy.tripsPage.resultsFound}
                      </span>
                    </div>
                  </div>

                  {/* Toggle buttons */}
                  <div className="flex rounded-xl bg-white p-1 shadow-sm border border-gray-100">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold cursor-pointer ${
                        viewMode === 'list' ? 'bg-slate-100 text-navy' : 'text-slate-400 hover:text-navy'
                      }`}
                    >
                      <Icon name="list" size={16} />
                      {copy.tripsPage.list}
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold cursor-pointer ${
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
                    <span key={filter} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-navy flex items-center shadow-sm">
                      {filter}
                    </span>
                  ))}
                </div>
              )}

              {/* Main Content Area */}
              {viewMode === 'map' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                  <div className="lg:col-span-5 flex max-h-[700px] flex-col gap-4 overflow-y-auto pr-2 pb-10 scrollbar-hide">
                    {isLoadingTrips ? (
                      <LoadingState />
                    ) : lastError ? (
                      <EmptyState title={copy.tripsPage.emptyTitle} description={lastError} action={<button onClick={clearError} className="font-semibold text-navy underline">Close</button>} />
                    ) : filteredTrips.length > 0 ? (
                      filteredTrips.map((trip, idx) => renderMapTripCard(trip, idx))
                    ) : (
                      <EmptyState title={copy.tripsPage.emptyTitle} description={copy.tripsPage.emptyDescription} />
                    )}
                  </div>

                  <div className="lg:col-span-7 lg:sticky lg:top-28 flex flex-col gap-4 w-full">
                    {/* Visual Map Selection Indicators */}
                    {(searchFrom || searchTo) && (
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-teal-50/70 border border-teal-100 rounded-2xl shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                            {language === 'az' ? 'Xəritə Seçimi:' : language === 'ru' ? 'Выбор на карте:' : 'Map Selection:'}
                          </span>
                          {searchFrom && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>{getLocalizedCityName(searchFrom, language)}</span>
                              <button 
                                onClick={() => handleMapMarkerClick(searchFrom)}
                                className="text-emerald-500 hover:text-emerald-700 font-bold ml-1 focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          )}
                          {searchTo && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span>{getLocalizedCityName(searchTo, language)}</span>
                              <button 
                                onClick={() => handleMapMarkerClick(searchTo)}
                                className="text-red-500 hover:text-red-700 font-bold ml-1 focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSearchFrom('');
                            setSearchTo('');
                            setFilters((p) => ({
                              ...p,
                              departureCity: undefined,
                              arrivalCity: undefined,
                            }));
                            const params = new URLSearchParams();
                            if (searchDate) params.set('date', searchDate);
                            if (filters.minSeats) params.set('passengers', String(filters.minSeats));
                            const query = params.toString();
                            router.replace(query ? `/trips?${query}` : '/trips');
                          }}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline focus:outline-none cursor-pointer"
                        >
                          {language === 'az' ? 'Sıfırla' : language === 'ru' ? 'Сбросить' : 'Reset'}
                        </button>
                      </div>
                    )}
                    
                    <div className="h-[500px] lg:h-[630px] rounded-[32px] overflow-hidden border border-gray-100 shadow-[0_4px_30px_rgb(0,0,0,0.05)] w-full relative z-0">
                      <MapContainer 
                        className="h-full w-full"
                        markers={(() => {
                          const m: MapMarkerData[] = [];
                          
                          PUBLIC_CITY_KEYS.forEach(key => {
                            const coords = CITY_COORDINATES[key];
                            if (coords) {
                              const canonicalName = CITY_LABELS[key].az;
                              const isOrigin = searchFrom === canonicalName;
                              const isDestination = searchTo === canonicalName;
                              
                              m.push({
                                position: [coords.lat, coords.lng],
                                type: isOrigin ? 'origin' : isDestination ? 'destination' : undefined,
                                popup: (
                                  <div className="p-1 text-center">
                                    <div className="font-semibold text-sm text-navy">{CITY_LABELS[key][language]}</div>
                                    <div className="text-[10px] text-teal-600 font-medium mt-1">
                                      {isOrigin ? copy.tripsPage.filterFrom : isDestination ? copy.tripsPage.filterTo : (language === 'az' ? 'Seçmək üçün klikləyin' : language === 'ru' ? 'Нажмите для выбора' : 'Click to select')}
                                    </div>
                                  </div>
                                ),
                                onClick: () => handleMapMarkerClick(canonicalName),
                              });
                            }
                          });
                          
                          return m;
                        })()}
                        polylines={filteredTrips.filter(t => t.origin && t.destination).map(t => {
                          return routePolylinesMap[t.id] || [
                            [t.origin!.lat, t.origin!.lng],
                            [t.destination!.lat, t.destination!.lng]
                          ];
                        })}
                        fitBounds={(() => {
                          const bounds: [number, number][] = [];
                          const fromCoords = getCityCoordinatesByName(searchFrom);
                          const toCoords = getCityCoordinatesByName(searchTo);
                          
                          if (fromCoords && toCoords) {
                            bounds.push([fromCoords.lat, fromCoords.lng]);
                            bounds.push([toCoords.lat, toCoords.lng]);
                          }
                          
                          if (bounds.length === 0) {
                            filteredTrips.forEach(t => {
                              if (t.origin) bounds.push([t.origin.lat, t.origin.lng]);
                              if (t.destination) bounds.push([t.destination.lat, t.destination.lng]);
                            });
                          }
                          
                          if (bounds.length === 0) {
                            PUBLIC_CITY_KEYS.forEach((key) => {
                              const coords = CITY_COORDINATES[key];
                              if (coords) bounds.push([coords.lat, coords.lng]);
                            });
                          }
                          
                          return bounds;
                        })()}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                isLoadingTrips ? (
                  <LoadingState />
                ) : lastError ? (
                  <EmptyState title={copy.tripsPage.emptyTitle} description={lastError} action={<button onClick={clearError} className="font-semibold text-navy underline">Close</button>} />
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
