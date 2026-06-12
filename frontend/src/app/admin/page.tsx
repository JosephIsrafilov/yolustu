'use client';

import React from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { adminService } from '@/services';
import type { AdminStats } from '@/services/contracts/admin-service';
import type { User, Trip, Booking } from '@/types';
import Button from '@/components/ui/Button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { formatCurrency } from '@/lib/utils';
import LoadingState from '@/components/ui/LoadingState';

const DASHBOARD_I18N = {
  az: {
    title: 'İdarə paneli',
    subtitle: 'Əsas göstəricilər və son fəaliyyət',
    locale: 'az-AZ',
    kpis: {
      totalUsers: 'Ümumi istifadəçilər',
      drivers: 'Sürücülər',
      passengers: 'Sərnişinlər',
      activeTrips: 'Aktiv gedişlər',
      pendingBookings: 'Gözləyən rezervlər',
      completedBookings: 'Tamamlanmış rezervlər',
      pendingVerifications: 'Gözləyən təsdiqləmələr',
      revenue: 'Gəlir',
    },
    quickActions: {
      title: 'Sürətli əməliyyatlar',
      manageUsers: 'İstifadəçiləri idarə et',
      manageUsersDesc: 'İstifadəçi rollarını, statuslarını və təsdiqləmələrini idarə edin.',
      manageTrips: 'Gedişləri idarə et',
      manageTripsDesc: 'Aktiv marşrutlara və qiymətlərə nəzarət edin.',
      manageBookings: 'Rezervləri idarə et',
      manageBookingsDesc: 'Rezerv sorğularını təsdiqləyin və izləyin.',
      reviewDrivers: 'Sürücüləri yoxla',
      reviewDriversDesc: 'Gözləyən sürücü təsdiqləmə sorğularını yoxlayın.',
    },
    recent: {
      title: 'Son aktivlik',
      users: 'Yeni istifadəçilər',
      trips: 'Son gedişlər',
      bookings: 'Son rezervlər',
      empty: 'Son aktivlik yoxdur',
    },
    overview: {
      title: 'Status icmalı',
      trips: 'Gedişlər',
      bookings: 'Rezervlər',
    },
    roles: {
      driver: 'Sürücü',
      passenger: 'Sərnişin',
      admin: 'Admin',
    },
    labels: {
      seats: 'yer',
      total: 'Cəmi',
    },
  },
  ru: {
    title: 'Панель управления',
    subtitle: 'Ключевые показатели и последняя активность',
    locale: 'ru-RU',
    kpis: {
      totalUsers: 'Всего пользователей',
      drivers: 'Водители',
      passengers: 'Пассажиры',
      activeTrips: 'Активные поездки',
      pendingBookings: 'Ожидающие бронирования',
      completedBookings: 'Завершённые бронирования',
      pendingVerifications: 'Ожидающие верификации',
      revenue: 'Выручка',
    },
    quickActions: {
      title: 'Быстрые действия',
      manageUsers: 'Управление пользователями',
      manageUsersDesc: 'Управление ролями пользователей, статусами и верификацией.',
      manageTrips: 'Управление поездками',
      manageTripsDesc: 'Контролируйте активные маршруты и цены.',
      manageBookings: 'Управление бронированиями',
      manageBookingsDesc: 'Подтверждайте заявки и следите за статусом.',
      reviewDrivers: 'Проверка водителей',
      reviewDriversDesc: 'Проверьте ожидающие запросы на верификацию водителей.',
    },
    recent: {
      title: 'Последняя активность',
      users: 'Новые пользователи',
      trips: 'Последние поездки',
      bookings: 'Последние бронирования',
      empty: 'Нет последней активности',
    },
    overview: {
      title: 'Обзор статусов',
      trips: 'Поездки',
      bookings: 'Бронирования',
    },
    roles: {
      driver: 'Водитель',
      passenger: 'Пассажир',
      admin: 'Админ',
    },
    labels: {
      seats: 'мест',
      total: 'Итого',
    },
  },
  en: {
    title: 'Dashboard',
    subtitle: 'Key metrics and recent activity',
    locale: 'en-US',
    kpis: {
      totalUsers: 'Total users',
      drivers: 'Drivers',
      passengers: 'Passengers',
      activeTrips: 'Active trips',
      pendingBookings: 'Pending bookings',
      completedBookings: 'Completed bookings',
      pendingVerifications: 'Pending verifications',
      revenue: 'Revenue',
    },
    quickActions: {
      title: 'Quick actions',
      manageUsers: 'Manage users',
      manageUsersDesc: 'Review roles, status, and verification.',
      manageTrips: 'Manage trips',
      manageTripsDesc: 'Monitor active routes and pricing.',
      manageBookings: 'Manage bookings',
      manageBookingsDesc: 'Confirm requests and track status.',
      reviewDrivers: 'Review pending drivers',
      reviewDriversDesc: 'Review pending driver verification requests.',
    },
    recent: {
      title: 'Recent activity',
      users: 'Recent users',
      trips: 'Recent trips',
      bookings: 'Recent bookings',
      empty: 'No recent activity',
    },
    overview: {
      title: 'Status overview',
      trips: 'Trips',
      bookings: 'Bookings',
    },
    roles: {
      driver: 'Driver',
      passenger: 'Passenger',
      admin: 'Admin',
    },
    labels: {
      seats: 'seats',
      total: 'Total',
    },
  }
} as const;

export default function AdminDashboardPage() {
  const language = useAppStore((s) => s.language);
  const t = DASHBOARD_I18N[language];
  
  const [usersList, setUsersList] = React.useState<User[]>([]);
  const [tripsList, setTripsList] = React.useState<Trip[]>([]);
  const [bookingsList, setBookingsList] = React.useState<Booking[]>([]);
  const [apiStats, setApiStats] = React.useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const { setActiveToast } = usePushNotifications();

  const fetchData = () => {
    Promise.all([
      adminService.getUsers({ page: 1, limit: 100 }).catch(() => {
        return { items: [] };
      }),
      adminService.getTrips(1, 100).catch(() => {
        return { items: [] };
      }),
      adminService.getBookings(1, 100).catch(() => {
        return { items: [] };
      }),
      adminService.getAdminStats().catch(() => {
        return null;
      }),
    ]).then(([usersRes, tripsRes, bookingsRes, statsRes]) => {
      setUsersList(usersRes.items);
      setTripsList(tripsRes.items);
      setBookingsList(bookingsRes.items);
      setApiStats(statsRes);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateJourney = async () => {
    setIsSimulating(true);
    try {
      const res = await adminService.simulateJourney();
      setActiveToast({
        type: 'notification',
        title: 'Success',
        body: res.message,
        data: {}
      });
      fetchData(); // Refresh data
    } catch (err) {
      setActiveToast({
        type: 'notification',
        title: 'Error',
        body: 'Failed to simulate journey',
        data: {}
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const tripsById = React.useMemo(() => new Map(tripsList.map((trip) => [trip.id, trip])), [tripsList]);
  const usersById = React.useMemo(() => new Map(usersList.map((user) => [user.id, user])), [usersList]);

  const enrichedBookings = React.useMemo(() => {
    return bookingsList.map((booking) => {
      const trip = booking.trip ?? tripsById.get(booking.tripId);
      const passenger = booking.passenger ?? usersById.get(booking.passengerId);
      const driver = trip?.driver ?? (trip?.driverId ? usersById.get(trip.driverId) : undefined);
      return { booking, trip, passenger, driver };
    });
  }, [bookingsList, tripsById, usersById]);

  const totalUsers = apiStats?.totalUsers ?? usersList.length;
  const drivers = usersList.filter((user) => user.role === 'driver').length;
  const passengers = usersList.filter((user) => user.role === 'passenger').length;
  const activeTrips = apiStats?.activeTrips ?? tripsList.filter((trip) => trip.status === 'active').length;
  const pendingBookings = apiStats?.pendingBookings ?? bookingsList.filter((booking) => booking.status === 'pending').length;
  const completedBookings = bookingsList.filter((booking) => booking.status === 'completed').length;
  const pendingVerifications = apiStats?.pendingVerifications ?? usersList.filter((user) => user.verificationStatus === 'pending').length;

  const revenueTotal = enrichedBookings.reduce((sum, { booking, trip }) => {
    if (!trip) return sum;
    if (booking.status !== 'paid' && booking.status !== 'completed' && booking.status !== 'accepted') return sum;
    return sum + trip.pricePerSeat * booking.seatsRequested;
  }, 0);

  const tripStatusCounts = {
    active: tripsList.filter((trip) => trip.status === 'active').length,
    completed: tripsList.filter((trip) => trip.status === 'completed').length,
    cancelled: tripsList.filter((trip) => trip.status === 'cancelled').length,
  };

  const bookingStatusCounts = {
    pending: bookingsList.filter((booking) => booking.status === 'pending').length,
    accepted: bookingsList.filter((booking) => booking.status === 'accepted').length,
    cancelled: bookingsList.filter((booking) => booking.status === 'cancelled').length,
    completed: bookingsList.filter((booking) => booking.status === 'completed').length,
  };

  const stats: { label: string; value: string | number; icon: IconName; tone: string; bg: string }[] = [
    { label: t.kpis.totalUsers, value: totalUsers, icon: 'users', tone: 'text-brand-700', bg: 'bg-brand-50' },
    { label: t.kpis.drivers, value: drivers, icon: 'car', tone: 'text-brand-700', bg: 'bg-brand-50' },
    { label: t.kpis.passengers, value: passengers, icon: 'user', tone: 'text-brand-700', bg: 'bg-brand-50' },
    { label: t.kpis.activeTrips, value: activeTrips, icon: 'map', tone: 'text-success-600', bg: 'bg-green-50' },
    { label: t.kpis.pendingBookings, value: pendingBookings, icon: 'clock', tone: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t.kpis.completedBookings, value: completedBookings, icon: 'calendar-check', tone: 'text-accent-600', bg: 'bg-brand-50' },
    { label: t.kpis.pendingVerifications, value: pendingVerifications, icon: 'shield-check', tone: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t.kpis.revenue, value: formatCurrency(revenueTotal), icon: 'banknote', tone: 'text-brand-700', bg: 'bg-brand-50' },
  ];

  const quickActions = [
    { href: ROUTES.adminUsers, label: t.quickActions.manageUsers, desc: t.quickActions.manageUsersDesc, icon: 'users' as IconName },
    { href: ROUTES.adminTrips, label: t.quickActions.manageTrips, desc: t.quickActions.manageTripsDesc, icon: 'map' as IconName },
    { href: ROUTES.adminBookings, label: t.quickActions.manageBookings, desc: t.quickActions.manageBookingsDesc, icon: 'calendar-check' as IconName },
    { 
      href: ROUTES.adminVerifications, 
      label: t.quickActions.reviewDrivers, 
      desc: t.quickActions.reviewDriversDesc, 
      icon: 'shield-check' as IconName,
      badge: pendingVerifications > 0 ? pendingVerifications : undefined
    },
  ];

  const recentUsers = [...usersList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentTrips = [...tripsList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentBookings = [...enrichedBookings]
    .sort((a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <LoadingState />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label} 
            className="animate-fade-in hover:shadow-md hover:border-brand-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.bg} ${stat.tone}`}>
                <Icon name={stat.icon} size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text">{t.quickActions.title}</p>
            <Button size="sm" variant="outline" onClick={handleSimulateJourney} loading={isSimulating}>
              <Icon name="zap" size={16} /> <span className="ml-1 hidden sm:inline">Simulate Journey</span>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                {action.badge !== undefined && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse">
                    {action.badge}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon name={action.icon} size={18} />
                    </div>
                    <span className="text-sm font-semibold text-text group-hover:text-brand-700">{action.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted leading-4">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-text mb-4">{t.overview.title}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t.overview.trips}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-2 border border-border">
                    <StatusBadge status="active" type="trip" />
                    <span className="text-base font-bold text-text mt-1">{tripStatusCounts.active}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-2 border border-border">
                    <StatusBadge status="completed" type="trip" />
                    <span className="text-base font-bold text-text mt-1">{tripStatusCounts.completed}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-2 border border-border">
                    <StatusBadge status="cancelled" type="trip" />
                    <span className="text-base font-bold text-text mt-1">{tripStatusCounts.cancelled}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t.overview.bookings}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-1.5 border border-border">
                    <StatusBadge status="pending" />
                    <span className="text-sm font-bold text-text mt-1">{bookingStatusCounts.pending}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-1.5 border border-border">
                    <StatusBadge status="accepted" />
                    <span className="text-sm font-bold text-text mt-1">{bookingStatusCounts.accepted}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-1.5 border border-border">
                    <StatusBadge status="cancelled" />
                    <span className="text-sm font-bold text-text mt-1">{bookingStatusCounts.cancelled}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-surface-muted/50 p-1.5 border border-border">
                    <StatusBadge status="completed" />
                    <span className="text-sm font-bold text-text mt-1">{bookingStatusCounts.completed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="hover:shadow-sm transition-all duration-200">
          <p className="text-sm font-bold text-text">{t.recent.users}</p>
          <div className="mt-4 space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-text-muted">{t.recent.empty}</p>
            ) : (
              recentUsers.map((user) => {
                const roleLabel = t.roles[user.role];
                const roleVariant = user.role === 'admin' ? 'warning' : user.role === 'driver' ? 'brand' : 'muted';
                return (
                  <div key={user.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{user.fullName}</p>
                      <p className="text-xs text-text-muted">{new Date(user.createdAt).toLocaleDateString(t.locale)}</p>
                    </div>
                    <Badge variant={roleVariant}>{roleLabel}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="hover:shadow-sm transition-all duration-200">
          <p className="text-sm font-bold text-text">{t.recent.trips}</p>
          <div className="mt-4 space-y-3">
            {recentTrips.length === 0 ? (
              <p className="text-sm text-text-muted">{t.recent.empty}</p>
            ) : (
              recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{trip.departureCity} → {trip.arrivalCity}</p>
                    <p className="text-xs text-text-muted">{trip.date} · {trip.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-600">{formatCurrency(trip.pricePerSeat)}</p>
                    <StatusBadge status={trip.status} type="trip" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="hover:shadow-sm transition-all duration-200">
          <p className="text-sm font-bold text-text">{t.recent.bookings}</p>
          <div className="mt-4 space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-text-muted">{t.recent.empty}</p>
            ) : (
              recentBookings.map(({ booking, trip, passenger }) => {
                const total = trip ? formatCurrency(trip.pricePerSeat * booking.seatsRequested) : t.recent.empty;
                return (
                  <div key={booking.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{passenger?.fullName || t.recent.empty}</p>
                      <p className="text-xs text-text-muted">
                        {trip ? `${trip.departureCity} → ${trip.arrivalCity}` : t.recent.empty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-600">{total}</p>
                      <p className="text-xs text-text-muted">{booking.seatsRequested} {t.labels.seats}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

