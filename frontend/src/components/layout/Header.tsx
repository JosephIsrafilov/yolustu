'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import { I18N } from '@/lib/i18n';
import { getUserCapabilities } from '@/lib/access-control';
import UserAvatar from '@/components/ui/UserAvatar';
import YolmatesLogo from '@/components/brand/YolmatesLogo';

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
  const isLandingPage = pathname === '/';

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
        { label: language === 'en' ? 'Find Ride' : copy.header.findRide, href: ROUTES.trips, match: '/trips' },
        { label: language === 'en' ? 'Offer Ride' : copy.header.offerRide, href: offerRoute, match: '/driver' },
      ]
    : [];

  const isActive = (match: string) => {
    if (match === '/driver' && pathname === '/driver/create-trip') return false;
    return pathname === match || pathname.startsWith(`${match}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid h-[54px] w-full max-w-[1088px] grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="min-w-0 justify-self-start">
          <YolmatesLogo size="md" />
        </div>

        <nav className="hidden min-w-0 items-center gap-9 justify-self-center md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors whitespace-nowrap hover-underline-expand pb-1 ${
                !isLandingPage && isActive(link.match)
                  ? 'text-foreground font-semibold after:scale-x-100 after:origin-bottom-left'
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 justify-self-end">
          {isAuthenticated && currentUser ? (
            <>
              {!isAdmin && capabilities.canBookRide && (
                <Link
                  href={ROUTES.bookings}
                  className={`hidden text-sm font-medium transition-colors hover-underline-expand pb-1 sm:block ${
                    isActive(ROUTES.bookings)
                      ? 'text-foreground font-semibold after:scale-x-100 after:origin-bottom-left'
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {copy.header.bookings}
                </Link>
              )}
              {showPassengerSwitch && (
                <button
                  type="button"
                  onClick={handleSwitchToPassenger}
                  className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.98] lg:block"
                >
                  {modeCopy.toPassenger}
                </button>
              )}
              {!showPassengerSwitch && showDriverDashboardLink && (
                <button
                  type="button"
                  onClick={handleSwitchToDriver}
                  className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent active:scale-[0.98] lg:block"
                >
                  {modeCopy.toDriver}
                </button>
              )}
              {isAdmin && (
                <Link
                  href={ROUTES.admin}
                  className={`hidden text-sm font-medium transition-colors hover-underline-expand pb-1 sm:block ${
                    isActive(ROUTES.admin)
                      ? 'text-foreground font-semibold after:scale-x-100 after:origin-bottom-left'
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {modeCopy.adminPanel}
                </Link>
              )}
              <Link
                href={isAdmin ? ROUTES.admin : ROUTES.profile}
                className="flex items-center gap-2 transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <UserAvatar 
                  name={currentUser.fullName} 
                  avatarUrl={currentUser.avatarUrl} 
                  size={30} 
                  className="shadow-sm"
                  fallbackClassName="text-xs font-semibold bg-primary text-primary-foreground"
                />
                <span className="hidden text-sm font-medium text-foreground lg:block">{currentUser.fullName.split(' ')[0]}</span>
              </Link>
              <button
                onClick={() => logout()}
                aria-label={copy.header.logout}
                className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
              >
                <Icon name="log-out" size={18} />
              </button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary active:scale-[0.98] md:block"
              >
                {copy.header.login}
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-teal-600 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              >
                {copy.header.register}
              </Link>
            </>
          )}
          <button
            aria-label={copy.header.toggleMenu}
            className="rounded-full p-2 text-foreground/80 transition-colors hover:bg-accent active:scale-[0.96] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <Icon name="x" size={22} /> : <Icon name="menu" size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-border bg-background px-6 py-4 md:hidden">
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
