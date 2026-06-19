'use client';

import { useState } from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { paymentsService } from '@/services';
import { formatPrice } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import Icon from '@/components/ui/Icon';
import { I18N } from '@/lib/i18n';
import { getUserCapabilities } from '@/lib/access-control';
import UserAvatar from '@/components/ui/UserAvatar';
import YolmatesLogo from '@/components/brand/YolmatesLogo';
import RoleSwitch from '@/components/layout/RoleSwitch';

const HEADER_MODE_I18N = {
  az: {
    adminPanel: 'Admin paneli',
    wallet: 'Balans',
    driverDashboard: 'Surucu paneli',
  },
  ru: {
    adminPanel: 'Админ-панель',
    wallet: 'Кошелек',
    driverDashboard: 'Панель водителя',
  },
  en: {
    adminPanel: 'Admin panel',
    wallet: 'Wallet',
    driverDashboard: 'Driver dashboard',
  },
} as const;

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, currentUser, logout, language, activeMode } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const copy = I18N[language];
  const modeCopy = HEADER_MODE_I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);
  const isAdmin = capabilities.canAccessAdmin;
  const isLandingPage = pathname === '/';

  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet', currentUser?.id],
    queryFn: () => paymentsService.getWallet(),
    enabled: !!isAuthenticated && !!currentUser && !isAdmin,
  });
  const walletBalance = wallet?.availableBalance;

  const getBecomeDriverText = (lang: string) => {
    if (lang === 'az') return 'Surucu olmaq';
    if (lang === 'ru') return 'Стать водителем';
    return 'Become a driver';
  };

  const navLinks = isAdmin
    ? []
    : activeMode === 'driver' && capabilities.canAccessDriverDashboard
    ? [
        { label: modeCopy.driverDashboard, href: ROUTES.driverDashboard, match: '/driver' },
        { label: language === 'en' ? 'Offer Ride' : copy.header.offerRide, href: ROUTES.createTrip, match: '/driver/create-trip' },
      ]
    : [
        { label: language === 'en' ? 'Find Ride' : copy.header.findRide, href: ROUTES.trips, match: '/trips' },
        ...(isAuthenticated ? [{ label: copy.header.bookings, href: ROUTES.bookings, match: '/bookings' }] : []),
        ...(!capabilities.canAccessDriverDashboard ? [{ label: getBecomeDriverText(language), href: ROUTES.driverApply, match: '/driver' }] : []),
      ];

  const isActive = (match: string) => {
    if (match === '/driver' && pathname === '/driver/create-trip') return false;
    return pathname === match || pathname.startsWith(`${match}/`);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    router.replace(ROUTES.login);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[56px] w-full max-w-[1160px] items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <div className="min-w-0 justify-self-start">
          <YolmatesLogo size="md" />
        </div>

        <nav className="hidden min-w-0 items-center gap-7 justify-self-center md:flex">
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

        <div className="flex shrink-0 items-center gap-4 justify-self-end">
          {isAuthenticated && currentUser ? (
            <>
              {!isAdmin && (
                <Link
                  href={ROUTES.wallet}
                  className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:block ${
                    isActive(ROUTES.wallet) ? 'bg-surface-muted text-foreground' : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground'
                  }`}
                >
                  {isWalletLoading || walletBalance === undefined ? (
                    <span className="inline-block h-4 w-12 animate-pulse rounded bg-accent/60" />
                  ) : (
                    <span className="font-bold">{activeMode === 'driver' ? `${modeCopy.wallet}: ${formatPrice(walletBalance)}` : formatPrice(walletBalance)}</span>
                  )}
                </Link>
              )}

              {capabilities.canAccessDriverDashboard && <div className="hidden lg:block"><RoleSwitch /></div>}

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
                onClick={handleLogout}
                aria-label={copy.header.logout}
                className="hidden rounded-full p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96] sm:block"
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

            {!isAdmin && isAuthenticated && (
              <Link
                href={ROUTES.wallet}
                onClick={() => setMobileOpen(false)}
                className={`ui-nav-text rounded-lg px-2 py-2 transition-all duration-200 ease-out active:scale-[0.98] ${
                  isActive(ROUTES.wallet) ? 'bg-[#edfcff] text-[#054752]' : 'text-[#40484a] hover:bg-[#edfcff] hover:text-[#054752]'
                }`}
              >
                {modeCopy.wallet}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                href={isAdmin ? ROUTES.admin : ROUTES.profile}
                onClick={() => setMobileOpen(false)}
                className={`ui-nav-text rounded-lg px-2 py-2 transition-all duration-200 ease-out active:scale-[0.98] ${
                  isActive(isAdmin ? ROUTES.admin : ROUTES.profile) ? 'bg-[#edfcff] text-[#054752]' : 'text-[#40484a] hover:bg-[#edfcff] hover:text-[#054752]'
                }`}
              >
                {copy.profile?.title || 'Profile'}
              </Link>
            )}

            {capabilities.canAccessDriverDashboard && (
              <div className="pt-2">
                <RoleSwitch />
              </div>
            )}

            {!isAuthenticated && (
              <>
                <Link
                  href={ROUTES.login}
                  onClick={() => setMobileOpen(false)}
                  className={`ui-nav-text rounded-lg px-2 py-2 transition-all duration-200 ease-out active:scale-[0.98] ${
                    isActive(ROUTES.login) ? 'bg-[#edfcff] text-[#054752]' : 'text-[#40484a] hover:bg-[#edfcff] hover:text-[#054752]'
                  }`}
                >
                  {copy.header.login}
                </Link>
                <Link
                  href={ROUTES.register}
                  onClick={() => setMobileOpen(false)}
                  className={`ui-nav-text rounded-lg px-2 py-2 transition-all duration-200 ease-out active:scale-[0.98] ${
                    isActive(ROUTES.register) ? 'bg-[#edfcff] text-[#054752]' : 'text-[#40484a] hover:bg-[#edfcff] hover:text-[#054752]'
                  }`}
                >
                  {copy.header.register}
                </Link>
              </>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="ui-nav-text mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-red-600 transition-all hover:bg-red-50"
              >
                <Icon name="log-out" size={18} />
                <span>{copy.header.logout}</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
