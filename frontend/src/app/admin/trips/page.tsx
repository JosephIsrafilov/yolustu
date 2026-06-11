'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import { adminService } from '@/services';
import type { Trip } from '@/types';
import { AZ_CITIES, formatPrice } from '@/lib/utils';

const TRIPS_I18N = {
  az: {
    title: 'Gedişlər',
    subtitle: 'Marşrutları izləyin və statusları idarə edin.',
    confirmDelete: 'Bu gedişi silmək istədiyinizə əminsiniz?',
    emptyState: 'Gediş tapılmadı',
    placeholder: '-',
    locale: 'az-AZ',
    searchPlaceholder: 'Marşrut və ya sürücü üzrə axtar',
    filters: {
      status: 'Status',
      from: 'Haradan',
      to: 'Haraya',
      date: 'Tarix',
      all: 'Hamısı',
      active: 'Aktiv',
      completed: 'Tamamlandı',
      cancelled: 'Ləğv edildi',
      reset: 'Sıfırla',
    },
    table: {
      route: 'Marşrut',
      driver: 'Sürücü',
      date: 'Tarix/Saat',
      price: 'Qiymət',
      seats: 'Yerlər',
      status: 'Status',
      actions: 'Əməliyyat',
    },
    actions: {
      view: 'Bax',
      deactivate: 'Deaktiv et',
      activate: 'Aktiv et',
      delete: 'Sil',
    }
  },
  ru: {
    title: 'Поездки',
    subtitle: 'Отслеживайте маршруты и управляйте статусами.',
    confirmDelete: 'Вы уверены, что хотите удалить эту поездку?',
    emptyState: 'Поездки не найдены',
    placeholder: '-',
    locale: 'ru-RU',
    searchPlaceholder: 'Поиск по маршруту или водителю',
    filters: {
      status: 'Статус',
      from: 'Откуда',
      to: 'Куда',
      date: 'Дата',
      all: 'Все',
      active: 'Активно',
      completed: 'Завершено',
      cancelled: 'Отменено',
      reset: 'Сбросить',
    },
    table: {
      route: 'Маршрут',
      driver: 'Водитель',
      date: 'Дата/Время',
      price: 'Цена',
      seats: 'Места',
      status: 'Статус',
      actions: 'Действие',
    },
    actions: {
      view: 'Подробнее',
      deactivate: 'Деактивировать',
      activate: 'Активировать',
      delete: 'Удалить',
    }
  },
  en: {
    title: 'Trips',
    subtitle: 'Monitor routes and manage statuses.',
    confirmDelete: 'Are you sure you want to cancel this trip?',
    emptyState: 'No trips found',
    placeholder: '-',
    locale: 'en-US',
    searchPlaceholder: 'Search by route or driver',
    filters: {
      status: 'Status',
      from: 'From',
      to: 'To',
      date: 'Date',
      all: 'All',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      reset: 'Reset',
    },
    table: {
      route: 'Route',
      driver: 'Driver',
      date: 'Date/Time',
      price: 'Price',
      seats: 'Seats',
      status: 'Status',
      actions: 'Action',
    },
    actions: {
      view: 'View',
      deactivate: 'Deactivate',
      activate: 'Activate',
      delete: 'Cancel',
    }
  }
} as const;

export default function AdminTripsPage() {
  const router = useRouter();
  const language = useAppStore((s) => s.language);
  const users = useAppStore((s) => s.users);
  const t = TRIPS_I18N[language];
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const fetchTrips = useCallback(async (currentPage: number) => {
    try {
      const res = await adminService.getTrips(currentPage, limit);
      setTrips(res.items);
      setTotalPages(res.pages);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTrips(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTrips, page]);

  const handlePageChange = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const cancelTrip = async (tripId: string) => {
    if (!window.confirm(t.confirmDelete)) {
      return;
    }
    try {
      await adminService.deleteTrip(tripId);
      void fetchTrips(page);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTrips = trips.filter((trip) => {
    const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
    const matchesQuery = !normalizedQuery || [
      trip.departureCity,
      trip.arrivalCity,
      driver?.fullName,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesFrom = !fromFilter || trip.departureCity === fromFilter;
    const matchesTo = !toFilter || trip.arrivalCity === toFilter;
    const matchesDate = !dateFilter || trip.date === dateFilter;
    return matchesQuery && matchesStatus && matchesFrom && matchesTo && matchesDate;
  });

  const sortedTrips = useMemo(() => {
    if (!sortKey) return filteredTrips;

    return [...filteredTrips].sort((a, b) => {
      let valA: string | number | boolean = '';
      let valB: string | number | boolean = '';

      const driverA = a.driver ?? users.find((u) => u.id === a.driverId);
      const driverB = b.driver ?? users.find((u) => u.id === b.driverId);

      if (sortKey === 'route') {
        valA = `${a.departureCity} ${a.arrivalCity}`.toLowerCase();
        valB = `${b.departureCity} ${b.arrivalCity}`.toLowerCase();
      } else if (sortKey === 'driver') {
        valA = (driverA?.fullName || '').toLowerCase();
        valB = (driverB?.fullName || '').toLowerCase();
      } else if (sortKey === 'date') {
        valA = new Date(`${a.date}T${a.time}`).getTime();
        valB = new Date(`${b.date}T${b.time}`).getTime();
      } else if (sortKey === 'pricePerSeat') {
        valA = a.pricePerSeat;
        valB = b.pricePerSeat;
      } else if (sortKey === 'seats') {
        valA = a.seatsAvailable;
        valB = b.seatsAvailable;
      } else if (sortKey === 'status') {
        valA = a.status.toLowerCase();
        valB = b.status.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTrips, sortKey, sortDirection, users]);

  const isFiltering = Boolean(normalizedQuery) || statusFilter !== 'all' || fromFilter !== '' || toFilter !== '' || dateFilter !== '';
  const statusOptions = [
    { value: 'all', label: t.filters.all },
    { value: 'active', label: t.filters.active },
    { value: 'completed', label: t.filters.completed },
    { value: 'cancelled', label: t.filters.cancelled },
  ];
  const cityOptions = [{ value: '', label: t.filters.all }, ...AZ_CITIES.map((city) => ({ value: city, label: city }))];

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1.6fr_repeat(4,1fr)_auto] lg:items-end">
        <Input
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<Icon name="search" size={16} />}
        />
        <Select
          label={t.filters.status}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'completed' | 'cancelled')}
          options={statusOptions}
        />
        <Select
          label={t.filters.from}
          value={fromFilter}
          onChange={(value) => setFromFilter(String(value))}
          options={cityOptions}
        />
        <Select
          label={t.filters.to}
          value={toFilter}
          onChange={(value) => setToFilter(String(value))}
          options={cityOptions}
        />
        <DatePicker
          label={t.filters.date}
          value={dateFilter}
          onChange={(value) => setDateFilter(value || '')}
          placeholder={t.filters.date}
        />
        <Button
          variant="outline"
          onClick={() => {
            setQuery('');
            setStatusFilter('all');
            setFromFilter('');
            setToFilter('');
            setDateFilter('');
            setSortKey(null);
          }}
        >
          {t.filters.reset}
        </Button>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm whitespace-nowrap table-fixed min-w-[1250px]">
          <thead className="bg-surface-muted border-b border-border select-none">
            <tr>
              <th 
                onClick={() => handleSort('route')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[240px] min-w-[240px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.route}</span>
                  {sortKey === 'route' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('driver')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[200px] min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.driver}</span>
                  {sortKey === 'driver' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('date')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[150px] min-w-[150px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.date}</span>
                  {sortKey === 'date' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('pricePerSeat')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[120px] min-w-[120px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.price}</span>
                  {sortKey === 'pricePerSeat' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('seats')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[100px] min-w-[100px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.seats}</span>
                  {sortKey === 'seats' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[120px] min-w-[120px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.status}</span>
                  {sortKey === 'status' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right font-semibold text-text-secondary w-[320px] min-w-[320px]">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <LoadingState />
                </td>
              </tr>
            ) : sortedTrips.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                  {t.emptyState}
                </td>
              </tr>
            ) : (
              sortedTrips.map((trip) => {
                const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
                const showDeactivate = trip.status === 'active';
                return (
                  <tr key={trip.id} className="transition-colors duration-150 hover:bg-surface-dim">
                    <td className="px-6 py-4 font-medium text-text w-[240px] min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{trip.departureCity}</span>
                        <Icon name="arrow-right" size={14} className="text-text-muted shrink-0" />
                        <span className="truncate">{trip.arrivalCity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted w-[200px] min-w-[200px]">
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-6 w-6 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          {driver?.avatarUrl ? (
                            <Image src={driver.avatarUrl} alt="" width={24} height={24} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600">
                              <Icon name="user" size={12} />
                            </div>
                          )}
                        </div>
                        <span className="truncate">{driver?.fullName || t.placeholder}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text w-[150px] min-w-[150px]">
                      <div className="flex flex-col">
                        <span>{new Date(trip.date).toLocaleDateString(t.locale)}</span>
                        <span className="text-xs text-text-muted">{trip.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-text w-[120px] min-w-[120px]">{formatPrice(trip.pricePerSeat)}</td>
                    <td className="px-6 py-4 text-text w-[100px] min-w-[100px]">
                      <span className="font-medium">{trip.seatsAvailable}</span>
                      <span className="text-text-muted">/{trip.seatsTotal}</span>
                    </td>
                    <td className="px-6 py-4 w-[120px] min-w-[120px]"><StatusBadge status={trip.status} type="trip" /></td>
                    <td className="px-6 py-4 text-right w-[320px] min-w-[320px]">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/trips/${trip.id}`)}>
                          <Icon name="file-text" size={14} /> {t.actions.view}
                        </Button>
                        {showDeactivate && (
                          <Button size="sm" variant="danger" onClick={() => cancelTrip(trip.id)}>
                            <Icon name="ban" size={14} /> {t.actions.delete}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && trips.length > 0 && !isFiltering && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </AdminLayout>
  );
}
