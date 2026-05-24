'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in bg-surface/50 rounded-3xl border border-dashed border-border/60", className)}>
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
        {icon || <Icon name="inbox" size={32} />}
      </div>
      <h3 className="text-xl font-semibold text-text mb-2">{title}</h3>
      {description && (
        <p className="text-base text-text-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
