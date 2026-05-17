'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import { adminService } from '@/services';
import type { Trip } from '@/types';

export default function AdminTripsPage() {
  const { users } = useAppStore();
  const [trips, setTrips] = React.useState<Trip[]>([]);

  React.useEffect(() => {
    adminService.getTrips()
      .then(setTrips)
      .catch((error) => {
        console.error('Fetch admin trips error:', error);
      });
  }, []);

  const deleteTrip = async (tripId: string) => {
    await adminService.deleteTrip(tripId);
    setTrips((current) => current.filter((trip) => trip.id !== tripId));
  };

  return (
    <AdminLayout>
      <h1 className="mb-4 text-2xl font-bold text-text">Gedişlər</h1>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Marşrut</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Sürücü</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Tarix</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Qiymət</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Yerlər</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Əməliyyat</th>
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
                        <Icon name="trash-2" size={14} /> Sil
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
