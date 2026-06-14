'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function ErrorBanner({ message, onRetry, retryLabel, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon name="alert-triangle" size={18} className="shrink-0 text-red-600" />
        <span className="font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          <Icon name="refresh-cw" size={14} />
          {retryLabel || 'Retry'}
        </button>
      )}
    </div>
  );
}
