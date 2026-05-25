'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import Icon, { type IconName } from '@/components/ui/Icon';
import { getUserCapabilities } from '@/lib/access-control';

type NavItem = { href: string; label: string; icon: IconName };

export default function BottomNav() {
  const pathname = usePathname();
  const { language, currentUser, isAuthenticated, activeMode } = useAppStore();
  const t = I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);

  if (capabilities.canAccessAdmin) {
    return null;
  }

  const navItems: NavItem[] = [
    { href: ROUTES.search, label: t.header.findRide, icon: 'search' },
    ...(capabilities.canBookRide ? [{ href: ROUTES.bookings, label: t.header.bookings, icon: 'calendar-check' as const }] : []),
    ...(capabilities.canAccessDriverDashboard && activeMode === 'driver' ? [{ href: ROUTES.driverDashboard, label: t.header.driverDashboard, icon: 'car' as const }] : []),
    { href: ROUTES.profile, label: t.profile.title, icon: 'user-circle' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full min-w-0 px-1 rounded-xl overflow-hidden transition-all duration-200 relative',
                isActive
                  ? 'text-brand-600'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <Icon
                name={item.icon}
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0 flex-none transition-all duration-200"
              />
              <span className={cn('w-full h-[14px] leading-[14px] truncate text-center text-[10px] font-medium block', isActive && 'font-semibold')} title={item.label}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-4 h-0.5 rounded-full bg-brand-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
