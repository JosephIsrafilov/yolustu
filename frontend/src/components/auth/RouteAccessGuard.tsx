'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { getUserCapabilities } from '@/lib/access-control';
import TireLoader from '@/components/ui/TireLoader';

const AUTH_REQUIRED_PREFIXES = ['/bookings', '/chats', '/profile', '/reviews', '/driver', '/admin'];
const DRIVER_PROTECTED_PREFIXES = ['/driver/create-trip', '/driver/my-trips', '/driver/requests', '/driver/vehicle', '/driver/documents'];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function RouteAccessGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated, authStatus, activeMode } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!pathname) return;

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/verify';
    const needsAuth = startsWithAny(pathname, AUTH_REQUIRED_PREFIXES);
    const isDriverProtected = startsWithAny(pathname, DRIVER_PROTECTED_PREFIXES);

    if (authStatus === 'unknown' || authStatus === 'loading') {
      return;
    }

    if (!isAuthenticated || !currentUser) {
      if (needsAuth) {
        window.location.replace(ROUTES.login);
      }
      return;
    }

    const capabilities = getUserCapabilities(currentUser, true, activeMode);

    if (capabilities.canAccessAdmin) {
      if (isAdminRoute) {
        return;
      }
    }

    if (isAdminRoute) {
      router.replace(ROUTES.search);
      return;
    }

    if (isDriverProtected && !capabilities.canAccessDriverDashboard) {
      router.replace(ROUTES.driverApply);
      return;
    }

    if (isAuthRoute) {
      router.replace(ROUTES.search);
    }
  }, [pathname, router, currentUser, isAuthenticated, authStatus, activeMode, isHydrated]);

  if (!isHydrated || authStatus === 'unknown' || authStatus === 'loading') {
    const needsAuth = pathname ? startsWithAny(pathname, AUTH_REQUIRED_PREFIXES) : false;
    if (needsAuth) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <TireLoader />
        </div>
      );
    }
    return null;
  }

  return null;
}

