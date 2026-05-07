'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, Calendar, MapPin, Banknote } from 'lucide-react';
import { AZ_CITIES } from '@/lib/utils';
import type { TripSearchFilters } from '@/types';

interface TripFiltersProps {
  filters: TripSearchFilters;
  onChange: (filters: TripSearchFilters) => void;
  onSearch: () => void;
}

export default function TripFilters({ filters, onChange, onSearch }: TripFiltersProps) {
  const update = (key: keyof TripSearchFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
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
        icon={<Calendar size={16} />}
      />

      <Input
        label="Maks. qiymət (₼)"
        type="number"
        placeholder="Məs: 20"
        value={filters.maxPrice || ''}
        onChange={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
        icon={<Banknote size={16} />}
      />

      <Button fullWidth onClick={onSearch}>
        <Search size={16} />
        Axtar
      </Button>
    </div>
  );
}
