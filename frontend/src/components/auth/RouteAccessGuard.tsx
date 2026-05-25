'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { getUserCapabilities } from '@/lib/access-control';

const AUTH_REQUIRED_PREFIXES = ['/bookings', '/profile', '/reviews', '/driver', '/admin'];
const DRIVER_PROTECTED_PREFIXES = ['/driver/create-trip', '/driver/my-trips', '/driver/requests', '/driver/vehicle', '/driver/documents'];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function RouteAccessGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isAuthenticated, activeMode } = useAppStore();

  useEffect(() => {
    if (!pathname) return;

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/verify';
    const needsAuth = startsWithAny(pathname, AUTH_REQUIRED_PREFIXES);
    const isDriverProtected = startsWithAny(pathname, DRIVER_PROTECTED_PREFIXES);

    if (!isAuthenticated || !currentUser) {
      if (needsAuth) {
        router.replace(ROUTES.login);
      }
      return;
    }

    const capabilities = getUserCapabilities(currentUser, true, activeMode);

    if (capabilities.canAccessAdmin) {
      if (!isAdminRoute) {
        router.replace(ROUTES.admin);
      }
      return;
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
  }, [pathname, router, currentUser, isAuthenticated, activeMode]);

  return null;
}

