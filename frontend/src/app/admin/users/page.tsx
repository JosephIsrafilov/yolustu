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
import CreateUserModal from './CreateUserModal';
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
      unblock: 'Blokdan çıxar',
      block: 'Blokla',
      verify: 'Təsdiqlə',
      reject: 'Rədd et',
    },
    details: {
      email: 'Email',
      phone: 'Telefon',
      city: 'Şəhər',
      created: 'Qeydiyyat',
    },
    manage: {
      createUser: 'İstifadəçi yarat',
      role: 'Rol',
      changeRole: 'Rolu dəyiş',
      save: 'Yadda saxla',
      roleError: 'Rol dəyişdirilə bilmədi.',
      actionError: 'Əməliyyat alınmadı. Yenidən cəhd edin.',
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
    },
    manage: {
      createUser: 'Создать пользователя',
      role: 'Роль',
      changeRole: 'Изменить роль',
      save: 'Сохранить',
      roleError: 'Не удалось изменить роль.',
      actionError: 'Операция не выполнена. Попробуйте ещё раз.',
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
    },
    manage: {
      createUser: 'Create user',
      role: 'Role',
      changeRole: 'Change role',
      save: 'Save',
      roleError: 'Could not change role.',
      actionError: 'Action failed. Please try again.',
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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
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
      const res = await adminService.getUsers({ page: currentPage, limit });
      setUsers(res.items);
      setTotalPages(res.pages);
    } catch (error) {
      // Error handled silently
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
      // Error handled silently
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const updatedUser = await adminService.unblockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      // Error handled silently
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const updatedUser = await adminService.approveVerification(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      // Error handled silently
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const updatedUser = await adminService.rejectVerification(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      // Error handled silently
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updatedUser = await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setEditingRoleUserId(null);
      setEditingRole(null);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleCreateSuccess = () => {
    void fetchUsers(page);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
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

  const sortedUsers = useMemo(() => {
    if (!sortKey) return filteredUsers;

    return [...filteredUsers].sort((a, b) => {
      let valA: string | number | boolean = '';
      let valB: string | number | boolean = '';

      if (sortKey === 'fullName') {
        valA = a.fullName.toLowerCase();
        valB = b.fullName.toLowerCase();
      } else if (sortKey === 'role') {
        valA = a.role.toLowerCase();
        valB = b.role.toLowerCase();
      } else if (sortKey === 'rating') {
        valA = a.rating;
        valB = b.rating;
      } else if (sortKey === 'totalTrips') {
        valA = a.totalTrips;
        valB = b.totalTrips;
      } else if (sortKey === 'bookings') {
        valA = bookingsByPassengerId.get(a.id) ?? 0;
        valB = bookingsByPassengerId.get(b.id) ?? 0;
      } else if (sortKey === 'verificationStatus') {
        valA = a.verificationStatus.toLowerCase();
        valB = b.verificationStatus.toLowerCase();
      } else if (sortKey === 'status') {
        valA = a.isBlocked ? 1 : 0;
        valB = b.isBlocked ? 1 : 0;
      } else if (sortKey === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortKey, sortDirection, bookingsByPassengerId]);

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text">{t.title}</h1>
          <p className="text-sm text-text-muted">{t.subtitle}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Icon name="user" size={16} />
          {t.manage.createUser}
        </Button>
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
            setSortKey(null);
          }}
        >
          {t.filters.reset}
        </Button>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm whitespace-nowrap table-fixed min-w-[1420px]">
          <thead className="bg-surface-muted border-b border-border select-none">
            <tr>
              <th 
                onClick={() => handleSort('fullName')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[280px] min-w-[280px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.user}</span>
                  {sortKey === 'fullName' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('role')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[120px] min-w-[120px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.role}</span>
                  {sortKey === 'role' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('rating')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[100px] min-w-[100px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.rating}</span>
                  {sortKey === 'rating' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('totalTrips')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[100px] min-w-[100px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.rides}</span>
                  {sortKey === 'totalTrips' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('bookings')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[100px] min-w-[100px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.bookings}</span>
                  {sortKey === 'bookings' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('verificationStatus')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[150px] min-w-[150px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.verification}</span>
                  {sortKey === 'verificationStatus' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[120px] min-w-[120px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.status}</span>
                  {sortKey === 'status' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('createdAt')}
                className="text-left px-6 py-4 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group w-[130px] min-w-[130px]"
              >
                <div className="flex items-center gap-1">
                  <span>{t.table.created}</span>
                  {sortKey === 'createdAt' ? (
                    <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} className="text-brand-600" />
                  ) : (
                    <Icon name="chevron-down" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  )}
                </div>
              </th>
              <th className="text-right px-6 py-4 font-semibold text-text-secondary w-[320px] min-w-[320px] sticky right-0 bg-surface-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)] z-10">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <LoadingState />
                </td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-text-muted">
                  {t.emptyState}
                </td>
              </tr>
            ) : (
              sortedUsers.map((u) => {
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
                    <tr className="group hover:bg-surface-dim transition-colors duration-150">
                      <td className="px-6 py-4 w-[280px] min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0 border border-border">
                            {u.avatarUrl ? (
                              <Image src={u.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                            ) : (
                              <Icon name="user" size={16} className="text-text-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-text block truncate">{u.fullName}</span>
                            <span className="text-xs text-text-muted truncate block">{u.email || u.phone || t.placeholder}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[120px] min-w-[120px]">
                        <Badge variant={roleVariant}>{roleLabel}</Badge>
                      </td>
                      <td className="px-6 py-4 w-[100px] min-w-[100px]">
                        <div className="flex items-center gap-1 font-medium">
                          <Icon name="star" size={14} className="text-accent-500" fill="currentColor" />
                          {u.rating.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[100px] min-w-[100px] text-text">{u.totalTrips}</td>
                      <td className="px-6 py-4 w-[100px] min-w-[100px] text-text">{bookingCount}</td>
                      <td className="px-6 py-4 w-[150px] min-w-[150px]">
                        <Badge variant={verificationVariant}>{verificationLabel}</Badge>
                      </td>
                      <td className="px-6 py-4 w-[120px] min-w-[120px]">
                        {u.isBlocked ? (
                           <Badge variant="danger">{t.status.blocked}</Badge>
                        ) : (
                          <Badge variant="success">{t.status.active}</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 w-[130px] min-w-[130px] text-text">{new Date(u.createdAt).toLocaleDateString(t.locale)}</td>
                      <td className="px-6 py-4 text-right w-[320px] min-w-[320px] sticky right-0 bg-white group-hover:bg-surface-dim transition-colors duration-150 shadow-[-4px_0_12px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
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
                        <td colSpan={9} className="bg-surface-muted/50 p-0 border-b border-border">
                          <div className="sticky left-0 w-full max-w-[100vw] px-6 py-4">
                            <div className="grid gap-4 sm:grid-cols-5 text-sm">
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
                            <div>
                              <p className="text-xs text-text-muted mb-2">{t.manage.role}</p>
                              {editingRoleUserId === u.id ? (
                                <div className="flex gap-2 items-center">
                                  <Select
                                    value={editingRole || u.role}
                                    onChange={(value) => setEditingRole(value as UserRole)}
                                    options={roleOptions}
                                  />
                                  <Button size="sm" onClick={() => editingRole && handleRoleChange(u.id, editingRole)}>
                                    <Icon name="check" size={14} />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingRoleUserId(null); setEditingRole(null); }}>
                                    <Icon name="x" size={14} />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => { setEditingRoleUserId(u.id); setEditingRole(u.role); }}>
                                  <Icon name="settings" size={14} /> {t.manage.changeRole}
                                </Button>
                              )}
                            </div>
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
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </AdminLayout>
  );
}
