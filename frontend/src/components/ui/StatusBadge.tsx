'use client';

import React from 'react';
import type { BookingStatus, TripStatus } from '@/types';
import Badge from './Badge';

const bookingStatusConfig: Record<BookingStatus, { label: string; variant: 'warning' | 'success' | 'danger' | 'muted' | 'brand' }> = {
  pending: { label: 'Gözləmədə', variant: 'warning' },
  accepted: { label: 'Qəbul edildi', variant: 'success' },
  rejected: { label: 'Rədd edildi', variant: 'danger' },
  cancelled: { label: 'Ləğv edildi', variant: 'muted' },
  completed: { label: 'Tamamlandı', variant: 'brand' },
};

const tripStatusConfig: Record<TripStatus, { label: string; variant: 'success' | 'muted' | 'brand' }> = {
  active: { label: 'Aktiv', variant: 'success' },
  cancelled: { label: 'Ləğv edildi', variant: 'muted' },
  completed: { label: 'Tamamlandı', variant: 'brand' },
};

interface StatusBadgeProps {
  status: BookingStatus | TripStatus;
  type?: 'booking' | 'trip';
  className?: string;
}

export default function StatusBadge({ status, type = 'booking', className }: StatusBadgeProps) {
  const config = type === 'trip'
    ? tripStatusConfig[status as TripStatus]
    : bookingStatusConfig[status as BookingStatus];

  if (!config) return null;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
