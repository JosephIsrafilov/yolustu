'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    confirmDelete: 'Are you sure you want to delete this trip?',
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
      delete: 'Delete',
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
  const limit = 10;

  const fetchTrips = useCallback(async (currentPage: number) => {
    try {
      const res = await adminService.getTrips(currentPage, limit);
      setTrips(res.items);
      setTotalPages(res.pages);
    } catch (error) {
      console.error('Fetch admin trips error:', error);
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

  const deleteTrip = async (tripId: string) => {
    if (!window.confirm(t.confirmDelete)) {
      return;
    }
    try {
      await adminService.deleteTrip(tripId);
      setTrips((current) => current.filter((trip) => trip.id !== tripId));
    } catch (error) {
      console.error('Delete trip error:', error);
    }
  };

  const updateTripStatus = (tripId: string, status: Trip['status']) => {
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, status } : trip));
    useAppStore.setState((state) => ({
      trips: state.trips.map((trip) => trip.id === tripId ? { ...trip, status } : trip),
    }));
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
          }}
        >
          {t.filters.reset}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.route}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.driver}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.date}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.price}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.seats}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.status}</th>
                <th className="px-6 py-4 text-right font-semibold text-text-secondary">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <LoadingState />
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    {t.emptyState}
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
                  const showActivate = trip.status === 'cancelled';
                  const showDeactivate = trip.status === 'active';
                  return (
                    <tr key={trip.id} className="transition-colors duration-150 hover:bg-surface-dim">
                      <td className="px-6 py-4 font-medium text-text">
                        <div className="flex items-center gap-2">
                          <span>{trip.departureCity}</span>
                          <Icon name="arrow-right" size={14} className="text-text-muted" />
                          <span>{trip.arrivalCity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-surface border border-border overflow-hidden">
                            {driver?.avatarUrl ? (
                              <Image src={driver.avatarUrl} alt="" width={24} height={24} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600">
                                <Icon name="user" size={12} />
                              </div>
                            )}
                          </div>
                          <span>{driver?.fullName || t.placeholder}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text">
                        <div className="flex flex-col">
                          <span>{new Date(trip.date).toLocaleDateString(t.locale)}</span>
                          <span className="text-xs text-text-muted">{trip.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-text">{formatPrice(trip.pricePerSeat)}</td>
                      <td className="px-6 py-4 text-text">
                        <span className="font-medium">{trip.seatsAvailable}</span>
                        <span className="text-text-muted">/{trip.seatsTotal}</span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={trip.status} type="trip" /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/trips/${trip.id}`)}>
                            <Icon name="file-text" size={14} /> {t.actions.view}
                          </Button>
                          {showDeactivate && (
                            <Button size="sm" variant="outline" onClick={() => updateTripStatus(trip.id, 'cancelled')}>
                              <Icon name="ban" size={14} /> {t.actions.deactivate}
                            </Button>
                          )}
                          {showActivate && (
                            <Button size="sm" variant="secondary" onClick={() => updateTripStatus(trip.id, 'active')}>
                              <Icon name="check-circle" size={14} /> {t.actions.activate}
                            </Button>
                          )}
                          <Button size="sm" variant="danger" onClick={() => deleteTrip(trip.id)}>
                            <Icon name="trash-2" size={14} /> {t.actions.delete}
                          </Button>
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
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </AdminLayout>
  );
}
