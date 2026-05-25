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
import { formatPrice } from '@/lib/utils';

const DASHBOARD_I18N = {
  az: {
    title: 'Admin Panel',
    subtitle: 'Əsas göstəricilər və son fəaliyyət',
    locale: 'az-AZ',
    kpis: {
      totalUsers: 'İstifadəçilər',
      drivers: 'Sürücülər',
      passengers: 'Sərnişinlər',
      activeTrips: 'Aktiv gedişlər',
      pendingBookings: 'Gözləyən rezervlər',
      completedBookings: 'Tamamlanan rezervlər',
      revenue: 'Gəlir (GMV)',
    },
    quickActions: {
      title: 'Tez əməliyyatlar',
      manageUsers: 'İstifadəçiləri idarə et',
      manageUsersDesc: 'Rol, status və təsdiqləmələri yoxlayın.',
      manageTrips: 'Gedişləri idarə et',
      manageTripsDesc: 'Aktiv marşrutlara və qiymətlərə nəzarət edin.',
      manageBookings: 'Rezervləri idarə et',
      manageBookingsDesc: 'Sorğuları təsdiqləyin və statusları izləyin.',
    },
    recent: {
      title: 'Son fəaliyyət',
      users: 'Son qeydiyyatlar',
      trips: 'Son gedişlər',
      bookings: 'Son rezervlər',
      empty: 'Məlumat yoxdur',
    },
    overview: {
      title: 'Status xülasəsi',
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
    title: 'Панель администратора',
    subtitle: 'Ключевые показатели и последняя активность',
    locale: 'ru-RU',
    kpis: {
      totalUsers: 'Пользователи',
      drivers: 'Водители',
      passengers: 'Пассажиры',
      activeTrips: 'Активные поездки',
      pendingBookings: 'Бронирования в ожидании',
      completedBookings: 'Завершенные бронирования',
      revenue: 'Доход (GMV)',
    },
    quickActions: {
      title: 'Быстрые действия',
      manageUsers: 'Управлять пользователями',
      manageUsersDesc: 'Проверьте роли, статусы и верификацию.',
      manageTrips: 'Управлять поездками',
      manageTripsDesc: 'Контролируйте активные маршруты и цены.',
      manageBookings: 'Управлять бронированиями',
      manageBookingsDesc: 'Подтверждайте заявки и следите за статусом.',
    },
    recent: {
      title: 'Последняя активность',
      users: 'Последние регистрации',
      trips: 'Последние поездки',
      bookings: 'Последние бронирования',
      empty: 'Нет данных',
    },
    overview: {
      title: 'Сводка статусов',
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
    title: 'Admin Dashboard',
    subtitle: 'Key metrics and recent activity',
    locale: 'en-US',
    kpis: {
      totalUsers: 'Total users',
      drivers: 'Drivers',
      passengers: 'Passengers',
      activeTrips: 'Active trips',
      pendingBookings: 'Pending bookings',
      completedBookings: 'Completed bookings',
      revenue: 'Revenue (GMV)',
    },
    quickActions: {
      title: 'Quick actions',
      manageUsers: 'Manage users',
      manageUsersDesc: 'Review roles, status, and verification.',
      manageTrips: 'Manage trips',
      manageTripsDesc: 'Monitor active routes and pricing.',
      manageBookings: 'Manage bookings',
      manageBookingsDesc: 'Confirm requests and track status.',
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
  const { users, trips, bookings } = useAppStore();
  const language = useAppStore((s) => s.language);
  const t = DASHBOARD_I18N[language];
  const [apiStats, setApiStats] = React.useState<AdminStats | null>(null);

  React.useEffect(() => {
    adminService.getAdminStats()
      .then(setApiStats)
      .catch((error) => {
        console.error('Fetch admin stats error:', error);
      });
  }, []);

  const tripsById = React.useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);
  const usersById = React.useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const enrichedBookings = React.useMemo(() => {
    return bookings.map((booking) => {
      const trip = booking.trip ?? tripsById.get(booking.tripId);
      const passenger = booking.passenger ?? usersById.get(booking.passengerId);
      const driver = trip?.driver ?? (trip?.driverId ? usersById.get(trip.driverId) : undefined);
      return { booking, trip, passenger, driver };
    });
  }, [bookings, tripsById, usersById]);

  const totalUsers = apiStats?.totalUsers ?? users.length;
  const drivers = users.filter((user) => user.role === 'driver').length;
  const passengers = users.filter((user) => user.role === 'passenger').length;
  const activeTrips = apiStats?.activeTrips ?? trips.filter((trip) => trip.status === 'active').length;
  const pendingBookings = apiStats?.pendingBookings ?? bookings.filter((booking) => booking.status === 'pending').length;
  const completedBookings = bookings.filter((booking) => booking.status === 'completed').length;

  const revenueTotal = enrichedBookings.reduce((sum, { booking, trip }) => {
    if (!trip) return sum;
    if (booking.status !== 'paid' && booking.status !== 'completed') return sum;
    return sum + trip.pricePerSeat * booking.seatsRequested;
  }, 0);

  const tripStatusCounts = {
    active: trips.filter((trip) => trip.status === 'active').length,
    completed: trips.filter((trip) => trip.status === 'completed').length,
    cancelled: trips.filter((trip) => trip.status === 'cancelled').length,
  };

  const bookingStatusCounts = {
    pending: bookings.filter((booking) => booking.status === 'pending').length,
    accepted: bookings.filter((booking) => booking.status === 'accepted').length,
    cancelled: bookings.filter((booking) => booking.status === 'cancelled').length,
    completed: bookings.filter((booking) => booking.status === 'completed').length,
  };

  const stats: { label: string; value: string | number; icon: IconName; tone: string; bg: string }[] = [
    { label: t.kpis.totalUsers, value: totalUsers, icon: 'users', tone: 'text-brand-700', bg: 'bg-brand-50' },
    { label: t.kpis.drivers, value: drivers, icon: 'car', tone: 'text-brand-700', bg: 'bg-brand-50' },
    { label: t.kpis.passengers, value: passengers, icon: 'user', tone: 'text-brand-700', bg: 'bg-brand-50' },
    { label: t.kpis.activeTrips, value: activeTrips, icon: 'map', tone: 'text-success-600', bg: 'bg-green-50' },
    { label: t.kpis.pendingBookings, value: pendingBookings, icon: 'clock', tone: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t.kpis.completedBookings, value: completedBookings, icon: 'calendar-check', tone: 'text-accent-600', bg: 'bg-brand-50' },
    { label: t.kpis.revenue, value: formatPrice(revenueTotal), icon: 'banknote', tone: 'text-brand-700', bg: 'bg-brand-50' },
  ];

  const quickActions = [
    { href: ROUTES.adminUsers, label: t.quickActions.manageUsers, desc: t.quickActions.manageUsersDesc, icon: 'users' as IconName },
    { href: ROUTES.adminTrips, label: t.quickActions.manageTrips, desc: t.quickActions.manageTripsDesc, icon: 'map' as IconName },
    { href: ROUTES.adminBookings, label: t.quickActions.manageBookings, desc: t.quickActions.manageBookingsDesc, icon: 'calendar-check' as IconName },
  ];

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentBookings = [...enrichedBookings]
    .sort((a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime())
    .slice(0, 3);

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-fade-in">
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

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <p className="text-sm font-bold text-text">{t.quickActions.title}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={action.icon} size={18} />
                  </div>
                  <span className="text-sm font-semibold text-text group-hover:text-brand-700">{action.label}</span>
                </div>
                <p className="mt-2 text-xs text-text-muted leading-4">{action.desc}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold text-text">{t.overview.title}</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-text-muted">{t.overview.trips}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status="active" type="trip" />
                  <span className="text-sm font-semibold text-text">{tripStatusCounts.active}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="completed" type="trip" />
                  <span className="text-sm font-semibold text-text">{tripStatusCounts.completed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="cancelled" type="trip" />
                  <span className="text-sm font-semibold text-text">{tripStatusCounts.cancelled}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted">{t.overview.bookings}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status="pending" />
                  <span className="text-sm font-semibold text-text">{bookingStatusCounts.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="accepted" />
                  <span className="text-sm font-semibold text-text">{bookingStatusCounts.accepted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="cancelled" />
                  <span className="text-sm font-semibold text-text">{bookingStatusCounts.cancelled}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="completed" />
                  <span className="text-sm font-semibold text-text">{bookingStatusCounts.completed}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
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

        <Card>
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
                    <p className="text-sm font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</p>
                    <StatusBadge status={trip.status} type="trip" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold text-text">{t.recent.bookings}</p>
          <div className="mt-4 space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-text-muted">{t.recent.empty}</p>
            ) : (
              recentBookings.map(({ booking, trip, passenger }) => {
                const total = trip ? formatPrice(trip.pricePerSeat * booking.seatsRequested) : t.recent.empty;
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

