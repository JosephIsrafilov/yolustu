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

export default function AdminDashboardPage() {
  const { users, trips, bookings } = useAppStore();
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
    { label: 'İstifadəçilər', value: apiStats?.totalUsers ?? users.length, icon: 'users', color: 'text-brand-600' },
    { label: 'Aktiv gedişlər', value: apiStats?.activeTrips ?? activeTrips.length, icon: 'map', color: 'text-success-500' },
    { label: 'Ümumi rezervlər', value: apiStats?.totalBookings ?? bookings.length, icon: 'calendar-check', color: 'text-accent-500' },
    { label: 'Gözləyən', value: apiStats?.pendingBookings ?? pendingBookings.length, icon: 'clock', color: 'text-warn-500' },
    { label: 'Tamamlanmış', value: trips.filter((trip) => trip.status === 'completed').length, icon: 'check-circle', color: 'text-brand-600' },
    { label: 'Bloklanmış', value: apiStats?.blockedUsers ?? blockedUsers.length, icon: 'alert-triangle', color: 'text-danger-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-text">Admin Panel</h1>
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
              <p className="text-sm font-bold text-text">Moderasiya</p>
              <p className="mt-1 text-sm text-text-secondary">{apiStats?.blockedUsers ?? blockedUsers.length} bloklanmış istifadəçi</p>
            </div>
            <Link href={ROUTES.adminUsers} className="text-sm font-bold text-brand-600 hover:underline">İstifadəçilər</Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Aktiv gedişlər</p>
              <p className="mt-1 text-sm text-text-secondary">{apiStats?.activeTrips ?? activeTrips.length} marşrut hazırda aktivdir</p>
            </div>
            <Link href={ROUTES.adminTrips} className="text-sm font-bold text-brand-600 hover:underline">Gedişlər</Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Rezerv sorğuları</p>
              <p className="mt-1 text-sm text-text-secondary">{apiStats?.pendingBookings ?? pendingBookings.length} gözləyən rezerv var</p>
            </div>
            <Link href={ROUTES.adminBookings} className="text-sm font-bold text-brand-600 hover:underline">Rezervlər</Link>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
