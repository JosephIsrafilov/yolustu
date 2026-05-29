'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import RoleSwitch from '@/components/layout/RoleSwitch';
import { getUserCapabilities } from '@/lib/access-control';
import Footer from '@/components/layout/Footer';
import YolmatesLogo from '@/components/brand/YolmatesLogo';

const DRIVER_LAYOUT_I18N = {
  az: {
    title: 'Sürücü paneli',
    toPassenger: 'Sərnişin rejiminə keç',
    tabs: {
      dashboard: 'Panel',
      createTrip: 'Gediş yarat',
      myTrips: 'Gedişlərim',
      requests: 'Sorğular',
      vehicle: 'Avtomobil',
      documents: 'Sənədlər',
    },
  },
  ru: {
    title: 'Панель водителя',
    toPassenger: 'Перейти в режим пассажира',
    tabs: {
      dashboard: 'Панель',
      createTrip: 'Создать поездку',
      myTrips: 'Мои поездки',
      requests: 'Заявки',
      vehicle: 'Автомобиль',
      documents: 'Документы',
    },
  },
  en: {
    title: 'Driver dashboard',
    toPassenger: 'Switch to passenger mode',
    tabs: {
      dashboard: 'Dashboard',
      createTrip: 'Create trip',
      myTrips: 'My trips',
      requests: 'Requests',
      vehicle: 'Vehicle',
      documents: 'Documents',
    },
  },
} as const;

export default function DriverLayout({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  const pathname = usePathname();
  const { language, currentUser, isAuthenticated, activeMode, switchRole } = useAppStore();
  const t = DRIVER_LAYOUT_I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);

  const navItems: { href: string; label: string; icon: IconName }[] = [
    { href: ROUTES.driverDashboard, label: t.tabs.dashboard, icon: 'layout-dashboard' },
    { href: ROUTES.createTrip, label: t.tabs.createTrip, icon: 'plus' },
    { href: ROUTES.myTrips, label: t.tabs.myTrips, icon: 'map' },
    { href: ROUTES.driverRequests, label: t.tabs.requests, icon: 'inbox' },
    { href: ROUTES.driverVehicle, label: t.tabs.vehicle, icon: 'car' },
    { href: ROUTES.driverDocuments, label: t.tabs.documents, icon: 'shield-check' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f6fafb]">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <YolmatesLogo size="md" />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-text-muted text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <Icon name="car" size={14} />
              </span>
              <span>{t.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {capabilities.canAccessDriverDashboard && <RoleSwitch />}
            {capabilities.canAccessDriverDashboard && activeMode === 'driver' ? (
              <button
                type="button"
                onClick={() => switchRole('passenger')}
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                {t.toPassenger}
              </button>
            ) : (
              <Link href={ROUTES.search} className="text-sm font-semibold text-brand-700 hover:underline">
                {t.toPassenger}
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-text-muted hover:text-text'
                )}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className={cn("mx-auto w-full px-4 py-6 grow", narrow ? "max-w-2xl" : "max-w-6xl")}>{children}</main>
      <Footer />
    </div>
  );
}
