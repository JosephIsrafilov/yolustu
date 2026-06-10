'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatPrice, formatRating, cn, estimateDurationMinutes, formatDuration } from '@/lib/utils';
import { getLocalizedCityName } from '@/lib/cities';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import type { Trip, User } from '@/types';

interface TripCardProps {
  trip: Trip;
  driver?: User;
  compact?: boolean;
}

export default function TripCard({ trip, driver, compact = false }: TripCardProps) {
  const router = useRouter();
  const language = useAppStore(state => state.language);
  const durationMin = estimateDurationMinutes(trip.origin, trip.destination, trip.departureCity, trip.arrivalCity);
  const departureCity = getLocalizedCityName(trip.departureCity, language);
  const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);

  return (
    <Card
      hoverable
      onClick={() => router.push(ROUTES.tripDetails(trip.id))}
      className={cn(
        "animate-fade-in shrink-0 flex-none",
        compact ? "h-[110px]" : "h-[200px]"
      )}
    >
      {/* Top Section - Cities & Price */}
      <div className="grid grid-cols-[1fr_96px] gap-4 mb-3 h-12 items-center">
        <div className="grid grid-cols-[auto_1fr] gap-2 items-center min-w-0">
          <div className="flex flex-col items-center justify-center w-4 shrink-0 flex-none">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-brand-100 shrink-0 flex-none" />
            <div className="w-px h-5 bg-brand-200 shrink-0 flex-none" />
            <div className="w-2.5 h-2.5 rounded-full bg-brand-700 ring-2 ring-brand-100 shrink-0 flex-none" />
          </div>
          <div className="grid grid-rows-2 gap-1 min-w-0">
            <span className="text-sm font-semibold text-text truncate block w-full leading-5 h-5">{departureCity}</span>
            <span className="text-sm font-semibold text-text truncate block w-full leading-5 h-5">{arrivalCity}</span>
          </div>
        </div>
        <div className="text-right shrink-0 flex-none w-24">
          <p className="text-lg font-bold text-brand-600 truncate block w-full leading-6 h-6">{formatPrice(trip.pricePerSeat)}</p>
          <p className="text-[10px] text-text-muted truncate block w-full leading-4 h-4">yer başına</p>
        </div>
      </div>

      {/* Middle Section - Date, time, seats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-text-secondary mb-3 items-center h-5">
        <span className="flex items-center gap-1 min-w-0" title={formatDuration(durationMin, language)}>
          <Icon name="clock" size={13} className="shrink-0 flex-none" />
          <span className="truncate block w-full">{trip.date} • {trip.time}</span>
        </span>
        <span className="flex items-center gap-1 min-w-0">
          <Icon name="users" size={13} className="shrink-0 flex-none" />
          <span className="truncate block w-full">{trip.seatsAvailable} yer boş</span>
        </span>
        <div className="min-w-0 flex justify-end h-5">
          {trip.status !== 'active' && (
            <StatusBadge status={trip.status} type="trip" className="shrink-0 flex-none" />
          )}
        </div>
      </div>

      {/* Driver Section */}
      {driver && !compact && (
        <div className="grid grid-cols-[32px_1fr] gap-2 pt-3 border-t border-border items-center h-12">
          <UserAvatar name={driver.fullName} avatarUrl={driver.avatarUrl} size={32} />
          <div className="min-w-0 grid grid-rows-2">
            <p className="text-sm font-medium text-text truncate block w-full leading-4 h-4">{driver.fullName}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted items-center h-4">
              <span className="flex items-center gap-0.5 min-w-0">
                <Icon name="star" size={11} className="text-accent-500 fill-accent-500 shrink-0 flex-none" fill="currentColor" />
                <span className="truncate block w-full">{formatRating(driver.rating)}</span>
              </span>
              <span className="flex items-center gap-0.5 min-w-0">
                <Icon name="car" size={11} className="shrink-0 flex-none" />
                <span className="truncate block w-full">{trip.carModel}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Point Section */}
      {!compact && trip.meetingPoint && (
        <div className="grid grid-cols-[12px_1fr] gap-1.5 mt-2 text-xs text-text-muted items-center h-5">
          <Icon name="map-pin" size={12} className="shrink-0 flex-none" />
          <span className="truncate block w-full">{trip.meetingPoint}</span>
        </div>
      )}
    </Card>
  );
}
