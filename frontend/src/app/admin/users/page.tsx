'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import { adminService } from '@/services';
import type { User } from '@/types';

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
  const language = useAppStore((s) => s.language);
  const t = USERS_I18N[language];

  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 10;

  const fetchUsers = useCallback(async (currentPage: number) => {
    try {
      const res = await adminService.getUsers(currentPage, limit);
      setUsers(res.items);
      setTotalPages(res.pages);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUsers(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchUsers, page]);

  const handlePageChange = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const handleBlock = async (userId: string) => {
    try {
      const updatedUser = await adminService.blockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      console.error('Failed to block user', error);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const updatedUser = await adminService.unblockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      console.error('Failed to unblock user', error);
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
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.name}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.email}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.city}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.rating}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.status}</th>
                <th className="text-right px-6 py-4 font-semibold text-text-secondary">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <LoadingState />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-dim transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0 border border-border">
                          {u.avatarUrl ? (
                            <Image src={u.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                          ) : (
                            <Icon name="user" size={16} className="text-text-muted" />
                          )}
                        </div>
                        <span className="font-medium text-text">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{u.email || '—'}</td>
                    <td className="px-6 py-4 text-text">{u.city || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium">
                        <Icon name="star" size={14} className="text-accent-500" fill="currentColor" />
                        {u.rating.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <Badge variant="danger">{t.status.blocked}</Badge>
                      ) : (
                        <Badge variant="success">{t.status.active}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.isBlocked ? (
                        <Button size="sm" variant="secondary" onClick={() => handleUnblock(u.id)}>
                          <Icon name="shield-check" size={14} /> {t.actions.unblock}
                        </Button>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => handleBlock(u.id)}>
                          <Icon name="shield-off" size={14} /> {t.actions.block}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && users.length > 0 && (
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
