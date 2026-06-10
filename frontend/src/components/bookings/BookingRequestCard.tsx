'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';
import { getLocalizedCityName } from '@/lib/cities';
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
  const language = useAppStore((state) => state.language);

  if (!passenger || !trip) return null;

  const isPending = booking.status === 'pending';
  const noSeats = trip.seatsAvailable < booking.seatsRequested;
  const departureCity = getLocalizedCityName(trip.departureCity, language);
  const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);

  return (
    <Card className="animate-fade-in min-h-[160px] flex flex-col justify-between">
      <div className="grid grid-cols-[1fr_auto] gap-4 mb-3 items-start h-12">
        <div className="grid grid-cols-[40px_1fr] gap-2 items-center min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0 flex-none">
            {passenger.fullName.charAt(0)}
          </div>
          <div className="min-w-0 grid grid-rows-2">
            <p className="text-sm font-semibold text-text truncate block w-full leading-5">{passenger.fullName}</p>
            <p className="text-xs text-text-muted truncate block w-full leading-4">{passenger.city}</p>
          </div>
        </div>
        <div className="shrink-0 flex-none h-6 flex items-center">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary mb-3 h-5 items-center">
        <span className="flex items-center gap-1 min-w-0">
          <Icon name="users" size={13} className="shrink-0 flex-none" />
          <span className="truncate block w-full">{booking.seatsRequested} yer istəyir</span>
        </span>
        <span className="truncate block w-full text-right">
          {departureCity} → {arrivalCity}
        </span>
      </div>

      {isPending && (
        <div className="flex gap-2 pt-3 border-t border-border flex-nowrap items-center h-12 w-full">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onAccept}
            disabled={noSeats}
            className="flex-1 w-full"
          >
            <Icon name="check" size={14} className="shrink-0 flex-none" />
            <span className="truncate">{noSeats ? 'Yer yoxdur' : 'Qəbul et'}</span>
          </Button>
          <Button variant="outline" size="sm" fullWidth onClick={onReject} className="flex-1 w-full">
            <Icon name="x" size={14} className="shrink-0 flex-none" />
            <span className="truncate">Rədd et</span>
          </Button>
        </div>
      )}
    </Card>
  );
}
