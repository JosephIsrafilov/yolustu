'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
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
  const { users } = useAppStore();
  const language = useAppStore((s) => s.language);
  const t = TRIPS_I18N[language];
  const [trips, setTrips] = React.useState<Trip[]>([]);

  React.useEffect(() => {
    adminService.getTrips()
      .then(setTrips)
      .catch((error) => {
        console.error('Fetch admin trips error:', error);
      });
  }, []);

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
      <h1 className="mb-4 text-2xl font-bold text-text">{t.title}</h1>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.route}</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.driver}</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.date}</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.price}</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.seats}</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.status}</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const driver = trip.driver ?? users.find((user) => user.id === trip.driverId);
                return (
                  <tr key={trip.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-dim">
                    <td className="px-4 py-3 font-medium">{trip.departureCity} → {trip.arrivalCity}</td>
                    <td className="px-4 py-3 text-text-muted">{driver?.fullName || '—'}</td>
                    <td className="px-4 py-3">{trip.date}</td>
                    <td className="px-4 py-3">{trip.pricePerSeat} ₼</td>
                    <td className="px-4 py-3">{trip.seatsAvailable}/{trip.seatsTotal}</td>
                    <td className="px-4 py-3"><StatusBadge status={trip.status} type="trip" /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger" onClick={() => deleteTrip(trip.id)}>
                        <Icon name="trash-2" size={14} /> {t.actions.delete}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

