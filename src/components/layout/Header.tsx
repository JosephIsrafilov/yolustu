'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, currentUser, logout } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Gediş axtar', href: ROUTES.search, match: '/search' },
    { label: 'Gediş təklif et', href: ROUTES.createTrip, match: '/driver/create-trip' },
    ...(isAuthenticated ? [
      { label: 'Gedişlər', href: ROUTES.trips, match: '/trips' },
      { label: 'Sürücü paneli', href: ROUTES.driverDashboard, match: '/driver' },
    ] : []),
  ];

  const isActive = (match: string) => {
    if (match === '/driver' && pathname === '/driver/create-trip') return false;
    return pathname === match || pathname.startsWith(match + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#c0c8ca] bg-white shadow-sm">
      <div className="mx-auto flex h-[72px] w-full max-w-[1140px] items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[18px] font-black leading-6 tracking-tight text-[#002f37] transition-colors hover:text-[#3a6a00]">
            <Icon name="map" size={22} strokeWidth={1.8} />
            YolUstu
          </Link>
          <nav className="hidden h-[72px] items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex h-full items-center border-b-2 px-2 text-[14px] font-semibold transition-colors duration-200 ${
                  isActive(link.match)
                    ? 'border-[#002f37] text-[#002f37]'
                    : 'border-transparent text-[#40484a] hover:text-[#3a6a00]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-4">
          {isAuthenticated && currentUser ? (
            <>
              <Link
                href={ROUTES.bookings}
                className="hidden text-[12px] font-bold text-[#40484a] transition-colors hover:text-[#3a6a00] sm:block"
              >
                Rezervlər
              </Link>
              {currentUser.role === 'admin' && (
                <Link href={ROUTES.admin} className="hidden text-[12px] font-bold text-[#40484a] transition-colors hover:text-[#3a6a00] sm:block">
                  Admin
                </Link>
              )}
              <Link href={ROUTES.profile} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#054752] flex items-center justify-center text-white text-[13px] font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="text-[14px] font-bold text-[#002f37] hidden lg:block">
                  {currentUser.fullName.split(' ')[0]}
                </span>
              </Link>
              <button onClick={() => logout()} className="text-[#40484a] hover:text-[#ba1a1a] transition-colors">
                <Icon name="log-out" size={18} />
              </button>
            </>
          ) : (
            <>
              <Link href={ROUTES.login} className="hidden px-4 py-2 text-[12px] font-bold text-[#002f37] transition-colors hover:text-[#3a6a00] md:block">
                Daxil ol
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-lg bg-[#002f37] px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#054752]"
              >
                Qeydiyyat
              </Link>
            </>
          )}
          <button className="md:hidden text-[#40484a]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <Icon name="x" size={22} /> : <Icon name="menu" size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#c0c8ca] px-6 py-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={`text-[14px] font-semibold py-1 ${isActive(link.match) ? 'text-[#3a6a00]' : 'text-[#40484a]'}`}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
