'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Car, Users } from 'lucide-react';

export default function RoleSwitch() {
  const { activeRole, switchRole } = useAppStore();

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
        <Users size={14} />
        Sərnişin
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
        <Car size={14} />
        Sürücü
      </button>
    </div>
  );
}
