'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';
import { paymentsService } from '@/services';
import type { Wallet, WalletTransaction, WalletTransactionType } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import TopUpModal from './TopUpModal';
import { useSearchParams, useRouter } from 'next/navigation';

type WalletFilter = 'all' | 'payments' | 'topups' | 'refunds' | 'income';

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
    empty: 'Hələ balans əməliyyatı yoxdur',
    emptyDesc: 'Ödənişləriniz, balans artırmalarınız və qaytarmalarınız burada görünəcək.',
    topup: 'Balansı artır',
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
    empty: 'Операций по балансу пока нет',
    emptyDesc: 'Ваши платежи, пополнения и возвраты появятся здесь.',
    topup: 'Пополнить',
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
    empty: 'No wallet operations yet',
    emptyDesc: 'Your payments, top-ups and refunds will appear here.',
    topup: 'Top up',
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
  { key: 'pending', icon: 'clock' as const, accent: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'earned', icon: 'banknote' as const, accent: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'spent', icon: 'credit-card' as const, accent: 'text-[#054752] bg-[#edfcff] border-[#c0e3ea]' },
  { key: 'refunded', icon: 'refresh-cw' as const, accent: 'text-sky-700 bg-sky-50 border-sky-200' },
] as const;

function transactionMatchesFilter(transaction: WalletTransaction, filter: WalletFilter) {
  if (filter === 'all') return true;
  if (filter === 'refunds') return transaction.type === 'refund';
  if (filter === 'income') return transaction.direction === 'credit' && transaction.type !== 'refund';
  if (filter === 'payments') return transaction.direction === 'debit' && transaction.type !== 'refund';
  if (filter === 'topups') return transaction.type === 'adjustment';
  return true;
}

function transactionLabel(type: WalletTransactionType, language: keyof typeof WALLET_COPY) {
  const labels: Record<WalletTransactionType, Record<keyof typeof WALLET_COPY, string>> = {
    passenger_payment: { az: 'Sərnişin ödənişi', ru: 'Оплата пассажира', en: 'Passenger payment' },
    platform_fee: { az: 'Platforma komissiyası', ru: 'Комиссия платформы', en: 'Platform fee' },
    driver_pending_earning: { az: 'Gözləyən gəlir', ru: 'Ожидаемый доход', en: 'Pending income' },
    driver_available_earning: { az: 'Aktiv gəlir', ru: 'Доступный доход', en: 'Available income' },
    refund: { az: 'Qaytarma', ru: 'Возврат', en: 'Refund' },
    payout: { az: 'Çıxarış', ru: 'Выплата', en: 'Payout' },
    adjustment: { az: 'Balans artırma', ru: 'Пополнение', en: 'Top-up' },
  };

  return labels[type][language];
}

function WalletContent() {
  const language = useAppStore((state) => state.language);
  const copy = WALLET_COPY[language];
  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState<WalletFilter>('all');
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTopup = searchParams.get('topup') ? Number(searchParams.get('topup')) : undefined;
  const returnTo = searchParams.get('returnTo');
  const [isTopUpOpen, setIsTopUpOpen] = React.useState(Boolean(initialTopup));
  const [isTopUpLoading, setIsTopUpLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadWallet() {
      try {
        const [walletResponse, txResponse] = await Promise.all([
          paymentsService.getWallet(),
          paymentsService.getWalletTransactions(1, 50),
        ]);

        if (!cancelled) {
          setWallet(walletResponse);
          setTransactions(txResponse.items);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadWallet();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTopup = async (amount: number) => {
    try {
      setIsTopUpLoading(true);
      await paymentsService.topupWallet(amount);
      const [walletResponse, txResponse] = await Promise.all([
        paymentsService.getWallet(),
        paymentsService.getWalletTransactions(1, 50),
      ]);
      setWallet(walletResponse);
      setTransactions(txResponse.items);
      if (returnTo) router.push(returnTo);
    } catch (error) {
      alert('Top up failed');
      throw error;
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const filteredTransactions = React.useMemo(
    () => transactions.filter((transaction) => transactionMatchesFilter(transaction, activeFilter)),
    [transactions, activeFilter],
  );

  return (
    <WebLayout title={copy.title}>
      <ProtectedRoute>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden border-[#bfe2ea] bg-[linear-gradient(135deg,#042f36_0%,#0c4f5a_55%,#15717e_100%)] p-0 text-white shadow-[0_20px_50px_rgba(4,47,54,0.18)]">
              <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-8">
                <div>
                  <p className="text-sm font-medium text-white/70">{copy.subtitle}</p>
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/70">{copy.available}</p>
                  <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{formatPrice(wallet?.availableBalance ?? 0)}</p>
                  <p className="mt-3 max-w-md text-sm text-teal-50/75">{copy.availableHint}</p>
                </div>
                <div className="flex flex-col items-stretch gap-3 md:min-w-[220px]">
                  <Button
                    onClick={() => setIsTopUpOpen(true)}
                    className="w-full bg-white text-[#04313a] hover:bg-[#f4fdff]"
                  >
                    <Icon name="plus" size={16} />
                    {copy.topup}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {METRIC_META.map((item) => {
                const value =
                  item.key === 'pending'
                    ? wallet?.pendingBalance ?? 0
                    : item.key === 'earned'
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

            <Card className="p-5 md:p-6">
              <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#002f37]">{copy.history}</h2>
                  <p className="mt-1 text-sm text-[#5d6e73]">{copy.historyHint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(copy.filters) as WalletFilter[]).map((filter) => (
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
                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    className="py-12"
                    icon={<Icon name="credit-card" size={28} />}
                    title={copy.empty}
                    description={copy.emptyDesc}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col gap-3 rounded-2xl border border-border bg-[#fbfeff] p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                            transaction.direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                          }`}>
                            <Icon name={transaction.direction === 'credit' ? 'plus' : 'minus'} size={16} />
                          </span>
                          <div>
                            <p className="font-semibold text-[#002f37]">{transactionLabel(transaction.type, language)}</p>
                            <p className="mt-1 text-sm text-[#5d6e73]">{new Date(transaction.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="md:text-right">
                          <p className={`text-lg font-bold ${transaction.direction === 'credit' ? 'text-emerald-600' : 'text-[#002f37]'}`}>
                            {transaction.direction === 'credit' ? '+' : '-'}{formatPrice(transaction.amount)}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-[#7a8b8f]">{transaction.status}</p>
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
          key={initialTopup ?? 'default-topup'}
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          onSuccess={handleTopup}
          isLoading={isTopUpLoading}
          initialAmount={initialTopup}
        />
      </ProtectedRoute>
    </WebLayout>
  );
}

export default function WalletPage() {
  const language = useAppStore((state) => state.language);
  const copy = WALLET_COPY[language];

  return (
    <React.Suspense fallback={<WebLayout title={copy.title}><LoadingState /></WebLayout>}>
      <WalletContent />
    </React.Suspense>
  );
}
