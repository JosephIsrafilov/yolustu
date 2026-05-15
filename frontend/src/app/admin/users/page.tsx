'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';

export default function AdminUsersPage() {
  const { users, blockUser, unblockUser } = useAppStore();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-text mb-4">İstifadəçilər</h1>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Ad</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Şəhər</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Reytinq</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-dim transition-colors">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-text-muted">{u.email}</td>
                  <td className="px-4 py-3">{u.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Icon name="star" size={12} className="text-accent-500" fill="currentColor" />{u.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBlocked ? <Badge variant="danger">Bloklanıb</Badge> : <Badge variant="success">Aktiv</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    {u.isBlocked ? (
                      <Button size="sm" variant="secondary" onClick={() => unblockUser(u.id)}>
                        <Icon name="shield-check" size={14} /> Bloku aç
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => blockUser(u.id)}>
                        <Icon name="shield-off" size={14} /> Blokla
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
