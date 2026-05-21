'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppStore } from '@/store/useAppStore';

const ADMIN_LAYOUT_I18N = {
  az: {
    backToApp: '← Tətbiqə qayıt',
    adminTitle: 'Yolüstü Admin',
    tabs: {
      panel: 'Panel',
      users: 'İstifadəçilər',
      trips: 'Gedişlər',
      bookings: 'Rezervlər',
      verifications: 'Təsdiqləmələr',
    }
  },
  ru: {
    backToApp: '← Вернуться в приложение',
    adminTitle: 'Админ Yolüstü',
    tabs: {
      panel: 'Панель',
      users: 'Пользователи',
      trips: 'Поездки',
      bookings: 'Бронирования',
      verifications: 'Документы',
    }
  },
  en: {
    backToApp: '← Back to App',
    adminTitle: 'Yolüstü Admin',
    tabs: {
      panel: 'Dashboard',
      users: 'Users',
      trips: 'Trips',
      bookings: 'Bookings',
      verifications: 'Verifications',
    }
  }
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const language = useAppStore((s) => s.language);
  const t = ADMIN_LAYOUT_I18N[language];

  const adminLinks: { href: string; label: string; icon: IconName }[] = [
    { href: ROUTES.admin, label: t.tabs.panel, icon: 'layout-dashboard' },
    { href: ROUTES.adminUsers, label: t.tabs.users, icon: 'users' },
    { href: ROUTES.adminTrips, label: t.tabs.trips, icon: 'map' },
    { href: ROUTES.adminBookings, label: t.tabs.bookings, icon: 'calendar-check' },
    { href: ROUTES.adminVerifications, label: t.tabs.verifications, icon: 'shield-check' },
  ];

  return (
    <div className="min-h-screen bg-surface-dim">
      <header className="bg-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="shield" size={20} />
            <span className="text-lg font-bold">{t.adminTitle}</span>
          </div>
          <Link href={ROUTES.search} className="text-sm text-brand-200 hover:text-white transition-colors">
            {t.backToApp}
          </Link>
        </div>
      </header>
      <nav className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive ? 'border-brand-600 text-brand-600' : 'border-transparent text-text-muted hover:text-text-secondary',
                )}>
                <Icon name={link.icon} size={16} />{link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <ProtectedRoute mode="admin">{children}</ProtectedRoute>
      </main>
    </div>
  );
}

