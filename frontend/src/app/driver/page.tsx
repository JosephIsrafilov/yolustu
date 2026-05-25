'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DriverLayout from '@/components/driver/DriverLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const DASHBOARD_I18N = {
  az: {
    title: 'Sürücü paneli',
    activeRide: 'Aktiv gediş',
    pendingRequest: 'Gözləyən sorğu',
    totalRides: 'Ümumi gediş',
    createBtn: 'Yeni gediş yarat',
    myTripsBtn: 'Gedişlərim',
    requestsBtn: 'Rezerv sorğuları',
    nextStep: 'Növbəti addım',
    requestsWaiting: (count: number) => `${count} rezerv sorğusu gözləyir`,
    noRequests: 'Hazırda gözləyən sorğu yoxdur.',
    viewBtn: 'Bax',
    closestTrip: 'Yaxın aktiv gediş',
    noActiveTrips: 'Aktiv gediş yoxdur. Yeni marşrut paylaşa bilərsiniz.',
    tripsBtn: 'Gedişlər',
    createBtnSmall: 'Yarat',
  },
  ru: {
    title: 'Панель водителя',
    activeRide: 'Активные поездки',
    pendingRequest: 'Ожидающие запросы',
    totalRides: 'Всего поездок',
    createBtn: 'Создать новую поездку',
    myTripsBtn: 'Мои поездки',
    requestsBtn: 'Запросы бронирования',
    nextStep: 'Следующий шаг',
    requestsWaiting: (count: number) => `Ожидает запросов: ${count}`,
    noRequests: 'Нет ожидающих запросов.',
    viewBtn: 'Смотреть',
    closestTrip: 'Ближайшая поездка',
    noActiveTrips: 'Нет активных поездок. Вы можете поделиться новым маршрутом.',
    tripsBtn: 'Поездки',
    createBtnSmall: 'Создать',
  },
  en: {
    title: 'Driver dashboard',
    activeRide: 'Active trips',
    pendingRequest: 'Pending requests',
    totalRides: 'Total trips',
    createBtn: 'Create new trip',
    myTripsBtn: 'My trips',
    requestsBtn: 'Booking requests',
    nextStep: 'Next step',
    requestsWaiting: (count: number) => `${count} booking requests pending`,
    noRequests: 'No pending requests at the moment.',
    viewBtn: 'View',
    closestTrip: 'Upcoming active trip',
    noActiveTrips: 'No active trips. You can share a new route.',
    tripsBtn: 'Trips',
    createBtnSmall: 'Create',
  },
};

export default function DriverDashboardPage() {
  const router = useRouter();
  const { trips, bookings, currentUser, fetchTrips, fetchBookingRequests, language } = useAppStore();
  const myTrips = trips.filter((t) => t.driverId === currentUser?.id);
  const activeTrips = myTrips.filter((t) => t.status === 'active');
  const pendingBookings = bookings.filter((b) => {
    const trip = myTrips.find((t) => t.id === b.tripId);
    return trip && b.status === 'pending';
  });
  const nextTrip = activeTrips
    .slice()
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const nextRequest = pendingBookings[0];
  const nextRequestTrip = nextRequest ? myTrips.find((t) => t.id === nextRequest.tripId) : undefined;

  const copy = DASHBOARD_I18N[language] || DASHBOARD_I18N.en;

  React.useEffect(() => {
    fetchTrips();
    fetchBookingRequests();
  }, [fetchTrips, fetchBookingRequests]);

  return (
    <DriverLayout>
      <ProtectedRoute mode="driver">
        <div className="stagger-children">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <Card padding="md" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100/50 dark:bg-brand-950/30 dark:text-brand-400 dark:border-brand-900/30">
                <Icon name="map" size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted truncate">{copy.activeRide}</p>
                <p className="text-lg sm:text-2xl font-black text-brand-600 mt-0.5 leading-none">{activeTrips.length}</p>
              </div>
            </Card>
            <Card padding="md" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 border border-accent-100/50 dark:bg-accent-950/30 dark:text-accent-400 dark:border-accent-900/30">
                <Icon name="inbox" size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted truncate">{copy.pendingRequest}</p>
                <p className="text-lg sm:text-2xl font-black text-accent-500 mt-0.5 leading-none">{pendingBookings.length}</p>
              </div>
            </Card>
            <Card padding="md" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                <Icon name="car" size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted truncate">{copy.totalRides}</p>
                <p className="text-lg sm:text-2xl font-black text-text mt-0.5 leading-none">{myTrips.length}</p>
              </div>
            </Card>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Button fullWidth size="lg" onClick={() => router.push(ROUTES.createTrip)}>
              <Icon name="plus" size={18} /> {copy.createBtn}
            </Button>
            <Button fullWidth size="lg" variant="outline" onClick={() => router.push(ROUTES.myTrips)}>
              <Icon name="map" size={18} /> {copy.myTripsBtn}
            </Button>
            <Button fullWidth size="lg" variant="secondary" onClick={() => router.push(ROUTES.driverRequests)}>
              <Icon name="inbox" size={18} /> {copy.requestsBtn}
              {pendingBookings.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent-500 text-white text-[10px] font-bold rounded-full">
                  {pendingBookings.length}
                </span>
              )}
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text">{copy.nextStep}</p>
                  {pendingBookings.length > 0 ? (
                    <p className="mt-1 text-sm text-text-secondary">
                      {copy.requestsWaiting(pendingBookings.length)}
                      {nextRequestTrip ? `: ${nextRequestTrip.departureCity} → ${nextRequestTrip.arrivalCity}` : '.'}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-text-secondary">{copy.noRequests}</p>
                  )}
                </div>
                <Button size="sm" variant={pendingBookings.length > 0 ? 'primary' : 'outline'} onClick={() => router.push(ROUTES.driverRequests)}>
                  {copy.viewBtn}
                </Button>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text">{copy.closestTrip}</p>
                  {nextTrip ? (
                    <p className="mt-1 text-sm text-text-secondary">
                      {nextTrip.departureCity} → {nextTrip.arrivalCity} · {nextTrip.date} · {nextTrip.time}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-text-secondary">{copy.noActiveTrips}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push(nextTrip ? ROUTES.myTrips : ROUTES.createTrip)}>
                  {nextTrip ? copy.tripsBtn : copy.createBtnSmall}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    </DriverLayout>
  );
}
