'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { isMockDataMode } from '@/lib/env';
import { useAppStore } from '@/store/useAppStore';

type GuardMode = 'auth' | 'driver' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  mode?: GuardMode;
}

export default function ProtectedRoute({ children, mode = 'auth' }: ProtectedRouteProps) {
  const router = useRouter();
  const { currentUser, isAuthenticated, activeRole } = useAppStore();

  if (!isAuthenticated || !currentUser) {
    return (
      <EmptyState
        icon={<Icon name="lock" size={28} />}
        title="Daxil olmaq lazımdır"
        description="Bu səhifəyə baxmaq üçün hesabınıza daxil olun."
        action={<Button onClick={() => router.push(ROUTES.login)}>Daxil ol</Button>}
      />
    );
  }

  if (mode === 'admin' && currentUser.role !== 'admin') {
    return (
      <EmptyState
        icon={<Icon name="shield-off" size={28} />}
        title="Giriş icazəsi yoxdur"
        description="Bu bölmə yalnız admin istifadəçiləri üçündür."
        action={<Button variant="outline" onClick={() => router.push(ROUTES.search)}>Tətbiqə qayıt</Button>}
      />
    );
  }

  const hasDriverAccess = isMockDataMode
    ? currentUser.role === 'driver' || activeRole === 'driver'
    : currentUser.role === 'driver';
  if (mode === 'driver' && !hasDriverAccess) {
    return (
      <EmptyState
        icon={<Icon name="car" size={28} />}
        title="Sürücü rejimi lazımdır"
        description="Bu bölmədə davam etmək üçün profildə sürücü roluna keçin."
        action={<Button onClick={() => router.push(ROUTES.profile)}>Profilə keç</Button>}
      />
    );
  }

  return <>{children}</>;
}
