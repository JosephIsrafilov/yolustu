'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorBanner from '@/components/ui/ErrorBanner';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { paymentsService } from '@/services';
import type { Payment, PaymentStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';

const STATUSES: Array<PaymentStatus | 'all'> = ['all', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded'];

const COPY = {
  az: {
    title: 'Ödənişlər',
    subtitle: 'Booking ödənişləri, provayderlər və refund əməliyyatları.',
    provider: 'Provayder',
    all: 'Hamısı',
    booking: 'Booking',
    amount: 'Məbləğ',
    fee: 'Komissiya',
    driver: 'Sürücü payı',
    status: 'Status',
    created: 'Yaradıldı',
    refund: 'Refund',
    empty: 'Ödəniş tapılmadı',
    loadError: 'Ödənişləri yükləmək alınmadı.',
    actionError: 'Refund alınmadı. Yenidən cəhd edin.',
    retry: 'Yenidən cəhd et',
  },
  ru: {
    title: 'Платежи',
    subtitle: 'Платежи бронирований, провайдеры и возвраты.',
    provider: 'Провайдер',
    all: 'Все',
    booking: 'Booking',
    amount: 'Сумма',
    fee: 'Комиссия',
    driver: 'Доход водителя',
    status: 'Статус',
    created: 'Создан',
    refund: 'Возврат',
    empty: 'Платежи не найдены',
    loadError: 'Не удалось загрузить платежи.',
    actionError: 'Не удалось выполнить возврат. Попробуйте ещё раз.',
    retry: 'Повторить',
  },
  en: {
    title: 'Payments',
    subtitle: 'Booking payments, providers, and refunds.',
    provider: 'Provider',
    all: 'All',
    booking: 'Booking',
    amount: 'Amount',
    fee: 'Fee',
    driver: 'Driver amount',
    status: 'Status',
    created: 'Created',
    refund: 'Refund',
    empty: 'No payments found',
    loadError: 'Could not load payments.',
    actionError: 'Refund failed. Please try again.',
    retry: 'Retry',
  },
} as const;

export default function AdminPaymentsPage() {
  const language = useAppStore((state) => state.language);
  const copy = COPY[language];
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [status, setStatus] = React.useState<PaymentStatus | 'all'>('all');
  const [provider, setProvider] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = React.useState<string | null>(null);
  const limit = 20;

  const loadPayments = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await paymentsService.listAdminPayments({
        page,
        limit,
        status,
        provider: provider.trim() || undefined,
      });
      setPayments(response.items);
      setPages(response.pages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, provider, status]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPayments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPayments]);

  const refund = async (paymentId: string) => {
    setActionError(null);
    setPendingPaymentId(paymentId);
    try {
      await paymentsService.refund(paymentId);
      await loadPayments();
    } catch {
      setActionError(copy.actionError);
    } finally {
      setPendingPaymentId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">{copy.title}</h1>
        <p className="text-sm text-text-muted">{copy.subtitle}</p>
      </div>
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-text">
            {copy.status}
            <select
              className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PaymentStatus | 'all');
                setPage(1);
              }}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-text">
            {copy.provider}
            <input
              className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm"
              value={provider}
              placeholder="mock"
              onChange={(event) => {
                setProvider(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      </Card>
      {actionError && (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.booking}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.provider}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.amount}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.fee}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.driver}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.status}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-left">{copy.created}</th>
              <th className="px-3 py-2.5 md:px-4 md:py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-6 w-14 rounded-full" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : loadError ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center"><ErrorBanner message={copy.loadError} onRetry={() => void loadPayments()} retryLabel={copy.retry} /></td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-text-muted">{copy.empty}</td></tr>
            ) : payments.map((payment) => (
              <tr key={payment.id} className="transition-colors duration-150 hover:bg-surface-dim">
                <td className="px-3 py-2.5 md:px-4 md:py-3">
                  <span 
                    title={payment.bookingId} 
                    className="truncate block max-w-[80px] md:max-w-[120px] font-mono text-xs"
                  >
                    {payment.bookingId}
                  </span>
                </td>
                <td className="px-3 py-2.5 md:px-4 md:py-3">{payment.provider}</td>
                <td className="px-3 py-2.5 md:px-4 md:py-3 font-semibold text-text">{formatPrice(payment.amount)}</td>
                <td className="px-3 py-2.5 md:px-4 md:py-3 text-text">{formatPrice(payment.serviceFee)}</td>
                <td className="px-3 py-2.5 md:px-4 md:py-3 text-text">{formatPrice(payment.driverAmount)}</td>
                <td className="px-3 py-2.5 md:px-4 md:py-3">{payment.status}</td>
                <td className="px-3 py-2.5 md:px-4 md:py-3 text-text-muted text-xs">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5 md:px-4 md:py-3 text-right">
                  {payment.status === 'succeeded' && (
                    <Button 
                      size="sm" 
                      variant="danger" 
                      disabled={pendingPaymentId === payment.id} 
                      onClick={() => refund(payment.id)}
                      className="h-8 px-2 text-xs gap-1"
                      title={copy.refund}
                    >
                      <Icon name="refresh-cw" size={14} />
                      <span className="hidden lg:inline">{copy.refund}</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && pages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
        </div>
      )}
    </AdminLayout>
  );
}
