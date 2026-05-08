'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, currentUser, logout } = useAppStore();

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant shadow-sm w-full sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-4 py-2 max-w-[1140px] mx-auto">
        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-black text-primary tracking-tight">
            YolUstu
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href={ROUTES.search}
              className={`py-2 text-xs font-bold transition-colors duration-200 ${
                pathname === ROUTES.search || pathname.startsWith('/search')
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-on-surface-variant hover:text-secondary'
              }`}
            >
              Gediş axtar
            </Link>
            <Link
              href={ROUTES.createTrip}
              className={`py-2 text-xs font-bold transition-colors duration-200 ${
                pathname === ROUTES.createTrip
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-on-surface-variant hover:text-secondary'
              }`}
            >
              Gediş təklif et
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href={ROUTES.trips}
                  className={`py-2 text-xs font-bold transition-colors duration-200 ${
                    pathname.startsWith('/trips')
                      ? 'text-secondary border-b-2 border-secondary'
                      : 'text-on-surface-variant hover:text-secondary'
                  }`}
                >
                  Gedişlər
                </Link>
                <Link
                  href={ROUTES.driverDashboard}
                  className={`py-2 text-xs font-bold transition-colors duration-200 ${
                    pathname.startsWith('/driver')
                      ? 'text-secondary border-b-2 border-secondary'
                      : 'text-on-surface-variant hover:text-secondary'
                  }`}
                >
                  Sürücü paneli
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isAuthenticated && currentUser ? (
            <>
              <Link
                href={ROUTES.bookings}
                className="text-xs font-bold text-on-surface-variant hover:text-secondary transition-colors hidden sm:block"
              >
                Rezervlər
              </Link>
              {currentUser.role === 'admin' && (
                <Link
                  href={ROUTES.admin}
                  className="text-xs font-bold text-on-surface-variant hover:text-secondary transition-colors hidden sm:block"
                >
                  Admin
                </Link>
              )}
              <Link href={ROUTES.profile} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="text-sm font-bold text-primary hidden lg:block">
                  {currentUser.fullName.split(' ')[0]}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="text-xs font-bold text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className="text-xs font-bold text-on-surface-variant hover:text-secondary transition-colors hidden md:block"
              >
                Daxil ol
              </Link>
              <Link
                href={ROUTES.register}
                className="text-xs font-bold text-on-primary bg-primary px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Qeydiyyat
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
