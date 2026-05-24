'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import { I18N } from '@/lib/i18n';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, currentUser, logout, language } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const copy = I18N[language];

  const navLinks = [
    { label: copy.header.findRide, href: ROUTES.trips, match: '/trips' },
    { label: copy.header.offerRide, href: ROUTES.createTrip, match: '/driver/create-trip' },
    ...(isAuthenticated ? [
      { label: copy.header.driverDashboard, href: ROUTES.driverDashboard, match: '/driver' },
    ] : []),
  ];

  const isActive = (match: string) => {
    if (match === '/driver' && pathname === '/driver/create-trip') return false;
    return pathname === match || pathname.startsWith(match + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#c0c8ca]/70 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1140px] items-center justify-between px-4 md:h-[72px]">
        <div className="flex items-center gap-6 md:gap-8 min-w-0">
          <Link
            href="/"
            className="ui-panel-title flex items-center gap-2 text-[#002f37] transition-all duration-200 ease-out hover:text-[#054752] active:scale-[0.98]"
          >
            <Icon name="map" size={22} strokeWidth={1.8} />
            Yolüstü
          </Link>
          <nav className="hidden h-[72px] items-center gap-6 md:flex min-w-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`ui-nav-text flex h-full items-center border-b-2 px-2 transition-all duration-200 ease-out hover:-translate-y-0.5 whitespace-nowrap ${
                  isActive(link.match)
                    ? 'border-[#002f37] text-[#002f37]'
                    : 'border-transparent text-[#40484a] hover:text-[#054752]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {isAuthenticated && currentUser ? (
            <>
              <Link
                href={ROUTES.bookings}
                className="ui-action-text hidden text-[#40484a] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-[#054752] sm:block"
              >
                {copy.header.bookings}
              </Link>
              {currentUser.role === 'admin' && (
                <Link
                  href={ROUTES.admin}
                  className="ui-action-text hidden text-[#40484a] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-[#054752] sm:block"
                >
                  Admin
                </Link>
              )}
              <Link href={ROUTES.profile} className="flex items-center gap-2 transition-transform duration-200 ease-out active:scale-[0.98]">
                {currentUser.avatarUrl ? (
                  <Image
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full border border-[#c0c8ca] object-cover shadow-sm"
                  />
                ) : (
                  <div className="ui-action-text flex h-8 w-8 items-center justify-center rounded-full bg-[#054752] text-white shadow-sm">
                    {currentUser.fullName.charAt(0)}
                  </div>
                )}
                <span className="ui-label-text hidden text-[#002f37] lg:block">
                  {currentUser.fullName.split(' ')[0]}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-full p-2 text-[#40484a] transition-all duration-200 ease-out hover:bg-[#ffdad6] hover:text-[#ba1a1a] active:scale-[0.96]"
              >
                <Icon name="log-out" size={18} />
              </button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className="ui-action-text hidden rounded-lg px-4 py-2 text-[#002f37] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#edfcff] hover:text-[#054752] active:scale-[0.98] md:block"
              >
                {copy.header.login}
              </Link>
              <Link
                href={ROUTES.register}
                className="ui-action-text rounded-xl bg-[#002f37] px-4 py-2.5 text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#054752] hover:shadow-md active:scale-[0.98]"
              >
                {copy.header.register}
              </Link>
            </>
          )}
          <button
            className="rounded-full p-2 text-[#40484a] transition-all duration-200 ease-out hover:bg-[#edfcff] active:scale-[0.96] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <Icon name="x" size={22} /> : <Icon name="menu" size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-[#c0c8ca] bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`ui-nav-text rounded-lg px-2 py-2 transition-all duration-200 ease-out active:scale-[0.98] ${
                  isActive(link.match) ? 'bg-[#edfcff] text-[#054752]' : 'text-[#40484a] hover:bg-[#edfcff] hover:text-[#054752]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
