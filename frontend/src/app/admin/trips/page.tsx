'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import { adminService } from '@/services';
import type { Trip } from '@/types';

const TRIPS_I18N = {
  az: {
    title: 'Gedişlər',
    confirmDelete: 'Bu gedişi silmək istədiyinizə əminsiniz?',
    table: {
      route: 'Marşrut',
      driver: 'Sürücü',
      date: 'Tarix',
      price: 'Qiymət',
      seats: 'Yerlər',
      status: 'Status',
      actions: 'Əməliyyat',
    },
    actions: {
      delete: 'Sil',
    }
  },
  ru: {
    title: 'Поездки',
    confirmDelete: 'Вы уверены, что хотите удалить эту поездку?',
    table: {
      route: 'Маршрут',
      driver: 'Водитель',
      date: 'Дата',
      price: 'Цена',
      seats: 'Места',
      status: 'Статус',
      actions: 'Действие',
    },
    actions: {
      delete: 'Удалить',
    }
  },
  en: {
    title: 'Trips',
    confirmDelete: 'Are you sure you want to delete this trip?',
    table: {
      route: 'Route',
      driver: 'Driver',
      date: 'Date',
      price: 'Price',
      seats: 'Seats',
      status: 'Status',
      actions: 'Action',
    },
    actions: {
      delete: 'Delete',
    }
  }
} as const;

export default function AdminTripsPage() {
  const language = useAppStore((s) => s.language);
  const t = TRIPS_I18N[language];
  
  const [trips, setTrips] = useState<Trip[]>([]);
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

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
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
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No trips found
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const driver = trip.driver;
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
                              <img src={driver.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600">
                                <Icon name="user" size={12} />
                              </div>
                            )}
                          </div>
                          <span>{driver?.fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text">{new Date(trip.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-text">{trip.pricePerSeat} ₼</td>
                      <td className="px-6 py-4 text-text">
                        <span className="font-medium">{trip.seatsAvailable}</span>
                        <span className="text-text-muted">/{trip.seatsTotal}</span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={trip.status} type="trip" /></td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="danger" onClick={() => deleteTrip(trip.id)}>
                          <Icon name="trash-2" size={14} /> {t.actions.delete}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && trips.length > 0 && (
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
