'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { AZ_CITIES } from '@/lib/utils';
import type { TripSearchFilters } from '@/types';

interface TripFiltersProps {
  filters: TripSearchFilters;
  onChange: (filters: TripSearchFilters) => void;
  onSearch: () => void;
}

export default function TripFilters({ filters, onChange, onSearch }: TripFiltersProps) {
  const update = (key: keyof TripSearchFilters, value: string | number | boolean | undefined) => {
    onChange({ ...filters, [key]: value !== undefined ? value : undefined });
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-border">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Haradan</label>
          <select
            value={filters.departureCity || ''}
            onChange={(e) => update('departureCity', e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Bütün şəhərlər</option>
            {AZ_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Haraya</label>
          <select
            value={filters.arrivalCity || ''}
            onChange={(e) => update('arrivalCity', e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Bütün şəhərlər</option>
            {AZ_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Tarix"
        type="date"
        value={filters.date || ''}
        onChange={(e) => update('date', e.target.value)}
        icon={<Icon name="calendar" size={16} />}
      />

      <Input
        label="Maks. qiymət (₼)"
        type="number"
        placeholder="Məs: 20"
        value={filters.maxPrice || ''}
        onChange={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
        icon={<Icon name="banknote" size={16} />}
      />

      <div className="flex flex-col gap-2.5 border-t border-border pt-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.femaleOnly || false}
            onChange={(e) => update('femaleOnly', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>Yalnız xanımlar üçün</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.smokingAllowed || false}
            onChange={(e) => update('smokingAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>Siqaret çəkmək olar</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.petsAllowed || false}
            onChange={(e) => update('petsAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>Heyvan aparmaq olar</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.musicAllowed || false}
            onChange={(e) => update('musicAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>Musiqi dinləmək olar</span>
        </label>
      </div>

      <Button fullWidth onClick={onSearch}>
        <Icon name="search" size={16} />
        Axtar
      </Button>
    </div>
  );
}
