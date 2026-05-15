'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export default function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-border',
        paddingMap[padding],
        hoverable && 'cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md active:translate-y-0 active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </div>
  );
}
