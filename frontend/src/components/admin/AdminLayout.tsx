'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ADMIN_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: ROUTES.admin, label: 'Panel', icon: 'layout-dashboard' },
  { href: ROUTES.adminUsers, label: 'İstifadəçilər', icon: 'users' },
  { href: ROUTES.adminTrips, label: 'Gedişlər', icon: 'map' },
  { href: ROUTES.adminBookings, label: 'Rezervlər', icon: 'calendar-check' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-surface-dim">
      <header className="bg-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="shield" size={20} />
            <span className="text-lg font-bold">Yolüstü Admin</span>
          </div>
          <Link href={ROUTES.search} className="text-sm text-brand-200 hover:text-white transition-colors">
            ← Tətbiqə qayıt
          </Link>
        </div>
      </header>
      <nav className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {ADMIN_LINKS.map((link) => {
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
