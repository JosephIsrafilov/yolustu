'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { adminService } from '@/services';
import CreateUserModal from './CreateUserModal';
import AdminTableShell from '@/components/admin/AdminTableShell';
import type { User, UserRole } from '@/types';

const USERS_I18N = {
  az: {
    title: 'İstifadəçilər',
    subtitle: 'İstifadəçiləri axtarın və statusları idarə edin.',
    emptyState: 'İstifadəçi tapılmadı',
    placeholder: '-',
    locale: 'az-AZ',
    loadError: 'İstifadəçiləri yükləmək alınmadı.',
    retry: 'Yenidən cəhd et',
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
    loadError: 'Не удалось загрузить пользователей.',
    retry: 'Повторить',
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
    loadError: 'Could not load users.',
    retry: 'Retry',
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
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionUserId, setPendingActionUserId] = useState<string | null>(null);
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
    setLoadError(false);
    try {
      const res = await adminService.getUsers({ 
        page: currentPage, 
        limit,
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        verification: verificationFilter === 'all' ? undefined : verificationFilter,
        q: query || undefined,
      });
      setUsers(res.items);
      setTotalPages(res.pages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [limit, roleFilter, statusFilter, verificationFilter, query]);

  const retryFetch = () => {
    setIsLoading(true);
    void fetchUsers(page);
  };

  const isFilterChange = useRef(false);
  useEffect(() => {
    isFilterChange.current = true;
  }, [query, roleFilter, statusFilter, verificationFilter]);

  useEffect(() => {
    const targetPage = isFilterChange.current ? 1 : page;
    const timeoutId = window.setTimeout(() => {
      if (isFilterChange.current) {
        setPage(1);
        isFilterChange.current = false;
      }
      setIsLoading(true);
      void fetchUsers(targetPage);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [fetchUsers, page, query, roleFilter, statusFilter, verificationFilter]);

  const handlePageChange = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const handleBlock = async (userId: string) => {
    setActionError(null);
    setPendingActionUserId(userId);
    try {
      const updatedUser = await adminService.blockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch {
      setActionError(t.manage.actionError);
    } finally {
      setPendingActionUserId(null);
    }
  };

  const handleUnblock = async (userId: string) => {
    setActionError(null);
    setPendingActionUserId(userId);
    try {
      const updatedUser = await adminService.unblockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch {
      setActionError(t.manage.actionError);
    } finally {
      setPendingActionUserId(null);
    }
  };

  const handleVerify = async (userId: string) => {
    setActionError(null);
    setPendingActionUserId(userId);
    try {
      const updatedUser = await adminService.approveVerification(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch {
      setActionError(t.manage.actionError);
    } finally {
      setPendingActionUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionError(null);
    setPendingActionUserId(userId);
    try {
      const updatedUser = await adminService.rejectVerification(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch {
      setActionError(t.manage.actionError);
    } finally {
      setPendingActionUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionError(null);
    setPendingActionUserId(userId);
    try {
      const updatedUser = await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setEditingRoleUserId(null);
      setEditingRole(null);
    } catch {
      setActionError(t.manage.roleError);
    } finally {
      setPendingActionUserId(null);
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
  const filteredUsers = users;

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

      {actionError && (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      )}

      <AdminTableShell>
        <table className="w-full min-w-full table-fixed text-sm">
          <thead className="bg-surface-muted border-b border-border select-none">
            <tr>
              <th 
                onClick={() => handleSort('fullName')}
                className="w-[24%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="w-[10%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="w-[8%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="hidden xl:table-cell w-[7%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="hidden xl:table-cell w-[7%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="w-[12%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="w-[10%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
                className="hidden xl:table-cell w-[11%] text-left px-3 py-3 md:px-4 md:py-3.5 font-semibold text-text-secondary hover:text-brand-600 cursor-pointer group"
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
              <th className="w-[18%] px-3 py-3 md:px-4 md:py-3.5 text-right font-semibold text-text-secondary">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-3 py-3 md:px-4 md:py-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-6 w-12 rounded-full" /></td>
                  <td className="px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-4 w-6" /></td>
                  <td className="hidden xl:table-cell px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-4 w-6" /></td>
                  <td className="hidden xl:table-cell px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-4 w-6" /></td>
                  <td className="px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="hidden xl:table-cell px-3 py-3 md:px-4 md:py-3.5"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-3 py-3 md:px-4 md:py-3.5 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : loadError ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center">
                  <ErrorBanner message={t.loadError} onRetry={retryFetch} retryLabel={t.retry} />
                </td>
              </tr>
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-text-muted">
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
                const userEmailOrPhone = u.email || u.phone || t.placeholder;

                return (
                  <React.Fragment key={u.id}>
                    <tr className="group hover:bg-surface-dim transition-colors duration-150">
                      <td className="px-3 py-3 md:px-4 md:py-3.5">
                          <div className="flex min-w-0 items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0 border border-border">
                            {u.avatarUrl ? (
                              <Image src={u.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                            ) : (
                              <Icon name="user" size={16} className="text-text-muted" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span 
                              title={u.fullName}
                              className="block max-w-full truncate font-medium text-text"
                            >
                              {u.fullName}
                            </span>
                            <span 
                              title={userEmailOrPhone}
                              className="block max-w-full truncate text-xs text-text-muted"
                            >
                              {userEmailOrPhone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5">
                        <Badge variant={roleVariant}>{roleLabel}</Badge>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5">
                        <div className="flex items-center gap-1 font-medium">
                          <Icon name="star" size={14} className="text-accent-500" fill="currentColor" />
                          {u.rating.toFixed(1)}
                        </div>
                      </td>
                      <td className="hidden xl:table-cell px-3 py-3 md:px-4 md:py-3.5 text-text font-medium">{u.totalTrips}</td>
                      <td className="hidden xl:table-cell px-3 py-3 md:px-4 md:py-3.5 text-text font-medium">{bookingCount}</td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5">
                        <Badge variant={verificationVariant}>{verificationLabel}</Badge>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5">
                        {u.isBlocked ? (
                           <Badge variant="danger">{t.status.blocked}</Badge>
                        ) : (
                          <Badge variant="success">{t.status.active}</Badge>
                        )}
                      </td>
                      <td className="hidden xl:table-cell px-3 py-3 md:px-4 md:py-3.5 text-text-muted text-xs">{new Date(u.createdAt).toLocaleDateString(t.locale)}</td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                            className="h-8 px-2 text-xs gap-1"
                            title={t.actions.view}
                          >
                            <Icon name="file-text" size={14} />
                            <span className="hidden 2xl:inline">{t.actions.view}</span>
                          </Button>
                          {u.verificationStatus === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                disabled={pendingActionUserId === u.id} 
                                onClick={() => handleVerify(u.id)}
                                className="h-8 px-2 text-xs gap-1"
                                title={t.actions.verify}
                              >
                                <Icon name="check" size={14} />
                                <span className="hidden 2xl:inline">{t.actions.verify}</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={pendingActionUserId === u.id} 
                                onClick={() => handleReject(u.id)}
                                className="h-8 px-2 text-xs gap-1"
                                title={t.actions.reject}
                              >
                                <Icon name="x" size={14} />
                                <span className="hidden 2xl:inline">{t.actions.reject}</span>
                              </Button>
                            </>
                          )}
                          {u.isBlocked ? (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              disabled={pendingActionUserId === u.id} 
                              onClick={() => handleUnblock(u.id)}
                              className="h-8 px-2 text-xs gap-1"
                              title={t.actions.unblock}
                            >
                              <Icon name="shield-check" size={14} />
                              <span className="hidden 2xl:inline">{t.actions.unblock}</span>
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="danger" 
                              disabled={pendingActionUserId === u.id} 
                              onClick={() => handleBlock(u.id)}
                              className="h-8 px-2 text-xs gap-1"
                              title={t.actions.block}
                            >
                              <Icon name="shield-off" size={14} />
                              <span className="hidden 2xl:inline">{t.actions.block}</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="bg-surface-muted/50 p-0 border-b border-border">
                          <div className="w-full min-w-0 px-3 py-3 md:px-4 md:py-3.5">
                            <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                              <div className="min-w-0">
                                <p className="text-xs text-text-muted">{t.details.email}</p>
                                <p className="break-words font-semibold text-text">{u.email || t.placeholder}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-text-muted">{t.details.phone}</p>
                                <p className="break-words font-semibold text-text">{u.phone || t.placeholder}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-text-muted">{t.details.city}</p>
                                <p className="break-words font-semibold text-text">{u.city || t.placeholder}</p>
                              </div>
                              <div className="min-w-0 xl:hidden">
                                <p className="text-xs text-text-muted">{t.table.rides}</p>
                                <p className="font-semibold text-text">{u.totalTrips}</p>
                              </div>
                              <div className="min-w-0 xl:hidden">
                                <p className="text-xs text-text-muted">{t.table.bookings}</p>
                                <p className="font-semibold text-text">{bookingCount}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-text-muted">{t.details.created}</p>
                                <p className="break-words font-semibold text-text">{new Date(u.createdAt).toLocaleDateString(t.locale)}</p>
                              </div>
                              <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                                <p className="mb-2 text-xs text-text-muted">{t.manage.role}</p>
                                {editingRoleUserId === u.id ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                      value={editingRole || u.role}
                                      onChange={(value) => setEditingRole(value as UserRole)}
                                      options={roleOptions}
                                    />
                                    <Button size="sm" disabled={pendingActionUserId === u.id} onClick={() => editingRole && handleRoleChange(u.id, editingRole)}>
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
      </AdminTableShell>
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
