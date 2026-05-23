'use client';

import React from 'react';
import { isMockDataMode } from '@/lib/env';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

export default function RoleSwitch() {
  const { activeRole, switchRole } = useAppStore();
  const language = useAppStore((s) => s.language);
  const t = I18N[language].auth;

  if (!isMockDataMode) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs text-text-muted">
        Role is managed by backend in API mode.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-surface-muted rounded-xl p-1">
      <button
        onClick={() => switchRole('passenger')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          activeRole === 'passenger'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-text-muted hover:text-text-secondary',
        )}
      >
        <Icon name="users" size={14} />
        {t.rolePassenger}
      </button>
      <button
        onClick={() => switchRole('driver')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          activeRole === 'driver'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-text-muted hover:text-text-secondary',
        )}
      >
        <Icon name="car" size={14} />
        {t.roleDriver}
      </button>
    </div>
  );
}
