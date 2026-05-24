'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import { adminService } from '@/services';
import type { User } from '@/types';

const VERIFICATIONS_I18N = {
  az: {
    title: 'Sürücü Təsdiqləmələri',
    refresh: 'Yenilə',
    confirmApprove: 'Bu istifadəçini təsdiqləmək istədiyinizə əminsiniz?',
    confirmReject: 'Bu istifadəçini rədd etmək istədiyinizə əminsiniz?',
    empty: 'Hal-hazırda gözləyən təsdiqləmə sorğusu yoxdur.',
    registered: 'Qeydiyyat:',
    viewDoc: 'Sənədə bax',
    noDoc: 'Sənəd yüklənməyib',
    reject: 'Rədd et',
    approve: 'Təsdiqlə',
    locale: 'az-AZ',
  },
  ru: {
    title: 'Подтверждение водителей',
    refresh: 'Обновить',
    confirmApprove: 'Вы уверены, что хотите подтвердить этого пользователя?',
    confirmReject: 'Вы уверены, что хотите отклонить этого пользователя?',
    empty: 'В настоящее время нет ожидающих запросов на подтверждение.',
    registered: 'Регистрация:',
    viewDoc: 'Посмотреть документ',
    noDoc: 'Документ не загружен',
    reject: 'Отклонить',
    approve: 'Подтвердить',
    locale: 'ru-RU',
  },
  en: {
    title: 'Driver Verifications',
    refresh: 'Refresh',
    confirmApprove: 'Are you sure you want to approve this user?',
    confirmReject: 'Are you sure you want to reject this user?',
    empty: 'There are currently no pending verification requests.',
    registered: 'Registered:',
    viewDoc: 'View Document',
    noDoc: 'No document uploaded',
    reject: 'Reject',
    approve: 'Approve',
    locale: 'en-US',
  }
} as const;

export default function AdminVerificationsPage() {
  const language = useAppStore((s) => s.language);
  const t = VERIFICATIONS_I18N[language];
  
  const [verifications, setVerifications] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 10;

  const fetchVerifications = useCallback(async (currentPage: number) => {
    try {
      const res = await adminService.getPendingVerifications(currentPage, limit);
      setVerifications(res.items);
      setTotalPages(res.pages);
    } catch (error) {
      console.error('Fetch pending verifications error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchVerifications(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchVerifications, page]);

  const handlePageChange = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const handleApprove = async (userId: string) => {
    if (confirm(t.confirmApprove)) {
      try {
        await adminService.approveVerification(userId);
        setVerifications(prev => prev.filter(v => v.id !== userId));
      } catch (error) {
        console.error('Approve verification error:', error);
      }
    }
  };

  const handleReject = async (userId: string) => {
    if (confirm(t.confirmReject)) {
      try {
        await adminService.rejectVerification(userId);
        setVerifications(prev => prev.filter(v => v.id !== userId));
      } catch (error) {
        console.error('Reject verification error:', error);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text mb-4 sm:mb-0">{t.title}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            void fetchVerifications(page);
          }}
        >
          <Icon name="refresh-cw" size={16} className="mr-2" /> {t.refresh}
        </Button>
      </div>

      <div className="flex flex-col flex-1">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingState />
          </div>
        ) : verifications.length === 0 ? (
          <Card className="py-16 text-center shadow-sm border-border bg-white rounded-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-muted">
              <Icon name="shield-check" size={32} />
            </div>
            <p className="text-text-secondary text-lg">{t.empty}</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 mb-6">
              {verifications.map((user) => (
                <Card key={user.id} className="animate-fade-in shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-2">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full border border-border overflow-hidden shrink-0 flex items-center justify-center bg-surface">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.fullName}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600">
                            <Icon name="user" size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-text">{user.fullName}</h3>
                        <p className="text-sm text-text-muted font-medium">{user.phone}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {t.registered} {new Date(user.createdAt).toLocaleDateString(t.locale)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 items-center md:justify-center py-2 md:py-0 border-t border-b md:border-0 border-border my-2 md:my-0">
                      {user.documentUrl ? (
                        <a 
                          href={user.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Icon name="file-text" size={18} /> {t.viewDoc}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-danger-50 text-danger-600 rounded-lg text-sm font-medium">
                          <Icon name="alert-triangle" size={18} />
                          <span>{t.noDoc}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="danger" className="flex-1 md:flex-none" onClick={() => handleReject(user.id)}>
                        <Icon name="x" size={16} className="mr-1.5" /> {t.reject}
                      </Button>
                      <Button variant="primary" className="flex-1 md:flex-none" onClick={() => handleApprove(user.id)}>
                        <Icon name="check" size={16} className="mr-1.5" /> {t.approve}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
