'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';

export default function AdminDashboardPage() {
  const { users, trips, bookings } = useAppStore();

  const stats: { label: string; value: number; icon: IconName; color: string }[] = [
    { label: 'İstifadəçilər', value: users.length, icon: 'users', color: 'text-brand-600' },
    { label: 'Aktiv gedişlər', value: trips.filter((t) => t.status === 'active').length, icon: 'map', color: 'text-success-500' },
    { label: 'Ümumi rezervlər', value: bookings.length, icon: 'calendar-check', color: 'text-accent-500' },
    { label: 'Gözləyən', value: bookings.filter((b) => b.status === 'pending').length, icon: 'clock', color: 'text-warn-500' },
    { label: 'Tamamlanmış', value: trips.filter((t) => t.status === 'completed').length, icon: 'check-circle', color: 'text-brand-600' },
    { label: 'Bloklanmış', value: users.filter((u) => u.isBlocked).length, icon: 'alert-triangle', color: 'text-danger-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-text mb-6">Admin Panel</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center ${s.color}`}>
                <Icon name={s.icon} size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
