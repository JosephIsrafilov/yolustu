'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import { I18N } from '@/lib/i18n';
import { getUserCapabilities } from '@/lib/access-control';

const HEADER_MODE_I18N = {
  az: {
    toDriver: 'Sürücü rejiminə keç',
    toPassenger: 'Sərnişin rejiminə keç',
    adminPanel: 'Admin paneli',
  },
  ru: {
    toDriver: 'Перейти в режим водителя',
    toPassenger: 'Перейти в режим пассажира',
    adminPanel: 'Админ-панель',
  },
  en: {
    toDriver: 'Switch to driver mode',
    toPassenger: 'Switch to passenger mode',
    adminPanel: 'Admin panel',
  },
} as const;

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, currentUser, logout, language, activeMode, switchRole } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const copy = I18N[language];
  const modeCopy = HEADER_MODE_I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);
  const isAdmin = capabilities.canAccessAdmin;

  const offerRoute = capabilities.canOfferRide ? ROUTES.createTrip : ROUTES.driverApply;
  const showDriverDashboardLink = capabilities.canAccessDriverDashboard && activeMode === 'passenger';
  const showPassengerSwitch = capabilities.canAccessDriverDashboard && activeMode === 'driver';

  const handleSwitchToPassenger = () => {
    switchRole('passenger');
    router.push(ROUTES.search);
  };

  const handleSwitchToDriver = () => {
    switchRole('driver');
    router.push(ROUTES.driverDashboard);
  };

  const navLinks = !isAdmin
    ? [
        { label: copy.header.findRide, href: ROUTES.trips, match: '/trips' },
        { label: copy.header.offerRide, href: offerRoute, match: '/driver' },
      ]
    : [];

  const isActive = (match: string) => {
    if (match === '/driver' && pathname === '/driver/create-trip') return false;
    return pathname === match || pathname.startsWith(`${match}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#c0c8ca]/70 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1140px] items-center justify-between px-4 md:h-[72px]">
        <div className="min-w-0 flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="ui-panel-title flex items-center gap-2 text-[#002f37] transition-all duration-200 ease-out hover:text-[#054752] active:scale-[0.98]"
          >
            <Icon name="map" size={22} strokeWidth={1.8} />
            Yolüstü
          </Link>
          <nav className="hidden h-[72px] min-w-0 items-center gap-6 md:flex">
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {isAuthenticated && currentUser ? (
            <>
              {!isAdmin && capabilities.canBookRide && (
                <Link
                  href={ROUTES.bookings}
                  className="ui-action-text hidden text-[#40484a] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-[#054752] sm:block"
                >
                  {copy.header.bookings}
                </Link>
              )}
              {showPassengerSwitch && (
                <button
                  type="button"
                  onClick={handleSwitchToPassenger}
                  className="ui-action-text hidden rounded-lg px-3 py-2 text-[#002f37] transition-all duration-200 ease-out hover:bg-[#edfcff] hover:text-[#054752] active:scale-[0.98] lg:block"
                >
                  {modeCopy.toPassenger}
                </button>
              )}
              {!showPassengerSwitch && showDriverDashboardLink && (
                <button
                  type="button"
                  onClick={handleSwitchToDriver}
                  className="ui-action-text hidden rounded-lg px-3 py-2 text-[#002f37] transition-all duration-200 ease-out hover:bg-[#edfcff] hover:text-[#054752] active:scale-[0.98] lg:block"
                >
                  {modeCopy.toDriver}
                </button>
              )}
              {isAdmin && (
                <Link
                  href={ROUTES.admin}
                  className="ui-action-text hidden text-[#40484a] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-[#054752] sm:block"
                >
                  {modeCopy.adminPanel}
                </Link>
              )}
              <Link
                href={isAdmin ? ROUTES.admin : ROUTES.profile}
                className="flex items-center gap-2 transition-transform duration-200 ease-out active:scale-[0.98]"
              >
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
                <span className="ui-label-text hidden text-[#002f37] lg:block">{currentUser.fullName.split(' ')[0]}</span>
              </Link>
              <button
                onClick={() => logout()}
                aria-label={copy.header.logout}
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
            aria-label={copy.header.toggleMenu}
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
            {showPassengerSwitch && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleSwitchToPassenger();
                }}
                className="ui-nav-text text-left rounded-lg px-2 py-2 text-[#002f37] hover:bg-[#edfcff] transition-all"
              >
                {modeCopy.toPassenger}
              </button>
            )}
            {!showPassengerSwitch && showDriverDashboardLink && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleSwitchToDriver();
                }}
                className="ui-nav-text text-left rounded-lg px-2 py-2 text-[#002f37] hover:bg-[#edfcff] transition-all"
              >
                {modeCopy.toDriver}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
