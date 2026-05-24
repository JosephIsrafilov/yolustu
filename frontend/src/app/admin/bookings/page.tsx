'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';
import { adminService } from '@/services';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import Icon from '@/components/ui/Icon';

const STATUSES: (BookingStatus | 'all')[] = ['all', 'pending', 'accepted', 'rejected', 'cancelled', 'paid', 'completed'];

const BOOKINGS_I18N = {
  az: {
    title: 'Rezervlər',
    locale: 'az-AZ',
    statuses: {
      all: 'Hamısı',
      pending: 'Gözləmədə',
      accepted: 'Qəbul edildi',
      rejected: 'Rədd edildi',
      cancelled: 'Ləğv edildi',
      paid: 'Ödənildi',
      completed: 'Tamamlandı',
    },
    table: {
      passenger: 'Sərnişin',
      route: 'Marşrut',
      seats: 'Yerlər',
      status: 'Status',
      date: 'Tarix',
    }
  },
  ru: {
    title: 'Бронирования',
    locale: 'ru-RU',
    statuses: {
      all: 'Все',
      pending: 'В ожидании',
      accepted: 'Принято',
      rejected: 'Отклонено',
      cancelled: 'Отменено',
      paid: 'Оплачено',
      completed: 'Завершено',
    },
    table: {
      passenger: 'Пассажир',
      route: 'Маршрут',
      seats: 'Места',
      status: 'Статус',
      date: 'Дата',
    }
  },
  en: {
    title: 'Bookings',
    locale: 'en-US',
    statuses: {
      all: 'All',
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      paid: 'Paid',
      completed: 'Completed',
    },
    table: {
      passenger: 'Passenger',
      route: 'Route',
      seats: 'Seats',
      status: 'Status',
      date: 'Date',
    }
  }
} as const;

export default function AdminBookingsPage() {
  const language = useAppStore((s) => s.language);
  const t = BOOKINGS_I18N[language];
  
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
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

  const filtered = filter === 'all' ? allBookings : allBookings.filter((booking) => booking.status === filter);

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
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
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.route}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.seats}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.status}</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary">{t.table.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <LoadingState />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => {
                  const trip = booking.trip;
                  const passenger = booking.passenger;
                  return (
                    <tr key={booking.id} className="transition-colors duration-150 hover:bg-surface-dim">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {passenger?.avatarUrl ? (
                              <img src={passenger.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Icon name="user" size={16} className="text-text-muted" />
                            )}
                          </div>
                          <span className="font-medium text-text">{passenger?.fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text">
                        {trip ? (
                          <div className="flex items-center gap-2">
                            <span>{trip.departureCity}</span>
                            <Icon name="arrow-right" size={14} className="text-text-muted" />
                            <span>{trip.arrivalCity}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 font-medium text-text">{booking.seatsRequested}</td>
                      <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                      <td className="px-6 py-4 text-text-muted">{new Date(booking.createdAt).toLocaleDateString(t.locale)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && allBookings.length > 0 && (
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
