'use client';

import React from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { paymentsService } from '@/services';
import type { WalletTransaction, Payout } from '@/types';
import type { WalletTransactionFilter } from '@/services/contracts/payments-service';
import { formatPrice } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import TopUpModal from './TopUpModal';
import PayoutModal from './PayoutModal';
import { getTransactionMeta, transactionLabel } from './meta';
import { formatRelativeTime, formatAbsoluteTime, groupTransactionsByDay } from './format';
import { useSearchParams, useRouter } from 'next/navigation';

const TRANSACTIONS_PER_PAGE = 20;

const WALLET_COPY = {
  az: {
    title: 'Balans',
    subtitle: 'Rezervasiya, qaytarma və sürücü gəlirlərini bir yerdən idarə edin.',
    available: 'Mövcud balans',
    availableHint: 'Rezervasiya və qaytarmalar üçün istifadə oluna bilər.',
    pending: 'Gözləyən gəlir',
    earned: 'Tamamlanmış gəlir',
    spent: 'Ödənişlər',
    refunded: 'Qaytarmalar',
    history: 'Əməliyyat tarixçəsi',
    historyHint: 'Ödənişlər, balans artırmaları, qaytarmalar və gəlirlər burada görünəcək.',
    emptyDesc: 'Ödənişləriniz, balans artırmalarınız və qaytarmalarınız burada görünəcək.',
    topup: 'Balansı artır',
    withdraw: 'Çıxarış',
    loadMore: 'Daha çox',
    loadError: 'Məlumat yüklənmədi.',
    retry: 'Yenidən cəhd et',
    payouts: 'Çıxarış sorğuları',
    payoutsHint: 'Çıxarış sorğularınız və statusları burada görünəcək.',
    payoutsEmpty: 'Hələ çıxarış sorğusu yoxdur',
    empty: {
      all: 'Hələ balans əməliyyatı yoxdur',
      payments: 'Hələ ödəniş yoxdur',
      topups: 'Hələ balans artırma yoxdur',
      refunds: 'Hələ qaytarma yoxdur',
      income: 'Hələ gəlir yoxdur',
    },
    statuses: {
      posted: 'Tamamlandı',
      pending: 'Gözləyir',
      reversed: 'Geri qaytarıldı',
    },
    payoutStatuses: {
      pending: 'Gözləyir',
      completed: 'Tamamlandı',
      rejected: 'Rədd edildi',
    },
    filters: {
      all: 'Hamısı',
      payments: 'Ödənişlər',
      topups: 'Artırmalar',
      refunds: 'Qaytarmalar',
      income: 'Gəlir',
    },
  },
  ru: {
    title: 'Баланс',
    subtitle: 'Управляйте оплатами, возвратами и доходом водителя в одном месте.',
    available: 'Доступный баланс',
    availableHint: 'Можно использовать для бронирований и возвратов.',
    pending: 'Ожидаемый доход',
    earned: 'Завершённый доход',
    spent: 'Платежи',
    refunded: 'Возвраты',
    history: 'История операций',
    historyHint: 'Здесь будут отображаться оплаты, пополнения, возвраты и поступления.',
    emptyDesc: 'Ваши платежи, пополнения и возвраты появятся здесь.',
    topup: 'Пополнить',
    withdraw: 'Вывести',
    loadMore: 'Показать ещё',
    loadError: 'Не удалось загрузить данные.',
    retry: 'Повторить',
    payouts: 'Запросы на вывод',
    payoutsHint: 'Ваши запросы на вывод и их статусы появятся здесь.',
    payoutsEmpty: 'Запросов на вывод пока нет',
    empty: {
      all: 'Операций по балансу пока нет',
      payments: 'Платежей пока нет',
      topups: 'Пополнений пока нет',
      refunds: 'Возвратов пока нет',
      income: 'Поступлений пока нет',
    },
    statuses: {
      posted: 'Проведено',
      pending: 'В ожидании',
      reversed: 'Отменено',
    },
    payoutStatuses: {
      pending: 'В ожидании',
      completed: 'Завершено',
      rejected: 'Отклонено',
    },
    filters: {
      all: 'Все',
      payments: 'Платежи',
      topups: 'Пополнения',
      refunds: 'Возвраты',
      income: 'Доход',
    },
  },
  en: {
    title: 'Wallet',
    subtitle: 'Manage bookings, refunds and driver earnings from one dashboard.',
    available: 'Available balance',
    availableHint: 'Available for bookings and refunds.',
    pending: 'Pending income',
    earned: 'Completed income',
    spent: 'Payments',
    refunded: 'Refunds',
    history: 'Transaction history',
    historyHint: 'Your payments, top-ups, refunds and income will appear here.',
    emptyDesc: 'Your payments, top-ups and refunds will appear here.',
    topup: 'Top up',
    withdraw: 'Withdraw',
    loadMore: 'Load more',
    loadError: 'Could not load data.',
    retry: 'Try again',
    payouts: 'Payout requests',
    payoutsHint: 'Your payout requests and their statuses will appear here.',
    payoutsEmpty: 'No payout requests yet',
    empty: {
      all: 'No wallet operations yet',
      payments: 'No payments yet',
      topups: 'No top-ups yet',
      refunds: 'No refunds yet',
      income: 'No income yet',
    },
    statuses: {
      posted: 'Completed',
      pending: 'Pending',
      reversed: 'Reversed',
    },
    payoutStatuses: {
      pending: 'Pending',
      completed: 'Completed',
      rejected: 'Rejected',
    },
    filters: {
      all: 'All',
      payments: 'Payments',
      topups: 'Top-ups',
      refunds: 'Refunds',
      income: 'Income',
    },
  },
} as const;

const METRIC_META = [
  { key: 'earned', icon: 'banknote' as const, accent: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'spent', icon: 'credit-card' as const, accent: 'text-[#054752] bg-[#edfcff] border-[#c0e3ea]' },
  { key: 'refunded', icon: 'refresh-cw' as const, accent: 'text-sky-700 bg-sky-50 border-sky-200' },
] as const;

const STATUS_VARIANT = {
  posted: 'success',
  pending: 'warning',
  reversed: 'muted',
} as const;

const PAYOUT_STATUS_VARIANT = {
  pending: 'warning',
  completed: 'success',
  rejected: 'danger',
} as const;

/**
 * Resolves the detail route a transaction row should open, preferring the ride
 * (trip) detail when present, then the bookings list. Rows with neither id stay
 * non-interactive.
 */
function transactionHref(transaction: WalletTransaction): string | null {
  if (transaction.rideId) return ROUTES.tripDetails(transaction.rideId);
  if (transaction.bookingId) return ROUTES.bookings;
  return null;
}

function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function WalletContent() {
  const language = useAppStore((state) => state.language);
  const copy = WALLET_COPY[language];
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTopup = searchParams.get('topup') ? Number(searchParams.get('topup')) : undefined;
  const returnTo = searchParams.get('returnTo');
  const [isTopUpOpen, setIsTopUpOpen] = React.useState(Boolean(initialTopup));
  const [isPayoutOpen, setIsPayoutOpen] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<WalletTransactionFilter>('all');

  // One idempotency key per intent (modal open), not per request. A double
  // click or an in-modal retry reuses the same key so the backend dedupes;
  // each fresh open mints a new key. Lazy init covers the deep-link case where
  // the top-up modal is already open on mount.
  const [topupKey, setTopupKey] = React.useState(() => crypto.randomUUID());
  const [payoutKey, setPayoutKey] = React.useState(() => crypto.randomUUID());

  const openTopUp = () => {
    setTopupKey(crypto.randomUUID());
    setIsTopUpOpen(true);
  };
  const openPayout = () => {
    setPayoutKey(crypto.randomUUID());
    setIsPayoutOpen(true);
  };

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsService.getWallet(),
  });
  const wallet = walletQuery.data;

  const transactionsQuery = useInfiniteQuery({
    queryKey: ['wallet-transactions', activeFilter],
    queryFn: ({ pageParam }) =>
      paymentsService.getWalletTransactions(pageParam, TRANSACTIONS_PER_PAGE, activeFilter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined),
  });

  const payoutsQuery = useQuery({
    queryKey: ['wallet-payouts'],
    queryFn: () => paymentsService.getPayouts(1, 50),
  });

  const transactions = React.useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [transactionsQuery.data],
  );

  const groupedTransactions = React.useMemo(
    () => groupTransactionsByDay(transactions, language),
    [transactions, language],
  );

  const invalidateWallet = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    void queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
  };

  const topupMutation = useMutation({
    mutationFn: (amount: number) => paymentsService.topupWallet(amount, topupKey),
    onSuccess: () => {
      invalidateWallet();
    },
  });

  const payoutMutation = useMutation({
    mutationFn: (amount: number) => paymentsService.requestPayout(amount, payoutKey),
    onSuccess: () => {
      invalidateWallet();
      void queryClient.invalidateQueries({ queryKey: ['wallet-payouts'] });
    },
  });

  const handleTopup = async (amount: number) => {
    await topupMutation.mutateAsync(amount);
    if (returnTo) router.push(returnTo);
  };

  const handlePayout = async (amount: number) => {
    await payoutMutation.mutateAsync(amount);
  };

  const last4 = (wallet?.userId ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '0000';
  const availableBalance = wallet?.availableBalance ?? 0;
  const payouts = payoutsQuery.data?.items ?? [];

  const isInitialLoading = walletQuery.isLoading || transactionsQuery.isLoading;
  const hasLoadError = walletQuery.isError || transactionsQuery.isError;

  if (isInitialLoading) {
    return (
      <WebLayout title={copy.title}>
        <ProtectedRoute>
          <WalletSkeleton />
        </ProtectedRoute>
      </WebLayout>
    );
  }

  return (
    <WebLayout title={copy.title}>
      <ProtectedRoute>
        {hasLoadError ? (
          <Card className="p-8">
            <EmptyState
              icon={<Icon name="alert-triangle" size={28} />}
              title={copy.loadError}
              action={
                <Button
                  onClick={() => {
                    void walletQuery.refetch();
                    void transactionsQuery.refetch();
                  }}
                >
                  <Icon name="refresh-cw" size={16} />
                  {copy.retry}
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Fintech balance card */}
            <Card className="relative overflow-hidden border-[#bfe2ea] bg-[linear-gradient(135deg,#042f36_0%,#0c4f5a_55%,#15717e_100%)] p-0 text-white shadow-[0_20px_50px_rgba(4,47,54,0.18)]">
              {/* Decorative glass orbs */}
              <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-12 h-60 w-60 rounded-full bg-teal-300/10 blur-2xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />

              <div className="relative grid gap-7 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100/70">{copy.available}</p>
                    <AnimatedCounter
                      key={`${availableBalance}`}
                      value={formatPrice(availableBalance)}
                      duration={900}
                      className="mt-2 block text-4xl font-black tracking-tight sm:text-5xl"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {/* EMV-style chip */}
                    <span className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80 shadow-inner ring-1 ring-white/30" />
                    <span className="font-mono text-sm tracking-[0.3em] text-white/70">•••• {last4}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-50 backdrop-blur">
                    <Icon name="clock" size={13} />
                    {copy.pending}: {formatPrice(wallet?.pendingBalance ?? 0)}
                  </span>
                  <p className="max-w-md text-sm text-teal-50/70">{copy.availableHint}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={openTopUp}
                    className="bg-white text-[#04313a] hover:bg-[#f4fdff] sm:w-auto"
                  >
                    <Icon name="plus" size={16} />
                    {copy.topup}
                  </Button>
                  <button
                    type="button"
                    onClick={openPayout}
                    disabled={availableBalance <= 0}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/50 disabled:hover:bg-white/5"
                  >
                    <Icon name="upload" size={16} />
                    {copy.withdraw}
                  </button>
                </div>
              </div>
            </Card>

            {/* Metric strip */}
            <div className="grid gap-4 sm:grid-cols-3">
              {METRIC_META.map((item) => {
                const value =
                  item.key === 'earned'
                    ? wallet?.totalEarned ?? 0
                    : item.key === 'spent'
                      ? wallet?.totalSpent ?? 0
                      : wallet?.totalRefunded ?? 0;

                return (
                  <Card key={item.key} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#5d6e73]">{copy[item.key]}</p>
                        <p className="mt-3 text-2xl font-bold text-[#002f37]">{formatPrice(value)}</p>
                      </div>
                      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${item.accent}`}>
                        <Icon name={item.icon} size={18} />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Transaction history */}
            <Card className="p-5 md:p-6">
              <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#002f37]">{copy.history}</h2>
                  <p className="mt-1 text-sm text-[#5d6e73]">{copy.historyHint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(copy.filters) as WalletTransactionFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeFilter === filter
                          ? 'bg-[#054752] text-white'
                          : 'bg-[#f2f8f9] text-[#486067] hover:bg-[#e4f2f5]'
                      }`}
                    >
                      {copy.filters[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5">
                {transactions.length === 0 ? (
                  <EmptyState
                    className="py-12"
                    icon={<Icon name="credit-card" size={28} />}
                    title={copy.empty[activeFilter]}
                    description={copy.emptyDesc}
                  />
                ) : (
                  <div className="space-y-6">
                    {groupedTransactions.map((group) => (
                      <div key={group.key} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#7a8b8f]">{group.label}</span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        {group.transactions.map((transaction) => {
                          const meta = getTransactionMeta(transaction.type);
                          const href = transactionHref(transaction);
                          const isInteractive = href !== null;

                          return (
                            <div
                              key={transaction.id}
                              role={isInteractive ? 'button' : undefined}
                              tabIndex={isInteractive ? 0 : undefined}
                              onClick={isInteractive ? () => router.push(href) : undefined}
                              onKeyDown={
                                isInteractive
                                  ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(href);
                                      }
                                    }
                                  : undefined
                              }
                              className={`flex flex-col gap-3 rounded-2xl border border-border bg-[#fbfeff] p-4 md:flex-row md:items-center md:justify-between ${
                                isInteractive
                                  ? 'cursor-pointer transition-colors hover:border-brand-200 hover:bg-[#f4fbfd] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
                                  : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                                  transaction.direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  <Icon name={meta.icon} size={16} />
                                </span>
                                <div>
                                  <p className="flex items-center gap-1.5 font-semibold text-[#002f37]">
                                    {transactionLabel(transaction.type, language)}
                                    {isInteractive && <Icon name="chevron-right" size={14} className="text-[#9bb0b5]" />}
                                  </p>
                                  <p
                                    className="mt-1 text-sm text-[#5d6e73]"
                                    title={formatAbsoluteTime(transaction.createdAt, language)}
                                  >
                                    {formatRelativeTime(transaction.createdAt, language)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1">
                                <p className={`text-lg font-bold ${transaction.direction === 'credit' ? 'text-emerald-600' : 'text-[#002f37]'}`}>
                                  {transaction.direction === 'credit' ? '+' : '-'}{formatPrice(transaction.amount)}
                                </p>
                                <Badge variant={STATUS_VARIANT[transaction.status]}>
                                  {copy.statuses[transaction.status]}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {transactionsQuery.hasNextPage && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="outline"
                          onClick={() => void transactionsQuery.fetchNextPage()}
                          loading={transactionsQuery.isFetchingNextPage}
                        >
                          {copy.loadMore}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Payout requests */}
            <Card className="p-5 md:p-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-[#002f37]">{copy.payouts}</h2>
                <p className="mt-1 text-sm text-[#5d6e73]">{copy.payoutsHint}</p>
              </div>

              <div className="pt-5">
                {payoutsQuery.isError ? (
                  <EmptyState
                    className="py-12"
                    icon={<Icon name="alert-triangle" size={28} />}
                    title={copy.loadError}
                    action={
                      <Button variant="outline" onClick={() => void payoutsQuery.refetch()}>
                        <Icon name="refresh-cw" size={16} />
                        {copy.retry}
                      </Button>
                    }
                  />
                ) : payouts.length === 0 ? (
                  <EmptyState
                    className="py-12"
                    icon={<Icon name="upload" size={28} />}
                    title={copy.payoutsEmpty}
                    description={copy.payoutsHint}
                  />
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout: Payout) => (
                      <div
                        key={payout.id}
                        className="flex flex-col gap-3 rounded-2xl border border-border bg-[#fbfeff] p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <Icon name="upload" size={16} />
                          </span>
                          <div>
                            <p className="font-semibold text-[#002f37]">{copy.withdraw}</p>
                            <p
                              className="mt-1 text-sm text-[#5d6e73]"
                              title={formatAbsoluteTime(payout.createdAt, language)}
                            >
                              {formatRelativeTime(payout.createdAt, language)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1">
                          <p className="text-lg font-bold text-[#002f37]">-{formatPrice(payout.amount)}</p>
                          <Badge variant={PAYOUT_STATUS_VARIANT[payout.status]}>
                            {copy.payoutStatuses[payout.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        <TopUpModal
          key={topupKey}
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          onSuccess={handleTopup}
          isLoading={topupMutation.isPending}
          initialAmount={initialTopup}
        />
        <PayoutModal
          isOpen={isPayoutOpen}
          onClose={() => setIsPayoutOpen(false)}
          availableBalance={availableBalance}
          onSubmit={handlePayout}
          isLoading={payoutMutation.isPending}
        />
      </ProtectedRoute>
    </WebLayout>
  );
}

export default function WalletPage() {
  const language = useAppStore((state) => state.language);
  const copy = WALLET_COPY[language];

  return (
    <React.Suspense fallback={<WebLayout title={copy.title}><WalletSkeleton /></WebLayout>}>
      <WalletContent />
    </React.Suspense>
  );
}
