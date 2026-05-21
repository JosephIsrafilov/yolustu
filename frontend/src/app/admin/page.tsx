'use client';

import React from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { adminService } from '@/services';
import type { AdminStats } from '@/services/contracts/admin-service';

const DASHBOARD_I18N = {
  az: {
    title: 'Admin Panel',
    stats: {
      users: 'İstifadəçilər',
      activeTrips: 'Aktiv gedişlər',
      totalBookings: 'Ümumi rezervlər',
      pendingBookings: 'Gözləyən',
      verifications: 'Təsdiqləmələr',
      blockedUsers: 'Bloklanmış',
    },
    sections: {
      moderation: 'Moderasiya',
      blockedCount: (count: number) => `${count} bloklanmış istifadəçi`,
      usersLink: 'İstifadəçilər',
      activeTripsTitle: 'Aktiv gedişlər',
      routesActiveCount: (count: number) => `${count} marşrut hazırda aktivdir`,
      tripsLink: 'Gedişlər',
      bookingRequests: 'Rezerv sorğuları',
      pendingCount: (count: number) => `${count} gözləyən rezerv var`,
      bookingsLink: 'Rezervlər',
    }
  },
  ru: {
    title: 'Панель администратора',
    stats: {
      users: 'Пользователи',
      activeTrips: 'Активные поездки',
      totalBookings: 'Всего броней',
      pendingBookings: 'В ожидании',
      verifications: 'Документы',
      blockedUsers: 'Заблокировано',
    },
    sections: {
      moderation: 'Модерация',
      blockedCount: (count: number) => `Заблокировано пользователей: ${count}`,
      usersLink: 'Пользователи',
      activeTripsTitle: 'Активные поездки',
      routesActiveCount: (count: number) => `Активных маршрутов на данный момент: ${count}`,
      tripsLink: 'Поездки',
      bookingRequests: 'Запросы бронирования',
      pendingCount: (count: number) => `Ожидает бронирования: ${count}`,
      bookingsLink: 'Бронирования',
    }
  },
  en: {
    title: 'Admin Dashboard',
    stats: {
      users: 'Users',
      activeTrips: 'Active Trips',
      totalBookings: 'Total Bookings',
      pendingBookings: 'Pending',
      verifications: 'Verifications',
      blockedUsers: 'Blocked',
    },
    sections: {
      moderation: 'Moderation',
      blockedCount: (count: number) => `${count} blocked user(s)`,
      usersLink: 'Users',
      activeTripsTitle: 'Active Trips',
      routesActiveCount: (count: number) => `${count} route(s) currently active`,
      tripsLink: 'Trips',
      bookingRequests: 'Booking Requests',
      pendingCount: (count: number) => `${count} pending booking(s)`,
      bookingsLink: 'Bookings',
    }
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

  const blockedUsers = users.filter((user) => user.isBlocked);
  const activeTrips = trips.filter((trip) => trip.status === 'active');
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');

  const stats: { label: string; value: number; icon: IconName; color: string }[] = [
    { label: t.stats.users, value: apiStats?.totalUsers ?? users.length, icon: 'users', color: 'text-brand-600' },
    { label: t.stats.activeTrips, value: apiStats?.activeTrips ?? activeTrips.length, icon: 'map', color: 'text-success-500' },
    { label: t.stats.totalBookings, value: apiStats?.totalBookings ?? bookings.length, icon: 'calendar-check', color: 'text-accent-500' },
    { label: t.stats.pendingBookings, value: apiStats?.pendingBookings ?? pendingBookings.length, icon: 'clock', color: 'text-warn-500' },
    { label: t.stats.verifications, value: apiStats?.pendingVerifications ?? 0, icon: 'shield-check', color: 'text-brand-600' },
    { label: t.stats.blockedUsers, value: apiStats?.blockedUsers ?? blockedUsers.length, icon: 'alert-triangle', color: 'text-danger-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-text">{t.title}</h1>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted ${stat.color}`}>
                <Icon name={stat.icon} size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{t.sections.moderation}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {t.sections.blockedCount(apiStats?.blockedUsers ?? blockedUsers.length)}
              </p>
            </div>
            <Link href={ROUTES.adminUsers} className="text-sm font-bold text-brand-600 hover:underline">{t.sections.usersLink}</Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{t.sections.activeTripsTitle}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {t.sections.routesActiveCount(apiStats?.activeTrips ?? activeTrips.length)}
              </p>
            </div>
            <Link href={ROUTES.adminTrips} className="text-sm font-bold text-brand-600 hover:underline">{t.sections.tripsLink}</Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{t.sections.bookingRequests}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {t.sections.pendingCount(apiStats?.pendingBookings ?? pendingBookings.length)}
              </p>
            </div>
            <Link href={ROUTES.adminBookings} className="text-sm font-bold text-brand-600 hover:underline">{t.sections.bookingsLink}</Link>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

