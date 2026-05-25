'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DriverLayout from '@/components/driver/DriverLayout';
import TripCard from '@/components/trips/TripCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { I18N } from '@/lib/i18n';

export default function MyTripsPage() {
  const router = useRouter();
  const { trips, users, currentUser, cancelTrip, completeTrip, fetchTrips, lastError, clearError, language, unreadRides } = useAppStore();
  const myTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const active = myTrips.filter((t) => t.status === 'active');
  const past = myTrips.filter((t) => t.status !== 'active');

  const copy = I18N[language].myTrips;
  const common = I18N[language].common;
  const tripDetailsCopy = I18N[language].tripDetails;

  React.useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return (
    <DriverLayout>
      <ProtectedRoute mode="driver">
        {lastError && (
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
            <div className="flex items-center justify-between gap-3">
              <span>{lastError}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
            </div>
          </div>
        )}
        <div className="stagger-children">
          <Button variant="secondary" className="mb-6" onClick={() => router.push(ROUTES.createTrip)}>
            <Icon name="plus" size={16} /> {copy.createAction}
          </Button>

          {active.length > 0 && (
            <>
              <h3 className="mb-3 text-lg font-semibold text-text">{copy.activeTrips}</h3>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((trip) => (
                  <div key={trip.id}>
                    <TripCard trip={trip} driver={trip.driver ?? users.find((user) => user.id === trip.driverId)} compact />
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => cancelTrip(trip.id)}>{copy.cancelAction}</Button>
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => completeTrip(trip.id)}>{copy.completeAction}</Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" className="flex-1" onClick={() => router.push(ROUTES.driverRequests)}>{copy.requestsAction}</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 relative flex items-center justify-center gap-1.5"
                          onClick={() => router.push(ROUTES.tripDetails(trip.id) + '/chat')}
                        >
                          <Icon name="message-square" size={14} className="shrink-0" />
                          <span>{tripDetailsCopy.chatAction}</span>
                          {(unreadRides || {})[trip.id] && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h3 className="mb-3 text-lg font-semibold text-text">{copy.pastTrips}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((trip) => <TripCard key={trip.id} trip={trip} compact />)}
              </div>
            </>
          )}

          {myTrips.length === 0 && (
            <EmptyState
              icon={<Icon name="map" size={28} />}
              title={copy.emptyTrips}
              action={<Button onClick={() => router.push(ROUTES.createTrip)}>{copy.createBtn}</Button>}
            />
          )}
        </div>
      </ProtectedRoute>
    </DriverLayout>
  );
}
