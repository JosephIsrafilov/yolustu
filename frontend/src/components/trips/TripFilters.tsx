'use client';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { AZ_CITIES, CURRENCY_SYMBOL } from '@/lib/utils';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import type { TripSearchFilters } from '@/types';

interface TripFiltersProps {
  filters: TripSearchFilters;
  onChange: (filters: TripSearchFilters) => void;
  onSearch: () => void;
}

export default function TripFilters({ filters, onChange, onSearch }: TripFiltersProps) {
  const { language } = useAppStore();
  const copy = I18N[language];

  const update = (key: keyof TripSearchFilters, value: string | number | boolean | undefined) => {
    onChange({ ...filters, [key]: value !== undefined ? value : undefined });
  };

  const maxPriceLabel = `${copy.tripsPage.maxPrice} (${CURRENCY_SYMBOL})`;
  const maxPricePlaceholder = copy.tripsPage.maxPricePlaceholder;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-border">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">{copy.common.from}</label>
          <Select
            value={filters.departureCity || ''}
            onChange={(value) => update('departureCity', value ? String(value) : undefined)}
            options={[
              { value: '', label: copy.common.allCities },
              ...AZ_CITIES.map((city) => ({ value: city, label: city })),
            ]}
            icon="map-pin"
            ariaLabel={copy.common.from}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">{copy.common.to}</label>
          <Select
            value={filters.arrivalCity || ''}
            onChange={(value) => update('arrivalCity', value ? String(value) : undefined)}
            options={[
              { value: '', label: copy.common.allCities },
              ...AZ_CITIES.map((city) => ({ value: city, label: city })),
            ]}
            icon="map-pin"
            ariaLabel={copy.common.to}
          />
        </div>
      </div>

      <DatePicker
        value={filters.date || ''}
        onChange={(value) => update('date', value || undefined)}
        label={copy.common.date}
        placeholder={copy.common.selectDate}
      />

      <Input
        label={maxPriceLabel}
        type="number"
        placeholder={maxPricePlaceholder}
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
          <span>{copy.createTrip.femaleOnlyLabel}</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.smokingAllowed || false}
            onChange={(e) => update('smokingAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>{copy.createTrip.smokingAllowedLabel}</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.petsAllowed || false}
            onChange={(e) => update('petsAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>{copy.createTrip.petsAllowedLabel}</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.musicAllowed || false}
            onChange={(e) => update('musicAllowed', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
          <span>{copy.createTrip.musicAllowedLabel}</span>
        </label>
      </div>

      <Button fullWidth onClick={onSearch}>
        <Icon name="search" size={16} />
        {copy.common.search}
      </Button>
    </div>
  );
}
