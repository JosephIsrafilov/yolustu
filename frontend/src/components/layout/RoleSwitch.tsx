'use client';

import React from 'react';
import { isMockDataMode } from '@/lib/env';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import { getUserCapabilities } from '@/lib/access-control';

const MODE_SWITCH_I18N = {
  az: { backendManaged: 'Rejim API modunda backend terefinden idare olunur.' },
  ru: { backendManaged: 'Режим в API-режиме управляется backend-ом.' },
  en: { backendManaged: 'Mode is managed by backend in API mode.' },
} as const;

export default function RoleSwitch() {
  const { activeMode, switchRole, currentUser, isAuthenticated, language } = useAppStore();
  const t = I18N[language].auth;
  const localCopy = MODE_SWITCH_I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);

  if (!isAuthenticated || !currentUser || capabilities.canAccessAdmin) {
    return null;
  }

  if (!isMockDataMode) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs text-text-muted">
        {localCopy.backendManaged}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-surface-muted rounded-xl p-1">
      <button
        onClick={() => switchRole('passenger')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          activeMode === 'passenger'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-text-muted hover:text-text-secondary',
        )}
      >
        <Icon name="users" size={14} />
        {t.rolePassenger}
      </button>
      <button
        type="button"
        onClick={() => switchRole('driver')}
        disabled={!capabilities.canAccessDriverDashboard}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          activeMode === 'driver'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-text-muted hover:text-text-secondary',
          !capabilities.canAccessDriverDashboard && 'cursor-not-allowed opacity-50 hover:text-text-muted',
        )}
      >
        <Icon name="car" size={14} />
        {t.roleDriver}
      </button>
    </div>
  );
}
