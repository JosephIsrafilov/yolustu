'use client';

import { SEAT_SPOTS, getSeatLabel } from '@/lib/seats';
import type { Language } from '@/lib/i18n';
import type { SeatSpot } from '@/types';

interface SeatMapProps {
  availableSpots: SeatSpot[];
  selectedSpots: SeatSpot[];
  onChange?: (spots: SeatSpot[]) => void;
  language: Language;
  disabled?: boolean;
  label?: string;
}

export default function SeatMap({
  availableSpots,
  selectedSpots,
  onChange,
  language,
  disabled = false,
  label = 'Seat map',
}: SeatMapProps) {
  const toggleSeat = (spot: SeatSpot) => {
    if (disabled || !onChange || !availableSpots.includes(spot)) return;
    onChange(
      selectedSpots.includes(spot)
        ? selectedSpots.filter((selected) => selected !== spot)
        : [...selectedSpots, spot],
    );
  };

  const renderSeat = (spot: SeatSpot) => {
    const isAvailable = availableSpots.includes(spot);
    const isSelected = selectedSpots.includes(spot);
    const seatLabel = getSeatLabel(spot, language);

    return (
      <button
        key={spot}
        type="button"
        aria-label={seatLabel}
        aria-pressed={isSelected}
        disabled={disabled || !onChange || !isAvailable}
        onClick={() => toggleSeat(spot)}
        className={`min-h-14 rounded-xl border-2 px-2 py-2 text-xs font-bold transition ${
          isSelected
            ? 'border-brand-600 bg-brand-50 text-brand-700'
            : isAvailable
              ? 'border-border bg-surface text-text-secondary hover:border-brand-300'
              : 'cursor-not-allowed border-border bg-surface-muted text-text-muted opacity-50'
        }`}
      >
        {seatLabel}
      </button>
    );
  };

  return (
    <div role="group" aria-label={label} className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div aria-hidden="true" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-transparent bg-surface text-xs font-bold text-text-muted">
          Driver
        </div>
        {renderSeat('front_right')}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SEAT_SPOTS.slice(1).map(renderSeat)}
      </div>
    </div>
  );
}
