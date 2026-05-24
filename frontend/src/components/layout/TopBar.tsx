'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';

import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function TopBar({ title, showBack = false, rightAction }: TopBarProps) {
  const router = useRouter();
  const { language } = useAppStore();
  const backLabel = language === 'az' ? 'Geri' : language === 'ru' ? 'Назад' : 'Back';

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center px-4 h-14 w-full">
        <div className={cn("grid items-center min-w-0 w-full", showBack ? "grid-cols-[auto_1fr] gap-3" : "grid-cols-1")}>
          {showBack && (
            <button
              onClick={() => router.back()}
              className="shrink-0 w-8 h-8 flex-none rounded-lg flex items-center justify-center hover:bg-surface-muted transition-colors"
              aria-label={backLabel}
            >
              <Icon name="arrow-left" size={20} />
            </button>
          )}
          <h1 className="text-lg font-bold text-text truncate block w-full">{title}</h1>
        </div>
        {rightAction ? (
          <div className="shrink-0 flex-none flex items-center justify-end h-8 min-w-[32px]">
            {rightAction}
          </div>
        ) : (
          <div className="w-8 h-8 shrink-0 flex-none" />
        )}
      </div>
    </div>
  );
}
