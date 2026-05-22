'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';
import Icon from '@/components/ui/Icon';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function TopBar({ title, showBack = false, rightAction }: TopBarProps) {
  const router = useRouter();
  const { language } = useAppStore();
  const t = I18N[language].common;

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-muted transition-colors"
              aria-label={t.back}
            >
              <Icon name="arrow-left" size={20} />
            </button>
          )}
          <h1 className="text-lg font-bold text-text truncate">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </div>
  );
}
