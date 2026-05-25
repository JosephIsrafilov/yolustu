'use client';

import React from 'react';
import Link from 'next/link';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { getUserCapabilities } from '@/lib/access-control';

const APPLY_I18N = {
  az: {
    title: 'Driver onboarding',
    pendingTitle: 'Verification is pending',
    pendingDesc: 'Your documents are under review. We will notify you after approval.',
    rejectedTitle: 'Verification requires update',
    rejectedDesc: 'Please re-submit your documents from profile to continue.',
    noneTitle: 'Become a driver',
    noneDesc: 'Complete verification and add vehicle info before creating trips.',
    approvedTitle: 'Driver access is ready',
    approvedDesc: 'You can now switch to driver mode and start creating trips.',
    toProfile: 'Open profile verification',
    toDashboard: 'Open driver dashboard',
    switchMode: 'Switch to driver mode',
  },
  ru: {
    title: 'Driver onboarding',
    pendingTitle: 'Verification is pending',
    pendingDesc: 'Your documents are under review. We will notify you after approval.',
    rejectedTitle: 'Verification requires update',
    rejectedDesc: 'Please re-submit your documents from profile to continue.',
    noneTitle: 'Become a driver',
    noneDesc: 'Complete verification and add vehicle info before creating trips.',
    approvedTitle: 'Driver access is ready',
    approvedDesc: 'You can now switch to driver mode and start creating trips.',
    toProfile: 'Open profile verification',
    toDashboard: 'Open driver dashboard',
    switchMode: 'Switch to driver mode',
  },
  en: {
    title: 'Driver onboarding',
    pendingTitle: 'Verification is pending',
    pendingDesc: 'Your documents are under review. We will notify you after approval.',
    rejectedTitle: 'Verification requires update',
    rejectedDesc: 'Please re-submit your documents from profile to continue.',
    noneTitle: 'Become a driver',
    noneDesc: 'Complete verification and add vehicle info before creating trips.',
    approvedTitle: 'Driver access is ready',
    approvedDesc: 'You can now switch to driver mode and start creating trips.',
    toProfile: 'Open profile verification',
    toDashboard: 'Open driver dashboard',
    switchMode: 'Switch to driver mode',
  },
} as const;

export default function DriverApplyPage() {
  const { language, currentUser, isAuthenticated, activeMode, switchRole } = useAppStore();
  const t = APPLY_I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);

  const state =
    capabilities.driverStatus === 'approved'
      ? { title: t.approvedTitle, desc: t.approvedDesc, icon: 'shield-check' as const }
      : capabilities.driverStatus === 'pending'
        ? { title: t.pendingTitle, desc: t.pendingDesc, icon: 'clock' as const }
        : capabilities.driverStatus === 'rejected'
          ? { title: t.rejectedTitle, desc: t.rejectedDesc, icon: 'shield-x' as const }
          : { title: t.noneTitle, desc: t.noneDesc, icon: 'file-text' as const };

  return (
    <WebLayout title={t.title} narrow>
      <ProtectedRoute>
        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name={state.icon} size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text">{state.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{state.desc}</p>
            </div>
          </div>

          {capabilities.canAccessDriverDashboard ? (
            <div className="flex flex-wrap gap-3">
              {activeMode !== 'driver' && (
                <Button onClick={() => switchRole('driver')}>
                  {t.switchMode}
                </Button>
              )}
              <Link href={ROUTES.driverDashboard}>
                <Button variant="outline">{t.toDashboard}</Button>
              </Link>
            </div>
          ) : (
            <Link href={ROUTES.profile}>
              <Button>{t.toProfile}</Button>
            </Link>
          )}
        </Card>
      </ProtectedRoute>
    </WebLayout>
  );
}

