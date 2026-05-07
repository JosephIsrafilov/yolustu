'use client';

import React from 'react';

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
            <div className="w-10 h-10 rounded-full bg-surface-muted animate-pulse-soft" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-muted rounded-lg w-3/4 animate-pulse-soft" />
              <div className="h-3 bg-surface-muted rounded-lg w-1/2 animate-pulse-soft" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
