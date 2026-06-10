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
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

export default function MyTripsPage() {
  const router = useRouter();
  const { trips, users, currentUser, cancelTrip, completeTrip, fetchTrips, lastError, clearError, language } = useAppStore();
  const [cancelTripId, setCancelTripId] = React.useState<string | null>(null);
  const [completeTripId, setCompleteTripId] = React.useState<string | null>(null);
  const myTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const active = myTrips.filter((t) => t.status === 'active');
  const past = myTrips.filter((t) => t.status !== 'active');

  const copy = I18N[language].myTrips;
  const common = I18N[language].common;

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
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setCancelTripId(trip.id)}>{copy.cancelAction}</Button>
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setCompleteTripId(trip.id)}>{copy.completeAction}</Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" className="w-full" onClick={() => router.push(ROUTES.driverRequests)}>{copy.requestsAction}</Button>
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

          <ConfirmationDialog
            isOpen={cancelTripId !== null}
            onClose={() => setCancelTripId(null)}
            onConfirm={async () => {
              if (cancelTripId) {
                await cancelTrip(cancelTripId);
              }
            }}
            title={
              language === 'az'
                ? 'Səfəri ləğv etmək istəyirsiniz?'
                : language === 'ru'
                ? 'Отменить поездку?'
                : 'Cancel Trip?'
            }
            description={
              language === 'az'
                ? 'Bu səfəri ləğv etmək istədiyinizdən əminsiniz? Sərnişinlərə bildiriş göndəriləcək.'
                : language === 'ru'
                ? 'Вы уверены, что хотите отменить эту поездку? Пассажиры будут уведомлены.'
                : 'Are you sure you want to cancel this trip? Passengers will be notified.'
            }
            confirmLabel={
              language === 'az'
                ? 'Bəli, ləğv et'
                : language === 'ru'
                ? 'Да, отменить'
                : 'Yes, cancel'
            }
            cancelLabel={
              language === 'az'
                ? 'Xeyr'
                : language === 'ru'
                ? 'Нет'
                : 'No'
            }
            variant="danger"
          />

          <ConfirmationDialog
            isOpen={completeTripId !== null}
            onClose={() => setCompleteTripId(null)}
            onConfirm={async () => {
              if (completeTripId) {
                await completeTrip(completeTripId);
              }
            }}
            title={
              language === 'az'
                ? 'Səfəri tamamlamaq istəyirsiniz?'
                : language === 'ru'
                ? 'Завершить поездку?'
                : 'Complete Trip?'
            }
            description={
              language === 'az'
                ? 'Səfərin uğurla başa çatdığını təsdiqləyirsiniz?'
                : language === 'ru'
                ? 'Вы подтверждаете, что поездка успешно завершена?'
                : 'Do you confirm that the trip has been successfully completed?'
            }
            confirmLabel={
              language === 'az'
                ? 'Bəli, tamamla'
                : language === 'ru'
                ? 'Да, завершить'
                : 'Yes, complete'
            }
            cancelLabel={
              language === 'az'
                ? 'Xeyr'
                : language === 'ru'
                ? 'Нет'
                : 'No'
            }
            variant="info"
          />
        </div>
      </ProtectedRoute>
    </DriverLayout>
  );
}
