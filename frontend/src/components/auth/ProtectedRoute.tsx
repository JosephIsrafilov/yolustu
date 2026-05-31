'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { getUserCapabilities } from '@/lib/access-control';
import { I18N } from '@/lib/i18n';

type GuardMode = 'auth' | 'driver' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  mode?: GuardMode;
}

export default function ProtectedRoute({ children, mode = 'auth' }: ProtectedRouteProps) {
  const router = useRouter();
  const { currentUser, isAuthenticated, activeMode, language } = useAppStore();
  const copy = I18N[language];

  const localCopy = {
    loginRequiredTitle: language === 'az' ? 'Daxil olmaq lazımdır' : language === 'ru' ? 'Требуется вход' : 'Login required',
    loginRequiredDesc: language === 'az'
      ? 'Bu səhifəyə baxmaq üçün hesabınıza daxil olun.'
      : language === 'ru'
        ? 'Войдите в аккаунт, чтобы открыть эту страницу.'
        : 'Sign in to access this page.',
    adminOnlyTitle: language === 'az' ? 'Giriş icazəsi yoxdur' : language === 'ru' ? 'Нет доступа' : 'Access denied',
    adminOnlyDesc: language === 'az'
      ? 'Bu bölmə yalnız admin istifadəçiləri üçündür.'
      : language === 'ru'
        ? 'Этот раздел доступен только администраторам.'
        : 'This section is only available to admins.',
    driverOnlyTitle: language === 'az' ? 'Sürücü panelinə giriş bağlanıb' : language === 'ru' ? 'Нет доступа к панели водителя' : 'Driver dashboard access is blocked',
    driverOnlyDesc: language === 'az'
      ? 'Gediş yaratmaq üçün sürücü təsdiqlənməsini tamamlayın.'
      : language === 'ru'
        ? 'Завершите верификацию водителя, чтобы создавать поездки.'
        : 'Complete driver verification to create trips.',
    driverPendingTitle: language === 'az' ? 'Sürücü təsdiqlənməsi gözləyir' : language === 'ru' ? 'Верификация водителя в ожидании' : 'Driver verification is pending',
    driverPendingDesc: language === 'az'
      ? 'Sənədləriniz yoxlanılır. Nəticəni profilinizdə izləyin.'
      : language === 'ru'
        ? 'Ваши документы проверяются. Статус доступен в профиле.'
        : 'Your documents are under review. Track status in profile.',
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <EmptyState
        icon={<Icon name="lock" size={28} />}
        title={localCopy.loginRequiredTitle}
        description={localCopy.loginRequiredDesc}
        action={<Button onClick={() => router.push(ROUTES.login)}>{copy.header.login}</Button>}
      />
    );
  }

  const capabilities = getUserCapabilities(currentUser, true, activeMode);

  if (mode === 'admin' && !capabilities.canAccessAdmin) {
    return (
      <EmptyState
        icon={<Icon name="shield-off" size={28} />}
        title={localCopy.adminOnlyTitle}
        description={localCopy.adminOnlyDesc}
        action={<Button variant="outline" onClick={() => router.push(ROUTES.search)}>{copy.common.back}</Button>}
      />
    );
  }

  if (mode === 'driver' && !capabilities.canAccessDriverDashboard) {
    const isPending = capabilities.driverStatus === 'pending';

    return (
      <EmptyState
        icon={<Icon name="car" size={28} />}
        title={isPending ? localCopy.driverPendingTitle : localCopy.driverOnlyTitle}
        description={isPending ? localCopy.driverPendingDesc : localCopy.driverOnlyDesc}
        action={
          <Button onClick={() => router.push(ROUTES.driverApply)}>
            {copy.header.offerRide}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
