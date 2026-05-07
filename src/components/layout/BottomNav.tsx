'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, CalendarCheck, Car, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

const NAV_ITEMS = [
  { href: ROUTES.search, label: 'Axtar', icon: Search },
  { href: ROUTES.bookings, label: 'Rezervlər', icon: CalendarCheck },
  { href: ROUTES.driverDashboard, label: 'Sür', icon: Car },
  { href: ROUTES.profile, label: 'Profil', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-brand-600'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-all duration-200"
              />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
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
