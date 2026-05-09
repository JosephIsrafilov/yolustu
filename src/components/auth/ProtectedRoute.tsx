'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
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
        title="Daxil olmaq lazД±mdД±r"
        description="Bu sЙ™hifЙ™yЙ™ baxmaq ГјГ§Гјn hesabД±nД±za daxil olun."
        action={<Button onClick={() => router.push(ROUTES.login)}>Daxil ol</Button>}
      />
    );
  }

  if (mode === 'admin' && currentUser.role !== 'admin') {
    return (
      <EmptyState
        icon={<Icon name="shield-off" size={28} />}
        title="GiriЕџ icazЙ™si yoxdur"
        description="Bu bГ¶lmЙ™ yalnД±z admin istifadЙ™Г§ilЙ™ri ГјГ§ГјndГјr."
        action={<Button variant="outline" onClick={() => router.push(ROUTES.search)}>TЙ™tbiqЙ™ qayД±t</Button>}
      />
    );
  }

  const hasDriverAccess = currentUser.role === 'driver' || activeRole === 'driver';
  if (mode === 'driver' && !hasDriverAccess) {
    return (
      <EmptyState
        icon={<Icon name="car" size={28} />}
        title="SГјrГјcГј rejimi lazД±mdД±r"
        description="Bu bГ¶lmЙ™dЙ™ davam etmЙ™k ГјГ§Гјn profildЙ™ sГјrГјcГј roluna keГ§in."
        action={<Button onClick={() => router.push(ROUTES.profile)}>ProfilЙ™ keГ§</Button>}
      />
    );
  }

  return <>{children}</>;
}
