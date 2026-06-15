'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatPrice } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';
import { adminService } from '@/services';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import ErrorBanner from '@/components/ui/ErrorBanner';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const STATUSES: (BookingStatus | 'all')[] = ['all', 'pending', 'accepted', 'rejected', 'cancelled', 'paid', 'completed'];

const BOOKINGS_I18N = {
  az: {
    title: 'Rezervlər',
    subtitle: 'Rezervləri idarə edin və statusları izləyin.',
    locale: 'az-AZ',
    emptyState: 'Rezerv tapılmadı',
    placeholder: '-',
    loadError: 'Rezervləri yükləmək alınmadı.',
    actionError: 'Əməliyyat alınmadı. Yenidən cəhd edin.',
    retry: 'Yenidən cəhd et',
    searchPlaceholder: 'Sərnişin, sürücü və marşrut üzrə axtar',
    statuses: {
      all: 'Hamısı',
      pending: 'Gözləmədə',
      accepted: 'Təsdiqlənib',
      rejected: 'Rədd edildi',
      cancelled: 'Ləğv edildi',
      paid: 'Ödənildi',
      boarded: 'Mindi',
      no_show: 'Gəlmədi',
      completed: 'Tamamlandı',
      expired: 'Vaxtı bitdi',
    },
    table: {
      passenger: 'Sərnişin',
      driver: 'Sürücü',
      route: 'Marşrut',
      seats: 'Yerlər',
      price: 'Məbləğ',
      status: 'Status',
      date: 'Tarix',
      actions: 'Əməliyyat',
      perSeat: 'Bir yer üçün',
    },
    actions: {
      view: 'Bax',
      confirm: 'Təsdiqlə',
      reject: 'Rədd et',
      cancel: 'Ləğv et',
    },
  },
  ru: {
    title: 'Бронирования',
    subtitle: 'Управляйте бронированиями и отслеживайте статусы.',
    locale: 'ru-RU',
    emptyState: 'Бронирования не найдены',
    placeholder: '-',
    loadError: 'Не удалось загрузить бронирования.',
    actionError: 'Операция не выполнена. Попробуйте ещё раз.',
    retry: 'Повторить',
    searchPlaceholder: 'Поиск по пассажиру, водителю или маршруту',
    statuses: {
      all: 'Все',
      pending: 'В ожидании',
      accepted: 'Подтверждено',
      rejected: 'Отклонено',
      cancelled: 'Отменено',
      paid: 'Оплачено',
      boarded: 'В машине',
      no_show: 'Не явился',
      completed: 'Завершено',
      expired: 'Просрочено',
    },
    table: {
      passenger: 'Пассажир',
      driver: 'Водитель',
      route: 'Маршрут',
      seats: 'Места',
      price: 'Сумма',
      status: 'Статус',
      date: 'Дата',
      actions: 'Действие',
      perSeat: 'За место',
    },
    actions: {
      view: 'Смотреть',
      confirm: 'Подтвердить',
      reject: 'Отклонить',
      cancel: 'Отменить',
    },
  },
  en: {
    title: 'Bookings',
    subtitle: 'Manage bookings and track status updates.',
    locale: 'en-US',
    emptyState: 'No bookings found',
    placeholder: '-',
    loadError: 'Could not load bookings.',
    actionError: 'Action failed. Please try again.',
    retry: 'Retry',
    searchPlaceholder: 'Search by passenger, driver, or route',
    statuses: {
      all: 'All',
      pending: 'Pending',
      accepted: 'Confirmed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      paid: 'Paid',
      boarded: 'Boarded',
      no_show: 'No show',
      completed: 'Completed',
      expired: 'Expired',
    },
    table: {
      passenger: 'Passenger',
      driver: 'Driver',
      route: 'Route',
      seats: 'Seats',
      price: 'Amount',
      status: 'Status',
      date: 'Date',
      actions: 'Actions',
      perSeat: 'Per seat',
    },
    actions: {
      view: 'View',
      confirm: 'Confirm',
      reject: 'Reject',
      cancel: 'Cancel',
    },
  }
} as const;

export default function AdminBookingsPage() {
  const router = useRouter();
  const language = useAppStore((s) => s.language);
  const { trips, users, acceptBooking, rejectBooking, cancelBooking } = useAppStore();
  const t = BOOKINGS_I18N[language];
  
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const fetchBookings = useCallback(async (currentPage: number) => {
    setLoadError(false);
    try {
      const res = await adminService.getBookings(currentPage, limit);
      setAllBookings(res.items);
      setTotalPages(res.pages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const retryFetch = () => {
    setIsLoading(true);
    void fetchBookings(page);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBookings(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBookings, page]);

  const handlePageChange = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const runBookingAction = async (
    bookingId: string,
    action: (id: string) => Promise<boolean>,
  ) => {
    setActionError(null);
    setPendingBookingId(bookingId);
    try {
      const ok = await action(bookingId);
      if (!ok) {
        setActionError(t.actionError);
      }
    } finally {
      setPendingBookingId(null);
    }
  };

  const tripsById = React.useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);
  const usersById = React.useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const enrichedBookings = React.useMemo(() => {
    return allBookings.map((booking) => {
      const trip = booking.trip ?? tripsById.get(booking.tripId);
      const passenger = booking.passenger ?? usersById.get(booking.passengerId);
      const driver = trip?.driver ?? (trip?.driverId ? usersById.get(trip.driverId) : undefined);
      return { booking, trip, passenger, driver };
    });
  }, [allBookings, tripsById, usersById]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = enrichedBookings.filter(({ booking, trip, passenger, driver }) => {
    const matchesStatus = filter === 'all' || booking.status === filter;
    const matchesQuery = !normalizedQuery || [
      passenger?.fullName,
      driver?.fullName,
      trip?.departureCity,
      trip?.arrivalCity,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  });

  const sortedBookings = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let valA: string | number | boolean = '';
      let valB: string | number | boolean = '';

      if (sortKey === 'passenger') {
        valA = (a.passenger?.fullName || '').toLowerCase();
        valB = (b.passenger?.fullName || '').toLowerCase();
      } else if (sortKey === 'driver') {
        valA = (a.driver?.fullName || '').toLowerCase();
        valB = (b.driver?.fullName || '').toLowerCase();
      } else if (sortKey === 'route') {
        valA = a.trip ? `${a.trip.departureCity} ${a.trip.arrivalCity}`.toLowerCase() : '';
        valB = b.trip ? `${b.trip.departureCity} ${b.trip.arrivalCity}`.toLowerCase() : '';
      } else if (sortKey === 'seats') {
        valA = a.booking.seatsRequested;
        valB = b.booking.seatsRequested;
      } else if (sortKey === 'price') {
        valA = a.trip ? a.trip.pricePerSeat * a.booking.seatsRequested : 0;
        valB = b.trip ? b.trip.pricePerSeat * b.booking.seatsRequested : 0;
      } else if (sortKey === 'status') {
        valA = a.booking.status.toLowerCase();
        valB = b.booking.status.toLowerCase();
      } else if (sortKey === 'date') {
        valA = new Date(a.booking.createdAt).getTime();
        valB = new Date(b.booking.createdAt).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDirection]);

  const isFiltering = Boolean(normalizedQuery) || filter !== 'all';

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1.5fr_auto] lg:items-end">
        <Input
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<Icon name="search" size={16} />}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 border',
              filter === status 
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                : 'bg-white text-text-secondary border-border hover:bg-surface-dim hover:text-text',
            )}
          >
            {t.statuses[status]}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted border-b border-border select-none">
            <tr>
              <th 
                onClick={() => handleSort('passenger')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.passenger}</span>
                  {sortKey === 'passenger' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('driver')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                onClick={() => handleSort('route')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                onClick={() => handleSort('seats')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                onClick={() => handleSort('price')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.price}</span>
                  {sortKey === 'price' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
              <th 
                onClick={() => handleSort('date')}
                className="px-6 py-4 text-left font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
              <th className="px-6 py-4 text-right font-semibold text-text-secondary">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-8" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : loadError ? (
              <tr>
                <td colSpan={8} className="px-6 py-8">
                  <ErrorBanner message={t.loadError} onRetry={retryFetch} retryLabel={t.retry} />
                </td>
              </tr>
            ) : sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                  {t.emptyState}
                </td>
              </tr>
            ) : (
              sortedBookings.map(({ booking, trip, passenger, driver }) => {
                const totalPrice = trip ? formatPrice(trip.pricePerSeat * booking.seatsRequested) : t.placeholder;
                return (
                  <tr key={booking.id} className="transition-colors duration-150 hover:bg-surface-dim">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          {passenger?.avatarUrl ? (
                            <Image src={passenger.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                          ) : (
                            <Icon name="user" size={16} className="text-text-muted" />
                          )}
                        </div>
                        <span className="font-medium text-text break-words line-clamp-2">{passenger?.fullName || t.placeholder}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          {driver?.avatarUrl ? (
                            <Image src={driver.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                          ) : (
                            <Icon name="user" size={16} className="text-text-muted" />
                          )}
                        </div>
                        <span className="font-medium text-text break-words line-clamp-2">{driver?.fullName || t.placeholder}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text">
                      {trip ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="break-words line-clamp-2">{trip.departureCity}</span>
                          <Icon name="arrow-right" size={14} className="text-text-muted shrink-0" />
                          <span className="break-words line-clamp-2">{trip.arrivalCity}</span>
                        </div>
                      ) : t.placeholder}
                    </td>
                    <td className="px-6 py-4 font-medium text-text">{booking.seatsRequested}</td>
                    <td className="px-6 py-4 font-medium text-text">
                      <div className="flex flex-col">
                        <span>{totalPrice}</span>
                        {trip && (
                          <span className="text-xs text-text-muted">
                            {t.table.perSeat} {formatPrice(trip.pricePerSeat)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                    <td className="px-6 py-4 text-text-muted">{new Date(booking.createdAt).toLocaleDateString(t.locale)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {trip && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(ROUTES.tripDetails(trip.id))}
                          >
                            <Icon name="file-text" size={14} /> {t.actions.view}
                          </Button>
                        )}
                        {booking.status === 'pending' && (
                          <>
                            <Button size="sm" variant="secondary" disabled={pendingBookingId === booking.id} onClick={() => runBookingAction(booking.id, acceptBooking)}>
                              <Icon name="check" size={14} /> {t.actions.confirm}
                            </Button>
                            <Button size="sm" variant="outline" disabled={pendingBookingId === booking.id} onClick={() => runBookingAction(booking.id, rejectBooking)}>
                              <Icon name="x" size={14} /> {t.actions.reject}
                            </Button>
                          </>
                        )}
                        {(booking.status === 'accepted' || booking.status === 'paid') && (
                          <Button size="sm" variant="danger" disabled={pendingBookingId === booking.id} onClick={() => runBookingAction(booking.id, cancelBooking)}>
                            <Icon name="ban" size={14} /> {t.actions.cancel}
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
      {!isLoading && allBookings.length > 0 && !isFiltering && (
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
