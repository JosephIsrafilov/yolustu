'use client';

import React from 'react';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import { getUserCapabilities } from '@/lib/access-control';

export default function RoleSwitch() {
  const { activeMode, switchRole, currentUser, isAuthenticated, language } = useAppStore();
  const t = I18N[language].auth;
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);

  if (!isAuthenticated || !currentUser || capabilities.canAccessAdmin) {
    return null;
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
