'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPrice, formatRating } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import type { Trip, User } from '@/types';

interface TripCardProps {
  trip: Trip;
  driver?: User;
  compact?: boolean;
}

export default function TripCard({ trip, driver, compact = false }: TripCardProps) {
  const router = useRouter();

  return (
    <Card
      hoverable
      onClick={() => router.push(ROUTES.tripDetails(trip.id))}
      className="animate-fade-in"
    >
      {/* Route header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-brand-100" />
            <div className="w-px h-5 bg-brand-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-700 ring-2 ring-brand-100" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text">{trip.departureCity}</span>
            <span className="text-sm font-semibold text-text">{trip.arrivalCity}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</p>
          <p className="text-[10px] text-text-muted">yer başına</p>
        </div>
      </div>

      {/* Trip info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-3">
        <span className="flex items-center gap-1">
          <Icon name="clock" size={13} />
          {trip.date} • {trip.time}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="users" size={13} />
          {trip.seatsAvailable} yer boş
        </span>
        {trip.status !== 'active' && (
          <StatusBadge status={trip.status} type="trip" />
        )}
      </div>

      {/* Driver info */}
      {driver && !compact && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
            {driver.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{driver.fullName}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-0.5">
                <Icon name="star" size={11} className="text-accent-500 fill-accent-500" fill="currentColor" />
                {formatRating(driver.rating)}
              </span>
              <span className="flex items-center gap-0.5">
                <Icon name="car" size={11} />
                {trip.carModel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Meeting point */}
      {!compact && trip.meetingPoint && (
        <div className="flex items-start gap-1.5 mt-2 text-xs text-text-muted">
          <Icon name="map-pin" size={12} className="mt-0.5 shrink-0" />
          <span className="truncate">{trip.meetingPoint}</span>
        </div>
      )}
    </Card>
  );
}
