'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const fallbackId = React.useId();
  const inputId = id || fallbackId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = [
    error ? errorId : undefined,
    helperText && !error ? helperId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-text',
            'placeholder:text-text-muted',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            icon && 'pl-10',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-border hover:border-border-strong',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger-500">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
