'use client';

import type { BookingStatus, TripStatus } from '@/types';
import Badge from './Badge';
import { useAppStore } from '@/store/useAppStore';

const bookingStatusConfig: Record<BookingStatus, { variant: 'warning' | 'success' | 'danger' | 'muted' | 'brand' }> = {
  pending: { variant: 'warning' },
  accepted: { variant: 'success' },
  rejected: { variant: 'danger' },
  cancelled: { variant: 'muted' },
  paid: { variant: 'success' },
  completed: { variant: 'brand' },
  expired: { variant: 'muted' },
};

const tripStatusConfig: Record<TripStatus, { variant: 'success' | 'muted' | 'brand' }> = {
  active: { variant: 'success' },
  cancelled: { variant: 'muted' },
  completed: { variant: 'brand' },
};

const bookingStatusLabels = {
  az: {
    pending: 'Gözləmədə',
    accepted: 'Qəbul edildi',
    rejected: 'Rədd edildi',
    cancelled: 'Ləğv edildi',
    paid: 'Ödənildi',
    completed: 'Tamamlandı',
    expired: 'Vaxtı bitdi',
  },
  ru: {
    pending: 'В ожидании',
    accepted: 'Принято',
    rejected: 'Отклонено',
    cancelled: 'Отменено',
    paid: 'Оплачено',
    completed: 'Завершено',
    expired: 'Просрочено',
  },
  en: {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    paid: 'Paid',
    completed: 'Completed',
    expired: 'Expired',
  }
} as const;

const tripStatusLabels = {
  az: {
    active: 'Aktiv',
    cancelled: 'Ləğv edildi',
    completed: 'Tamamlandı',
  },
  ru: {
    active: 'Активно',
    cancelled: 'Отменено',
    completed: 'Завершено',
  },
  en: {
    active: 'Active',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }
} as const;

interface StatusBadgeProps {
  status: BookingStatus | TripStatus;
  type?: 'booking' | 'trip';
  className?: string;
}

export default function StatusBadge({ status, type = 'booking', className }: StatusBadgeProps) {
  const language = useAppStore((s) => s.language);

  const config = type === 'trip'
    ? tripStatusConfig[status as TripStatus]
    : bookingStatusConfig[status as BookingStatus];

  if (!config) return null;

  const label = type === 'trip'
    ? tripStatusLabels[language][status as TripStatus]
    : bookingStatusLabels[language][status as BookingStatus];

  return (
    <Badge variant={config.variant} className={className}>
      {label}
    </Badge>
  );
}

