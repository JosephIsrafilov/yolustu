'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';

const USERS_I18N = {
  az: {
    title: 'İstifadəçilər',
    table: {
      name: 'Ad',
      email: 'Email',
      city: 'Şəhər',
      rating: 'Reytinq',
      status: 'Status',
      actions: 'Əməliyyat',
    },
    status: {
      blocked: 'Bloklanıb',
      active: 'Aktiv',
    },
    actions: {
      unblock: 'Bloku aç',
      block: 'Blokla',
    }
  },
  ru: {
    title: 'Пользователи',
    table: {
      name: 'Имя',
      email: 'Email',
      city: 'Город',
      rating: 'Рейтинг',
      status: 'Статус',
      actions: 'Действие',
    },
    status: {
      blocked: 'Заблокирован',
      active: 'Активен',
    },
    actions: {
      unblock: 'Разблокировать',
      block: 'Блокировать',
    }
  },
  en: {
    title: 'Users',
    table: {
      name: 'Name',
      email: 'Email',
      city: 'City',
      rating: 'Rating',
      status: 'Status',
      actions: 'Action',
    },
    status: {
      blocked: 'Blocked',
      active: 'Active',
    },
    actions: {
      unblock: 'Unblock',
      block: 'Block',
    }
  }
} as const;

export default function AdminUsersPage() {
  const { users, blockUser, unblockUser, fetchUsers } = useAppStore();
  const language = useAppStore((s) => s.language);
  const t = USERS_I18N[language];

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-text mb-4">{t.title}</h1>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-dim">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t.table.name}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t.table.email}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t.table.city}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t.table.rating}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t.table.status}</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">{t.table.actions}</th>
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
                    {u.isBlocked ? (
                      <Badge variant="danger">{t.status.blocked}</Badge>
                    ) : (
                      <Badge variant="success">{t.status.active}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.isBlocked ? (
                      <Button size="sm" variant="secondary" onClick={() => unblockUser(u.id)}>
                        <Icon name="shield-check" size={14} /> {t.actions.unblock}
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => blockUser(u.id)}>
                        <Icon name="shield-off" size={14} /> {t.actions.block}
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
