'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/Icon';
import type { Booking, Trip, User } from '@/types';

interface BookingRequestCardProps {
  booking: Booking;
  passenger?: User;
  trip?: Trip;
  onAccept: () => void;
  onReject: () => void;
}

export default function BookingRequestCard({
  booking,
  passenger,
  trip,
  onAccept,
  onReject,
}: BookingRequestCardProps) {
  if (!passenger || !trip) return null;

  const isPending = booking.status === 'pending';
  const noSeats = trip.seatsAvailable < booking.seatsRequested;

  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
            {passenger.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{passenger.fullName}</p>
            <p className="text-xs text-text-muted">{passenger.city}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
        <span className="flex items-center gap-1">
          <Icon name="users" size={13} />
          {booking.seatsRequested} yer istəyir
        </span>
        <span>
          {trip.departureCity} → {trip.arrivalCity}
        </span>
      </div>

      {isPending && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onAccept}
            disabled={noSeats}
          >
            <Icon name="check" size={14} />
            {noSeats ? 'Yer yoxdur' : 'Qəbul et'}
          </Button>
          <Button variant="outline" size="sm" fullWidth onClick={onReject}>
            <Icon name="x" size={14} />
            Rədd et
          </Button>
        </div>
      )}
    </Card>
  );
}
