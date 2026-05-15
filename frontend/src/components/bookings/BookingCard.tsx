'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { formatPrice } from '@/lib/utils';
import type { Booking, Trip, User } from '@/types';

interface BookingCardProps {
  booking: Booking;
  trip?: Trip;
  driver?: User;
  onCancel?: () => void;
  onReview?: () => void;
}

export default function BookingCard({
  booking,
  trip,
  driver,
  onCancel,
  onReview,
}: BookingCardProps) {
  if (!trip) return null;

  const canCancel = booking.status === 'pending' || booking.status === 'accepted';
  const canReview = booking.status === 'completed';

  return (
    <Card className="animate-fade-in">
      {}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-base font-bold text-text">
            {trip.departureCity} → {trip.arrivalCity}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
            <Icon name="clock" size={12} />
            {trip.date} • {trip.time}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {}
      <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
        <span className="font-semibold text-brand-600">{formatPrice(trip.pricePerSeat)}</span>
        <span>{booking.seatsRequested} yer</span>
      </div>

      {}
      {driver && (
        <div className="flex items-center gap-2 py-2 border-t border-border">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
            {driver.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{driver.fullName}</p>
            <p className="flex items-center gap-1 text-xs text-text-muted">
              <Icon name="star" size={10} className="text-accent-500" fill="currentColor" />
              {driver.rating.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {}
      {(canCancel || canReview) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {canCancel && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} fullWidth>
              Ləğv et
            </Button>
          )}
          {canReview && onReview && (
            <Button variant="secondary" size="sm" onClick={onReview} fullWidth>
              <Icon name="star" size={14} />
              Rəy yaz
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
