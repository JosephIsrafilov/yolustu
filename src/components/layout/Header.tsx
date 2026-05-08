'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { Search, Menu, X, LogOut } from 'lucide-react';

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
    <header className="bg-[#ffffff] border-b border-[#c0c8ca] w-full sticky top-0 z-50" style={{ boxShadow: '0 1px 4px rgba(5,71,82,0.06)' }}>
      <div className="flex justify-between items-center w-full px-6 py-3 max-w-[1140px] mx-auto">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[18px] font-[900] text-[#002f37] tracking-tight leading-6">
            YolUstu
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2 text-[12px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                  isActive(link.match)
                    ? 'text-[#3a6a00] border-b-2 border-[#3a6a00]'
                    : 'text-[#40484a] hover:text-[#3a6a00]'
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
                className="text-[12px] font-bold text-[#40484a] hover:text-[#3a6a00] transition-colors hidden sm:block"
              >
                Rezervlər
              </Link>
              {currentUser.role === 'admin' && (
                <Link href={ROUTES.admin} className="text-[12px] font-bold text-[#40484a] hover:text-[#3a6a00] transition-colors hidden sm:block">
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
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link href={ROUTES.login} className="text-[12px] font-bold text-[#40484a] hover:text-[#3a6a00] transition-colors hidden md:block">
                Daxil ol
              </Link>
              <Link
                href={ROUTES.register}
                className="text-[12px] font-bold text-white bg-[#002f37] px-5 py-2.5 rounded-full hover:bg-[#054752] transition-colors"
              >
                Qeydiyyat
              </Link>
            </>
          )}
          {/* Mobile menu toggle */}
          <button className="md:hidden text-[#40484a]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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
