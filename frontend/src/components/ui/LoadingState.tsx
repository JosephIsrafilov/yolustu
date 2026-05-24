'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

interface LoadingStateProps {
  text?: string;
  count?: number;
}

export default function LoadingState({ text = 'Yüklənir...', count = 3 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-3 p-4 animate-fade-in">
      {text && (
        <p className="text-sm text-text-muted text-center mb-2">{text}</p>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-4">
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
