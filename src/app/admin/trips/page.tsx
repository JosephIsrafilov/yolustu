'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';

export default function AdminTripsPage() {
  const { trips, users, deleteTrip } = useAppStore();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-text mb-4">Gedişlər</h1>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Marşrut</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Sürücü</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Tarix</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Qiymət</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Yerlər</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const driver = users.find((u) => u.id === t.driverId);
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-dim transition-colors">
                    <td className="px-4 py-3 font-medium">{t.departureCity} → {t.arrivalCity}</td>
                    <td className="px-4 py-3 text-text-muted">{driver?.fullName || '—'}</td>
                    <td className="px-4 py-3">{t.date}</td>
                    <td className="px-4 py-3">{t.pricePerSeat} ₼</td>
                    <td className="px-4 py-3">{t.seatsAvailable}/{t.seatsTotal}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} type="trip" /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger" onClick={() => deleteTrip(t.id)}>
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
