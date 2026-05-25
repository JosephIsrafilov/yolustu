'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatPrice } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';
import { adminService } from '@/services';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
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
    searchPlaceholder: 'Sərnişin, sürücü və marşrut üzrə axtar',
    statuses: {
      all: 'Hamısı',
      pending: 'Gözləmədə',
      accepted: 'Təsdiqlənib',
      rejected: 'Rədd edildi',
      cancelled: 'Ləğv edildi',
      paid: 'Ödənildi',
      completed: 'Tamamlandı',
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
    searchPlaceholder: 'Поиск по пассажиру, водителю или маршруту',
    statuses: {
      all: 'Все',
      pending: 'В ожидании',
      accepted: 'Подтверждено',
      rejected: 'Отклонено',
      cancelled: 'Отменено',
      paid: 'Оплачено',
      completed: 'Завершено',
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
    searchPlaceholder: 'Search by passenger, driver, or route',
    statuses: {
      all: 'All',
      pending: 'Pending',
      accepted: 'Confirmed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      paid: 'Paid',
      completed: 'Completed',
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
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const limit = 10;

  const fetchBookings = useCallback(async (currentPage: number) => {
    try {
      // TODO: Implement backend filtering by status for paginated bookings
      const res = await adminService.getBookings(currentPage, limit);
      setAllBookings(res.items);
      setTotalPages(res.pages);
    } catch (error) {
      console.error('Fetch admin bookings error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

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

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.passenger}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.driver}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.route}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.seats}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.price}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.status}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.date}</th>
                <th className="px-6 py-4 text-right font-semibold text-text-secondary">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <LoadingState />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                    {t.emptyState}
                  </td>
                </tr>
              ) : (
                filtered.map(({ booking, trip, passenger, driver }) => {
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
                          <span className="font-medium text-text">{passenger?.fullName || t.placeholder}</span>
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
                          <span className="font-medium text-text">{driver?.fullName || t.placeholder}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text">
                        {trip ? (
                          <div className="flex items-center gap-2">
                            <span>{trip.departureCity}</span>
                            <Icon name="arrow-right" size={14} className="text-text-muted" />
                            <span>{trip.arrivalCity}</span>
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
                        <div className="flex flex-wrap justify-end gap-2">
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
                              <Button size="sm" variant="secondary" onClick={() => acceptBooking(booking.id)}>
                                <Icon name="check" size={14} /> {t.actions.confirm}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectBooking(booking.id)}>
                                <Icon name="x" size={14} /> {t.actions.reject}
                              </Button>
                            </>
                          )}
                          {(booking.status === 'accepted' || booking.status === 'paid') && (
                            <Button size="sm" variant="danger" onClick={() => cancelBooking(booking.id)}>
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
