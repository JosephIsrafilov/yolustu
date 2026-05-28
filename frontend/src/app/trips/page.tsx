'use client';

import React, { useState, Suspense, useEffect } from 'react';
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

const TransparentCar = ({ src, className }: { src: string, className?: string }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 300 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;
      const stack = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
      const visited = new Uint8Array(w * h);
      while (stack.length > 0) {
        const p = stack.pop();
        if (!p) continue;
        const x = p[0], y = p[1];
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const idx = y * w + x;
        if (visited[idx]) continue;
        visited[idx] = 1;
        const i = idx * 4;
        if (data[i] > 230 && data[i+1] > 230 && data[i+2] > 230) {
          data[i+3] = 0;
          stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setDataUrl(canvas.toDataURL('image/png'));
    };
  }, [src]);

  if (!dataUrl) return <div className={className} />;
  return <img src={dataUrl} alt="car" className={className} />;
};

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
  ].filter((f): f is string => !!f);

  return (
    <WebLayout>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        {}
        <aside className="order-2 w-full md:order-1 md:w-70 shrink-0">
          <div className="bg-white rounded-2xl border border-[#c0c8ca] p-5 sticky top-20" style={{ boxShadow: '0 4px 12px rgba(5,71,82,0.05)' }}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#c0c8ca]">
              <h2 className="ui-panel-title text-[18px] text-[#002f37]">{copy.tripsPage.filters}</h2>
              <button onClick={() => setFilters({})} className="ui-action-text text-[#054752] hover:underline">{copy.tripsPage.reset}</button>
            </div>

            {}
            <div className="mb-5">
              <h3 className="ui-label-text text-[#40484a] mb-2">{copy.common.from}</h3>
              <Select
                value={filters.departureCity || ''}
                onChange={(value) => setFilters((p) => ({ ...p, departureCity: value ? String(value) : undefined }))}
                options={[
                  { value: '', label: copy.common.allCities },
                  ...AZ_CITIES.map((city) => ({ value: city, label: city })),
                ]}
                icon="map-pin"
                ariaLabel={copy.common.from}
              />
            </div>

            <div className="mb-5">
              <h3 className="ui-label-text text-[#40484a] mb-2">{copy.common.to}</h3>
              <Select
                value={filters.arrivalCity || ''}
                onChange={(value) => setFilters((p) => ({ ...p, arrivalCity: value ? String(value) : undefined }))}
                options={[
                  { value: '', label: copy.common.allCities },
                  ...AZ_CITIES.map((city) => ({ value: city, label: city })),
                ]}
                icon="map-pin"
                ariaLabel={copy.common.to}
              />
            </div>

            <div className="mb-5">
              <DatePicker
                value={filters.date || ''}
                onChange={(value) => setFilters((p) => ({ ...p, date: value || undefined }))}
                label={copy.common.date}
                placeholder={copy.common.selectDate}
                className="[&_label]:ui-label-text [&_label]:text-[#40484a]"
              />
            </div>

            <div className="mb-5">
              <h3 className="ui-label-text text-[#40484a] mb-2">{copy.tripsPage.passengerCount}</h3>
              <div className="flex items-center justify-between rounded-xl border border-[#c0c8ca] bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => updateMinSeats(Math.max(1, (filters.minSeats || 1) - 1))}
                  className="ui-label-text h-8 w-8 rounded-lg bg-[#eef3f4] text-[#011f23] transition-colors hover:bg-[#dce4e6]"
                  aria-label={`${copy.common.passenger} -`}
                >
                  <Icon name="minus" size={14} className="mx-auto" />
                </button>
                <span className="ui-label-text min-w-10 text-center text-[#011f23]">{filters.minSeats || 1}</span>
                <button
                  type="button"
                  onClick={() => updateMinSeats(Math.min(4, (filters.minSeats || 1) + 1))}
                  className="ui-label-text h-8 w-8 rounded-lg bg-[#eef3f4] text-[#011f23] transition-colors hover:bg-[#dce4e6]"
                  aria-label={`${copy.common.passenger} +`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-5 border-t border-[#c0c8ca] pt-4">
              <h3 className="ui-label-text text-[#40484a] mb-3">{copy.createTrip.preferencesTitle}</h3>
              <div className="flex flex-col gap-2.5">
                <label className="ui-chip-text flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.femaleOnly || false}
                    onChange={(e) => setFilters((p) => ({ ...p, femaleOnly: e.target.checked || undefined }))}
                    className="h-4 w-4 shrink-0 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 wrap-break-word hyphens-auto">{copy.createTrip.femaleOnlyLabel}</span>
                </label>
                <label className="ui-chip-text flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.smokingAllowed || false}
                    onChange={(e) => setFilters((p) => ({ ...p, smokingAllowed: e.target.checked || undefined }))}
                    className="h-4 w-4 shrink-0 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 wrap-break-word hyphens-auto">{copy.createTrip.smokingAllowedLabel}</span>
                </label>
                <label className="ui-chip-text flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.petsAllowed || false}
                    onChange={(e) => setFilters((p) => ({ ...p, petsAllowed: e.target.checked || undefined }))}
                    className="h-4 w-4 shrink-0 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 wrap-break-word hyphens-auto">{copy.createTrip.petsAllowedLabel}</span>
                </label>
                <label className="ui-chip-text flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.musicAllowed || false}
                    onChange={(e) => setFilters((p) => ({ ...p, musicAllowed: e.target.checked || undefined }))}
                    className="h-4 w-4 shrink-0 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 wrap-break-word hyphens-auto">{copy.createTrip.musicAllowedLabel}</span>
                </label>
              </div>
            </div>

            <div className="ui-note-text wrap-break-word rounded-xl bg-[#edfcff] p-3 leading-4.5 text-[#40484a] hyphens-auto">
              {copy.tripsPage.helper}
            </div>
          </div>
        </aside>

        {}
        <section className="order-1 flex min-w-0 flex-1 flex-col gap-4 md:order-2">
          {}
          <div className="bg-[#EAF7F9] p-4 sm:p-5 rounded-2xl border border-[#BDE0E5] flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-[22px] font-bold text-[#002f37] flex items-center gap-2">
                <span>{from}</span>
                <Icon name="arrow-right" size={20} className="text-[#70787b]" />
                <span>{to}</span>
              </div>
              <div className="text-[15px] font-medium text-[#40484a] flex items-center gap-2">
                <Icon name="calendar" size={16} />
                <span>{filters.date || copy.common.allDates}</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col items-end gap-3">
              <div className="flex bg-white rounded-lg p-1 border border-[#BDE0E5] shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-bold ${
                    viewMode === 'list' ? 'bg-[#054752] text-white' : 'text-[#40484a] hover:bg-[#f0f3f4]'
                  }`}
                >
                  <Icon name="list" size={16} />
                  {copy.tripsPage.list}
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-bold ${
                    viewMode === 'map' ? 'bg-[#054752] text-white' : 'text-[#40484a] hover:bg-[#f0f3f4]'
                  }`}
                >
                  <Icon name="map" size={16} />
                  {copy.tripsPage.map}
                </button>
              </div>
              <span className="text-[15px] font-medium text-[#40484a]">
                {filteredTrips.length} {copy.tripsPage.resultsFound}
              </span>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-[-4px]">
              {activeFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-[14px] font-medium text-[#054752] flex items-center shadow-sm">
                  {filter}
                </span>
              ))}
            </div>
          )}

          {viewMode === 'map' ? (
            <div className="h-100 md:h-150 w-full rounded-2xl overflow-hidden border border-[#c0c8ca] shadow-card">
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
            <div className="flex flex-col gap-4">
              {filteredTrips.map((trip) => {
                const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
                const isFull = trip.seatsAvailable === 0;
                return (
                  <article key={trip.id}
                    onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
                    className={`group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-500 overflow-hidden relative flex flex-col gap-4 ${
                      isFull ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:shadow-md hover:border-[#BDE0E5] cursor-pointer'
                    }`}>
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#EAF7F9]/30 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1500 ease-in-out pointer-events-none" />

                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex gap-2.5 items-center">
                         <div className="bg-[#F0F7F8] text-[#054752] font-bold px-2.5 py-1 rounded-lg text-[13px] flex items-center gap-1.5">
                           <Icon name="calendar" size={13} /> 
                           {trip.date}
                           <span className="mx-0.5 opacity-40">|</span>
                           <Icon name="clock" size={13} /> {trip.time}
                         </div>
                         {trip.carModel && <span className="text-[13px] font-medium text-gray-500 flex items-center gap-1.5"><Icon name="car" size={13} className="text-gray-400" /> {trip.carModel}</span>}
                      </div>
                      <div className="text-[18px] font-black text-[#054752] tracking-tight flex items-center gap-1">
                        {formatPrice(trip.pricePerSeat)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10 w-full mt-1">
                      <div className="flex justify-between text-[16px] font-extrabold text-gray-900 px-1">
                        <span className="group-hover:text-[#054752] transition-colors duration-300">{trip.departureCity}</span>
                        <span className="group-hover:text-[#054752] transition-colors duration-300">{trip.arrivalCity}</span>
                      </div>
                      <div className="relative w-full h-6 flex items-center px-1 mt-1">
                        <div className="absolute left-1 right-1 h-[2px] bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#054752] w-0 group-hover:w-full transition-all duration-1200 ease-in-out" />
                        </div>
                        <div className="absolute left-0 group-hover:left-[calc(100%-44px)] transition-all duration-1200 ease-in-out z-10 px-1 -mt-1.5">
                          <TransparentCar 
                            src="/api/car-image" 
                            className="w-10 object-contain drop-shadow-sm hover:scale-110 transition-transform" 
                          />
                        </div>
                        <div className="absolute left-[2px] w-2 h-2 rounded-full bg-gray-300 border-2 border-white z-0 group-hover:bg-[#054752] transition-colors duration-300" />
                        <div className="absolute right-[2px] w-2 h-2 rounded-full bg-gray-300 border-2 border-white z-0 group-hover:bg-[#054752] transition-colors duration-300 delay-900" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          {driver?.avatarUrl ? (
                            <Image src={driver.avatarUrl} alt={driver.fullName} width={36} height={36} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#054752] flex items-center justify-center text-white text-[14px] font-bold shadow-sm">
                              {driver?.fullName.charAt(0) || '?'}
                            </div>
                          )}
                          {driver?.verificationStatus === 'approved' && (
                             <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-3.5 h-3.5 flex items-center justify-center border-[1.5px] border-white shadow-sm">
                               <Icon name="check" size={8} className="text-white" strokeWidth={3} />
                             </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-gray-900 leading-tight">{driver?.fullName.split(' ')[0] || copy.common.unknown}</span>
                          <div className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 mt-0.5 leading-tight">
                            <Icon name="star" size={10} className="text-[#F5A623]" fill="currentColor"/> 
                            <span className="text-gray-700">{driver?.rating.toFixed(1)}</span>
                            <span className="font-medium">({driver?.totalTrips})</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 opacity-50">
                          {trip.femaleOnly && <span title={copy.createTrip.femaleOnlyLabel}><Icon name="venus" size={13} /></span>}
                          {trip.musicAllowed && <span title={copy.createTrip.musicAllowedLabel}><Icon name="music" size={13} /></span>}
                          {trip.petsAllowed && <span title={copy.createTrip.petsAllowedLabel}><Icon name="paw-print" size={13} /></span>}
                          {trip.smokingAllowed && <span title={copy.createTrip.smokingAllowedLabel}><Icon name="cigarette" size={13} /></span>}
                        </div>
                        <div className={`flex items-center gap-1 text-[13px] font-bold px-2.5 py-1 rounded-lg ${isFull ? 'text-[#ba1a1a] bg-red-50' : 'text-[#054752] bg-[#F0F7F8]'}`}>
                          {isFull ? <Icon name="ban" size={13} /> : <Icon name="users" size={13} />}
                          {isFull ? copy.common.noSeats : `${trip.seatsAvailable} left`}
                        </div>
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
  const { language } = useAppStore();
  const copy = I18N[language];

  return (
    <Suspense fallback={<WebLayout title={copy.tripsPage.title}><LoadingState /></WebLayout>}>
      <TripsContent />
    </Suspense>
  );
}


