'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Search, CalendarCheck, Plus, UserCircle, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';

const NAV_LINKS = [
  { href: ROUTES.search, label: 'Gediş axtar', icon: Search },
  { href: ROUTES.trips, label: 'Gedişlər', icon: CalendarCheck },
  { href: ROUTES.driverDashboard, label: 'Sürücü paneli', icon: Car },
];

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, currentUser, logout } = useAppStore();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Car size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Yol<span className="text-brand-600">üstü</span>
            </span>
          </Link>

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-text-secondary hover:bg-surface-muted hover:text-text',
                    )}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <>
                {/* Offer ride CTA */}
                <Link href={ROUTES.createTrip} className="hidden sm:block">
                  <Button size="sm">
                    <Plus size={15} /> Gediş yarat
                  </Button>
                </Link>

                {/* Profile dropdown area */}
                <div className="flex items-center gap-2">
                  {currentUser.role === 'admin' && (
                    <Link
                      href={ROUTES.admin}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Shield size={14} />
                      <span className="hidden lg:inline">Admin</span>
                    </Link>
                  )}

                  <Link
                    href={ROUTES.bookings}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      pathname.startsWith('/bookings')
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-text-muted hover:text-text hover:bg-surface-muted',
                    )}
                  >
                    <CalendarCheck size={15} />
                    <span className="hidden lg:inline">Rezervlər</span>
                  </Link>

                  <Link
                    href={ROUTES.profile}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors',
                      pathname.startsWith('/profile')
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-text-secondary hover:bg-surface-muted',
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <span className="hidden lg:inline text-sm font-medium">{currentUser.fullName.split(' ')[0]}</span>
                  </Link>

                  <button
                    onClick={() => { logout(); }}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger-500 hover:bg-red-50 transition-colors"
                    title="Çıxış"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={ROUTES.login}>
                  <Button variant="ghost" size="sm">Daxil ol</Button>
                </Link>
                <Link href={ROUTES.register}>
                  <Button size="sm">Qeydiyyat</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav (shown on small screens for authenticated users) */}
        {isAuthenticated && (
          <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-text-muted hover:bg-surface-muted',
                  )}
                >
                  <Icon size={14} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
