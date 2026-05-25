'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import { adminService } from '@/services';
import type { User, UserRole } from '@/types';

const USERS_I18N = {
  az: {
    title: 'İstifadəçilər',
    subtitle: 'İstifadəçiləri axtarın və statusları idarə edin.',
    emptyState: 'İstifadəçi tapılmadı',
    placeholder: '-',
    locale: 'az-AZ',
    searchPlaceholder: 'Ad, email və ya telefon üzrə axtar',
    filters: {
      role: 'Rol',
      status: 'Status',
      verification: 'Təsdiqləmə',
      reset: 'Sıfırla',
      all: 'Hamısı',
      active: 'Aktiv',
      blocked: 'Bloklanıb',
      passenger: 'Sərnişin',
      driver: 'Sürücü',
      admin: 'Admin',
      approved: 'Təsdiqlənib',
      pending: 'Gözləmədə',
      rejected: 'Rədd edilib',
      none: 'Təsdiqlənməyib',
    },
    table: {
      user: 'İstifadəçi',
      role: 'Rol',
      rating: 'Reytinq',
      rides: 'Gedişlər',
      bookings: 'Rezervlər',
      verification: 'Təsdiqləmə',
      status: 'Status',
      created: 'Yaradılıb',
      actions: 'Əməliyyat',
    },
    status: {
      blocked: 'Bloklanıb',
      active: 'Aktiv',
    },
    actions: {
      view: 'Bax',
      unblock: 'Bloku aç',
      block: 'Blokla',
      verify: 'Təsdiqlə',
      reject: 'Rədd et',
    },
    details: {
      email: 'Email',
      phone: 'Telefon',
      city: 'Şəhər',
      created: 'Qeydiyyat',
    }
  },
  ru: {
    title: 'Пользователи',
    subtitle: 'Ищите пользователей и управляйте статусами.',
    emptyState: 'Пользователи не найдены',
    placeholder: '-',
    locale: 'ru-RU',
    searchPlaceholder: 'Поиск по имени, email или телефону',
    filters: {
      role: 'Роль',
      status: 'Статус',
      verification: 'Верификация',
      reset: 'Сбросить',
      all: 'Все',
      active: 'Активен',
      blocked: 'Заблокирован',
      passenger: 'Пассажир',
      driver: 'Водитель',
      admin: 'Админ',
      approved: 'Подтвержден',
      pending: 'В ожидании',
      rejected: 'Отклонен',
      none: 'Не подтвержден',
    },
    table: {
      user: 'Пользователь',
      role: 'Роль',
      rating: 'Рейтинг',
      rides: 'Поездки',
      bookings: 'Бронирования',
      verification: 'Верификация',
      status: 'Статус',
      created: 'Регистрация',
      actions: 'Действие',
    },
    status: {
      blocked: 'Заблокирован',
      active: 'Активен',
    },
    actions: {
      view: 'Подробнее',
      unblock: 'Разблокировать',
      block: 'Блокировать',
      verify: 'Подтвердить',
      reject: 'Отклонить',
    },
    details: {
      email: 'Email',
      phone: 'Телефон',
      city: 'Город',
      created: 'Регистрация',
    }
  },
  en: {
    title: 'Users',
    subtitle: 'Search users and manage statuses.',
    emptyState: 'No users found',
    placeholder: '-',
    locale: 'en-US',
    searchPlaceholder: 'Search by name, email, or phone',
    filters: {
      role: 'Role',
      status: 'Status',
      verification: 'Verification',
      reset: 'Reset',
      all: 'All',
      active: 'Active',
      blocked: 'Blocked',
      passenger: 'Passenger',
      driver: 'Driver',
      admin: 'Admin',
      approved: 'Verified',
      pending: 'Pending',
      rejected: 'Rejected',
      none: 'Unverified',
    },
    table: {
      user: 'User',
      role: 'Role',
      rating: 'Rating',
      rides: 'Rides',
      bookings: 'Bookings',
      verification: 'Verification',
      status: 'Status',
      created: 'Created',
      actions: 'Actions',
    },
    status: {
      blocked: 'Blocked',
      active: 'Active',
    },
    actions: {
      view: 'View',
      unblock: 'Unblock',
      block: 'Block',
      verify: 'Verify',
      reject: 'Reject',
    },
    details: {
      email: 'Email',
      phone: 'Phone',
      city: 'City',
      created: 'Created',
    }
  }
} as const;

export default function AdminUsersPage() {
  const language = useAppStore((s) => s.language);
  const bookings = useAppStore((s) => s.bookings);
  const t = USERS_I18N[language];

  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [verificationFilter, setVerificationFilter] = useState<User['verificationStatus'] | 'all'>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 10;

  const bookingsByPassengerId = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((booking) => {
      counts.set(booking.passengerId, (counts.get(booking.passengerId) || 0) + 1);
    });
    return counts;
  }, [bookings]);

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

  const handleVerify = async (userId: string) => {
    try {
      const updatedUser = await adminService.approveVerification(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      console.error('Failed to verify user', error);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const updatedUser = await adminService.rejectVerification(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      console.error('Failed to reject user', error);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesQuery = !normalizedQuery || [user.fullName, user.email, user.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? !user.isBlocked : user.isBlocked);
    const matchesVerification = verificationFilter === 'all' || user.verificationStatus === verificationFilter;
    return matchesQuery && matchesRole && matchesStatus && matchesVerification;
  });

  const isFiltering = Boolean(normalizedQuery) || roleFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all';
  const roleOptions = [
    { value: 'all', label: t.filters.all },
    { value: 'passenger', label: t.filters.passenger },
    { value: 'driver', label: t.filters.driver },
    { value: 'admin', label: t.filters.admin },
  ];
  const statusOptions = [
    { value: 'all', label: t.filters.all },
    { value: 'active', label: t.filters.active },
    { value: 'blocked', label: t.filters.blocked },
  ];
  const verificationOptions = [
    { value: 'all', label: t.filters.all },
    { value: 'approved', label: t.filters.approved },
    { value: 'pending', label: t.filters.pending },
    { value: 'rejected', label: t.filters.rejected },
    { value: 'none', label: t.filters.none },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">{t.title}</h1>
        <p className="text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1.6fr_repeat(3,1fr)_auto] lg:items-end">
        <Input
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<Icon name="search" size={16} />}
        />
        <Select
          value={roleFilter}
          onChange={(value) => setRoleFilter(value as UserRole | 'all')}
          options={roleOptions}
          label={t.filters.role}
        />
        <Select
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'blocked')}
          options={statusOptions}
          label={t.filters.status}
        />
        <Select
          value={verificationFilter}
          onChange={(value) => setVerificationFilter(value as User['verificationStatus'] | 'all')}
          options={verificationOptions}
          label={t.filters.verification}
        />
        <Button
          variant="outline"
          onClick={() => {
            setQuery('');
            setRoleFilter('all');
            setStatusFilter('all');
            setVerificationFilter('all');
            setExpandedUserId(null);
          }}
        >
          {t.filters.reset}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.user}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.role}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.rating}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.rides}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.bookings}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.verification}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.status}</th>
                <th className="text-left px-6 py-4 font-semibold text-text-secondary">{t.table.created}</th>
                <th className="text-right px-6 py-4 font-semibold text-text-secondary">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <LoadingState />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-text-muted">
                    {t.emptyState}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleLabel = u.role === 'driver' ? t.filters.driver : u.role === 'admin' ? t.filters.admin : t.filters.passenger;
                  const roleVariant = u.role === 'admin' ? 'warning' : u.role === 'driver' ? 'brand' : 'muted';
                  const verificationLabel =
                    u.verificationStatus === 'approved'
                      ? t.filters.approved
                      : u.verificationStatus === 'pending'
                        ? t.filters.pending
                        : u.verificationStatus === 'rejected'
                          ? t.filters.rejected
                          : t.filters.none;
                  const verificationVariant =
                    u.verificationStatus === 'approved'
                      ? 'success'
                      : u.verificationStatus === 'pending'
                        ? 'warning'
                        : u.verificationStatus === 'rejected'
                          ? 'danger'
                          : 'muted';
                  const bookingCount = bookingsByPassengerId.get(u.id) ?? 0;
                  const isExpanded = expandedUserId === u.id;

                  return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-surface-dim transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0 border border-border">
                              {u.avatarUrl ? (
                                <Image src={u.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                              ) : (
                                <Icon name="user" size={16} className="text-text-muted" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-text block">{u.fullName}</span>
                              <span className="text-xs text-text-muted">{u.email || u.phone || t.placeholder}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={roleVariant}>{roleLabel}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 font-medium">
                            <Icon name="star" size={14} className="text-accent-500" fill="currentColor" />
                            {u.rating.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text">{u.totalTrips}</td>
                        <td className="px-6 py-4 text-text">{bookingCount}</td>
                        <td className="px-6 py-4">
                          <Badge variant={verificationVariant}>{verificationLabel}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {u.isBlocked ? (
                            <Badge variant="danger">{t.status.blocked}</Badge>
                          ) : (
                            <Badge variant="success">{t.status.active}</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-text">{new Date(u.createdAt).toLocaleDateString(t.locale)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setExpandedUserId(isExpanded ? null : u.id)}>
                              <Icon name="file-text" size={14} /> {t.actions.view}
                            </Button>
                            {u.verificationStatus === 'pending' && (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => handleVerify(u.id)}>
                                  <Icon name="check" size={14} /> {t.actions.verify}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleReject(u.id)}>
                                  <Icon name="x" size={14} /> {t.actions.reject}
                                </Button>
                              </>
                            )}
                            {u.isBlocked ? (
                              <Button size="sm" variant="secondary" onClick={() => handleUnblock(u.id)}>
                                <Icon name="shield-check" size={14} /> {t.actions.unblock}
                              </Button>
                            ) : (
                              <Button size="sm" variant="danger" onClick={() => handleBlock(u.id)}>
                                <Icon name="shield-off" size={14} /> {t.actions.block}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-surface-muted/50 px-6 py-4">
                            <div className="grid gap-4 sm:grid-cols-4 text-sm">
                              <div>
                                <p className="text-xs text-text-muted">{t.details.email}</p>
                                <p className="font-semibold text-text">{u.email || t.placeholder}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-muted">{t.details.phone}</p>
                                <p className="font-semibold text-text">{u.phone || t.placeholder}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-muted">{t.details.city}</p>
                                <p className="font-semibold text-text">{u.city || t.placeholder}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-muted">{t.details.created}</p>
                                <p className="font-semibold text-text">{new Date(u.createdAt).toLocaleDateString(t.locale)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && users.length > 0 && !isFiltering && (
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
