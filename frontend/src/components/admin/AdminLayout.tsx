'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppStore } from '@/store/useAppStore';
import Footer from '@/components/layout/Footer';

const ADMIN_LAYOUT_I18N = {
  az: {
    adminTitle: 'Yolüstü Admin',
    roleLabel: 'Admin',
    signOut: 'Çıxış',
    tabs: {
      panel: 'Panel',
      users: 'İstifadəçilər',
      trips: 'Gedişlər',
      bookings: 'Rezervlər',
      verifications: 'Təsdiqləmələr',
    },
  },
  ru: {
    adminTitle: 'Админ Yolüstü',
    roleLabel: 'Администратор',
    signOut: 'Выйти',
    tabs: {
      panel: 'Панель',
      users: 'Пользователи',
      trips: 'Поездки',
      bookings: 'Бронирования',
      verifications: 'Документы',
    },
  },
  en: {
    adminTitle: 'Yolüstü Admin',
    roleLabel: 'Administrator',
    signOut: 'Sign out',
    tabs: {
      panel: 'Dashboard',
      users: 'Users',
      trips: 'Trips',
      bookings: 'Bookings',
      verifications: 'Verifications',
    },
  },
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, logout, currentUser } = useAppStore();
  const t = ADMIN_LAYOUT_I18N[language];
  const adminName = currentUser?.fullName || t.adminTitle;
  const adminInitial = adminName.charAt(0).toUpperCase();

  const adminLinks: { href: string; label: string; icon: IconName }[] = [
    { href: ROUTES.admin, label: t.tabs.panel, icon: 'layout-dashboard' },
    { href: ROUTES.adminUsers, label: t.tabs.users, icon: 'users' },
    { href: ROUTES.adminTrips, label: t.tabs.trips, icon: 'map' },
    { href: ROUTES.adminBookings, label: t.tabs.bookings, icon: 'calendar-check' },
    { href: ROUTES.adminVerifications, label: t.tabs.verifications, icon: 'shield-check' },
  ];

  const handleSignOut = async () => {
    await logout();
    router.replace(ROUTES.login);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="shield" size={20} />
            <span className="text-lg font-bold">{t.adminTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                {adminInitial}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-white">{adminName}</span>
                <span className="text-[11px] text-white/70">{t.roleLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Icon name="log-out" size={14} />
              {t.signOut}
            </button>
          </div>
        </div>
      </header>
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive ? 'border-brand-600 text-brand-600' : 'border-transparent text-text-muted hover:text-text-secondary'
                )}
              >
                <Icon name={link.icon} size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6 grow w-full">
        <ProtectedRoute mode="admin">{children}</ProtectedRoute>
      </main>
      <Footer />
    </div>
  );
}
