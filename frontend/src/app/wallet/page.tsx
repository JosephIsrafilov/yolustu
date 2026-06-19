'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WebLayout from '@/components/layout/WebLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/lib/routes';
import { formatPrice } from '@/lib/utils';
import { paymentsService } from '@/services';
import type { WalletTransactionFilter } from '@/services/contracts/payments-service';
import { useAppStore } from '@/store/useAppStore';
import type { Payout, Wallet, WalletTransaction } from '@/types';
import { formatAbsoluteTime, formatRelativeTime, groupTransactionsByDay } from './format';
import { getTransactionMeta, transactionLabel } from './meta';

const PayoutModal = dynamic(() => import('./PayoutModal'), { ssr: false });

const TRANSACTIONS_PER_PAGE = 12;

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'maestro' | 'unionpay' | 'unknown';

const CARD_NETWORKS: Record<Exclude<CardNetwork, 'unknown'>, { label: string; pattern: RegExp; lengths: number[]; cvc: number; color: string }> = {
  visa: { label: 'Visa', pattern: /^4/, lengths: [13, 16, 19], cvc: 3, color: 'bg-[#1746a2]' },
  mastercard: { label: 'Mastercard', pattern: /^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/, lengths: [16], cvc: 3, color: 'bg-[#d45721]' },
  amex: { label: 'Amex', pattern: /^3[47]/, lengths: [15], cvc: 4, color: 'bg-[#236f9f]' },
  discover: { label: 'Discover', pattern: /^(6011|65|64[4-9])/, lengths: [16, 19], cvc: 3, color: 'bg-[#b86a24]' },
  maestro: { label: 'Maestro', pattern: /^(50|5[6-9]|6)/, lengths: [12, 13, 14, 15, 16, 17, 18, 19], cvc: 3, color: 'bg-[#1f5f8f]' },
  unionpay: { label: 'UnionPay', pattern: /^62/, lengths: [16, 17, 18, 19], cvc: 3, color: 'bg-[#be2f2f]' },
};

const WALLET_COPY = {
  az: {
    title: 'Balans',
    subtitle: 'Kartla artırın, balansdan ödəyin və bütün əməliyyatları izləyin.',
    available: 'Mövcud balans',
    pending: 'Gözləyən gəlir',
    reserved: 'Rezerv edilmiş',
    topup: 'Balansı artır',
    withdraw: 'Çıxarış',
    earned: 'Gəlir',
    spent: 'Ödənilib',
    refunded: 'Qaytarılıb',
    cardTitle: 'Kartla balans artır',
    cardNumber: 'Kart nömrəsi',
    cardholder: 'Kart sahibi',
    expiry: 'Bitmə tarixi',
    cvc: 'CVC',
    amount: 'Məbləğ',
    network: 'Kart növü',
    quickAmounts: 'Sürətli məbləğlər',
    pay: 'Artır',
    loadError: 'Məlumat yüklənmədi.',
    loadMore: 'Daha çox',
    retry: 'Yenidən cəhd et',
    formError: 'Kart məlumatlarını və məbləği yoxlayın.',
    success: 'Balans artırıldı.',
    history: 'Əməliyyatlar',
    emptyDesc: 'Ödənişlər, balans artırmaları və qaytarmalar burada görünəcək.',
    payouts: 'Çıxarışlar',
    payoutsHint: 'Çıxarış sorğuları və statusları.',
    payoutsEmpty: 'Hələ çıxarış yoxdur',
    showPayouts: 'Çıxarışları göstər',
    hidePayouts: 'Çıxarışları gizlət',
    empty: {
      all: 'Hələ əməliyyat yoxdur',
      payments: 'Hələ ödəniş yoxdur',
      topups: 'Hələ balans artırma yoxdur',
      refunds: 'Hələ qaytarma yoxdur',
      income: 'Hələ gəlir yoxdur',
      reservations: 'Hələ rezerv əməliyyatı yoxdur',
    },
    statuses: {
      posted: 'Tamamlandı',
      pending: 'Gözləyir',
      captured: 'Ödənişə çevrildi',
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
      reservations: 'Rezervlər',
    },
  },
  ru: {
    title: 'Кошелек',
    subtitle: 'Пополняйте картой, платите из баланса и отслеживайте операции.',
    available: 'Доступный баланс',
    pending: 'Ожидаемый доход',
    reserved: 'Зарезервировано',
    topup: 'Пополнить',
    withdraw: 'Вывести',
    earned: 'Доход',
    spent: 'Оплачено',
    refunded: 'Возвраты',
    cardTitle: 'Пополнение картой',
    cardNumber: 'Номер карты',
    cardholder: 'Имя на карте',
    expiry: 'Срок',
    cvc: 'CVC',
    amount: 'Сумма',
    network: 'Тип карты',
    quickAmounts: 'Быстрые суммы',
    pay: 'Пополнить',
    loadError: 'Не удалось загрузить данные.',
    loadMore: 'Показать ещё',
    retry: 'Повторить',
    formError: 'Проверьте карту и сумму.',
    success: 'Баланс пополнен.',
    history: 'Операции',
    emptyDesc: 'Платежи, пополнения и возвраты появятся здесь.',
    payouts: 'Выводы',
    payoutsHint: 'Запросы на вывод и их статусы.',
    payoutsEmpty: 'Выводов пока нет',
    showPayouts: 'Показать выводы',
    hidePayouts: 'Скрыть выводы',
    empty: {
      all: 'Операций пока нет',
      payments: 'Платежей пока нет',
      topups: 'Пополнений пока нет',
      refunds: 'Возвратов пока нет',
      income: 'Дохода пока нет',
      reservations: 'Операций резервирования пока нет',
    },
    statuses: {
      posted: 'Проведено',
      pending: 'В ожидании',
      captured: 'Списано',
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
      reservations: 'Резервы',
    },
  },
  en: {
    title: 'Wallet',
    subtitle: 'Top up by card, pay from balance, and track every wallet movement.',
    available: 'Available balance',
    pending: 'Pending income',
    reserved: 'Reserved',
    topup: 'Top up',
    withdraw: 'Withdraw',
    earned: 'Earned',
    spent: 'Spent',
    refunded: 'Refunded',
    cardTitle: 'Top up by card',
    cardNumber: 'Card number',
    cardholder: 'Cardholder',
    expiry: 'Expiry',
    cvc: 'CVC',
    amount: 'Amount',
    network: 'Card type',
    quickAmounts: 'Quick amounts',
    pay: 'Add money',
    loadError: 'Could not load wallet data.',
    loadMore: 'Load more',
    retry: 'Try again',
    formError: 'Check the card details and amount.',
    success: 'Wallet topped up.',
    history: 'Transactions',
    emptyDesc: 'Payments, top-ups and refunds will appear here.',
    payouts: 'Payouts',
    payoutsHint: 'Payout requests and statuses.',
    payoutsEmpty: 'No payouts yet',
    showPayouts: 'Show payouts',
    hidePayouts: 'Hide payouts',
    empty: {
      all: 'No transactions yet',
      payments: 'No payments yet',
      topups: 'No top-ups yet',
      refunds: 'No refunds yet',
      income: 'No income yet',
      reservations: 'No reservation transactions yet',
    },
    statuses: {
      posted: 'Completed',
      pending: 'Pending',
      captured: 'Captured',
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
      reservations: 'Reservations',
    },
  },
} as const;

const STATUS_VARIANT = {
  posted: 'success',
  pending: 'warning',
  captured: 'success',
  reversed: 'muted',
} as const;

const PAYOUT_STATUS_VARIANT = {
  pending: 'warning',
  completed: 'success',
  rejected: 'danger',
} as const;

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function buildPreviewMask(formatted: string, network: CardNetwork): string {
  const groups = network === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const digits = digitsOnly(formatted);
  let cursor = 0;
  return groups
    .map((size) => {
      const chunk = digits.slice(cursor, cursor + size);
      cursor += size;
      return chunk.padEnd(size, '•');
    })
    .join(' ');
}

function detectCardNetwork(number: string): CardNetwork {
  const digits = digitsOnly(number);
  const match = Object.entries(CARD_NETWORKS).find(([, meta]) => meta.pattern.test(digits));
  return (match?.[0] as CardNetwork | undefined) ?? 'unknown';
}

function formatCardNumber(value: string, network: CardNetwork) {
  const digits = digitsOnly(value).slice(0, 19);
  const groups = network === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const parts: string[] = [];
  let index = 0;
  groups.forEach((size) => {
    const part = digits.slice(index, index + size);
    if (part) parts.push(part);
    index += size;
  });
  return parts.join(' ');
}

function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidLuhn(value: string) {
  const digits = digitsOnly(value);
  if (digits.length < 12) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value: string) {
  const [monthText, yearText] = value.split('/');
  if (!monthText || !yearText || yearText.length !== 2) return false;
  const month = Number(monthText);
  if (month < 1 || month > 12) return false;
  return new Date(Number(`20${yearText}`), month, 0, 23, 59, 59) >= new Date();
}

function transactionHref(transaction: WalletTransaction): string | null {
  if (transaction.rideId) return ROUTES.tripDetails(transaction.rideId);
  if (transaction.bookingId) return ROUTES.bookings;
  return null;
}

function fallbackWallet(userId: string | undefined): Wallet {
  return {
    userId: userId ?? 'wallet',
    availableBalance: 0,
    pendingBalance: 0,
    currency: 'AZN',
    totalEarned: 0,
    totalSpent: 0,
    totalRefunded: 0,
  };
}

function WalletSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
    </div>
  );
}

function WalletContent() {
  const language = useAppStore((state) => state.language);
  const currentUser = useAppStore((state) => state.currentUser);
  const activeRole = useAppStore((state) => state.activeRole);
  const isDriver = activeRole === 'driver';

  const copy = WALLET_COPY[language];
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const initialTopup = Number(searchParams.get('topup')) || 25;

  const [activeFilter, setActiveFilter] = React.useState<WalletTransactionFilter>('all');
  const [isPayoutOpen, setIsPayoutOpen] = React.useState(false);
  const [isPayoutsOpen, setIsPayoutsOpen] = React.useState(false);
  const [topupKey, setTopupKey] = React.useState(() => crypto.randomUUID());
  const [payoutKey, setPayoutKey] = React.useState(() => crypto.randomUUID());
  const [amount, setAmount] = React.useState<number | ''>(initialTopup);
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardholder, setCardholder] = React.useState(currentUser?.fullName?.toUpperCase() ?? '');
  const [expiry, setExpiry] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [formMessage, setFormMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsService.getWallet(),
    staleTime: 60 * 1000,
  });

  const transactionsQuery = useInfiniteQuery({
    queryKey: ['wallet-transactions', activeFilter],
    queryFn: ({ pageParam }) =>
      paymentsService.getWalletTransactions(pageParam, TRANSACTIONS_PER_PAGE, activeFilter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined),
    enabled: walletQuery.isSuccess,
    staleTime: 60 * 1000,
  });

  const payoutsQuery = useQuery({
    queryKey: ['wallet-payouts'],
    queryFn: () => paymentsService.getPayouts(1, 20),
    enabled: isPayoutsOpen && isDriver,
    staleTime: 60 * 1000,
  });

  const wallet = walletQuery.data ?? fallbackWallet(currentUser?.id);
  const network = detectCardNetwork(cardNumber);
  const networkMeta = network === 'unknown' ? null : CARD_NETWORKS[network];
  const cardDigits = digitsOnly(cardNumber);
  const maskedCard = buildPreviewMask(cardNumber, network);
  const transactions = transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const groupedTransactions = groupTransactionsByDay(transactions, language);
  const payouts = payoutsQuery.data?.items ?? [];

  const invalidateWallet = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    void queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
  };

  const topupMutation = useMutation({
    mutationFn: (value: number) => paymentsService.topupWallet(value, topupKey),
    onSuccess: () => {
      invalidateWallet();
      setTopupKey(crypto.randomUUID());
    },
  });

  const payoutMutation = useMutation({
    mutationFn: (value: number) => paymentsService.requestPayout(value, payoutKey),
    onSuccess: () => {
      invalidateWallet();
      setPayoutKey(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: ['wallet-payouts'] });
    },
  });

  const validateCardForm = () => {
    const requiredLength = networkMeta?.lengths.includes(cardDigits.length) ?? cardDigits.length >= 12;
    const requiredCvc = networkMeta?.cvc ?? 3;
    return Boolean(
      amount &&
      amount > 0 &&
      requiredLength &&
      isValidLuhn(cardDigits) &&
      cardholder.trim().length >= 3 &&
      isValidExpiry(expiry) &&
      digitsOnly(cvc).length === requiredCvc,
    );
  };

  const handleTopup = async () => {
    if (!validateCardForm()) {
      setFormMessage({ type: 'error', text: copy.formError });
      return;
    }

    try {
      setFormMessage(null);
      await topupMutation.mutateAsync(Number(amount));
      setFormMessage({ type: 'success', text: copy.success });
      if (returnTo) router.push(returnTo);
    } catch {
      setFormMessage({ type: 'error', text: copy.loadError });
    }
  };

  const handlePayout = async (value: number) => {
    await payoutMutation.mutateAsync(value);
  };

  const metricCards = [
    ...(isDriver
      ? [
          {
            label: copy.pending,
            value: wallet.pendingBalance,
            icon: 'clock' as const,
            bgIcon: 'bg-amber-50 text-amber-600',
            bgCard: 'bg-white border-amber-100/70',
          },
          {
            label: copy.earned,
            value: wallet.totalEarned,
            icon: 'banknote' as const,
            bgIcon: 'bg-emerald-50 text-emerald-600',
            bgCard: 'bg-white border-emerald-100/70',
          },
        ]
      : []),
    ...(!isDriver
      ? [
          {
            label: copy.reserved,
            value: wallet.pendingBalance,
            icon: 'clock' as const,
            bgIcon: 'bg-amber-50 text-amber-600',
            bgCard: 'bg-white border-amber-100/70',
          },
        ]
      : []),
    {
      label: copy.spent,
      value: wallet.totalSpent,
      icon: 'credit-card' as const,
      bgIcon: 'bg-slate-100 text-slate-600',
      bgCard: 'bg-white border-slate-100/70',
    },
    {
      label: copy.refunded,
      value: wallet.totalRefunded,
      icon: 'refresh-cw' as const,
      bgIcon: 'bg-sky-50 text-sky-600',
      bgCard: 'bg-white border-sky-100/70',
    },
  ];

  return (
    <WebLayout title={copy.title}>
      <ProtectedRoute>
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-bold text-[#002f37] md:text-3xl">{copy.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-[#526970]">{copy.subtitle}</p>
            </div>
            {walletQuery.isError && (
              <Button variant="outline" onClick={() => void walletQuery.refetch()}>
                <Icon name="refresh-cw" size={16} />
                {copy.retry}
              </Button>
            )}
          </div>

          {walletQuery.isLoading ? (
            <WalletSkeleton />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="overflow-hidden border border-[#cfdfe3] bg-[#f7fbfb] p-0 shadow-md">
                <div className="relative overflow-hidden bg-[#052f36] bg-linear-to-br from-[#063b43] via-[#052f36] to-[#021f24] p-6 text-white shadow-inner">
                  {/* Decorative background glassmorphism glows */}
                  <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />
                  <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a8dbe3]">{copy.available}</p>
                      <p className="mt-3.5 text-4xl font-black tracking-tight md:text-5xl">{formatPrice(wallet.availableBalance)}</p>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/90 backdrop-blur-md">
                      <Icon name="credit-card" size={22} />
                    </span>
                  </div>
                  <div className="relative z-10 mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="bg-white text-[#052f36] font-semibold hover:bg-[#edf8fa] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                      onClick={() => document.getElementById('wallet-card-number')?.focus()}
                    >
                      <Icon name="plus" size={16} />
                      {copy.topup}
                    </Button>
                    {isDriver && (
                      <Button
                        variant="outline"
                        onClick={() => setIsPayoutOpen(true)}
                        disabled={wallet.availableBalance <= 0}
                        className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white/5"
                      >
                        <Icon name="upload" size={16} />
                        {copy.withdraw}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-3.5 p-5 sm:grid-cols-2">
                  {metricCards.map((metric) => (
                    <div
                      key={metric.label}
                      className={`flex items-center gap-3.5 rounded-2xl border p-4 shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${metric.bgCard}`}
                    >
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.bgIcon}`}>
                        <Icon name={metric.icon} size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#526970]">{metric.label}</p>
                        <p className="mt-1 text-xl font-bold text-[#002f37]">{formatPrice(metric.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 md:p-6 shadow-md border border-[#cfdfe3]/80 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#002f37]">{copy.cardTitle}</h2>
                    <p className="mt-1 text-sm text-[#526970]">{copy.network}: {networkMeta?.label ?? 'Auto'}</p>
                  </div>
                  <span className={`rounded-lg px-3 py-1 text-xs font-bold text-white ${networkMeta?.color ?? 'bg-[#60757b]'}`}>
                    {networkMeta?.label?.toUpperCase() ?? 'CARD'}
                  </span>
                </div>

                <div className="group relative mt-5 overflow-hidden rounded-2xl bg-linear-to-br from-[#115e6e] via-[#0b3c43] to-[#041f24] p-5 text-white shadow-lg border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                  {/* shine effect overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 opacity-75" />
                  <div className="pointer-events-none absolute -left-1/3 -top-1/2 w-full h-full bg-white/5 blur-3xl rounded-full transition-transform duration-500 group-hover:translate-x-10" />
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rotate-45 bg-white/5 transition-transform duration-500 group-hover:-translate-y-2" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    {/* chip SVG */}
                    <svg width="38" height="30" viewBox="0 0 38 30" fill="none" className="opacity-95 shadow-sm">
                      <rect x="0.5" y="0.5" width="37" height="29" rx="4.5" fill="#d4af37" stroke="#b8931d"/>
                      <line x1="13" y1="0" x2="13" y2="30" stroke="#b8931d" strokeWidth="1"/>
                      <line x1="25" y1="0" x2="25" y2="30" stroke="#b8931d" strokeWidth="1"/>
                      <line x1="0" y1="10" x2="38" y2="10" stroke="#b8931d" strokeWidth="1"/>
                      <line x1="0" y1="20" x2="38" y2="20" stroke="#b8931d" strokeWidth="1"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{networkMeta?.label?.toUpperCase() ?? 'WALLET CARD'}</span>
                  </div>
                  <p className="mt-7 font-mono text-lg tracking-[0.24em] relative z-10 select-all">{maskedCard}</p>
                  <div className="mt-5 flex justify-between gap-4 text-xs font-semibold uppercase text-white/80 relative z-10">
                    <span className="truncate tracking-wide">{cardholder || copy.cardholder}</span>
                    <span className="font-mono">{expiry || 'MM/YY'}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-[#314f56]">{copy.cardNumber}</span>
                    <input
                      id="wallet-card-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={cardNumber}
                      onChange={(event) => {
                        const nextNetwork = detectCardNetwork(event.target.value);
                        setCardNumber(formatCardNumber(event.target.value, nextNetwork));
                      }}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdfe3] px-3 font-mono text-[#002f37] outline-none focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8] transition-all duration-150"
                      placeholder="4242 4242 4242 4242"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-[#314f56]">{copy.cardholder}</span>
                    <input
                      type="text"
                      autoComplete="cc-name"
                      value={cardholder}
                      onChange={(event) => setCardholder(event.target.value.toUpperCase())}
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdfe3] px-3 font-semibold text-[#002f37] outline-none focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8] transition-all duration-150"
                      placeholder="ELVIN MAMMADOV"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-[#314f56]">{copy.expiry}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={expiry}
                        onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                        className="mt-1 h-11 w-full rounded-xl border border-[#cfdfe3] px-3 font-mono text-[#002f37] outline-none focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8] transition-all duration-150"
                        placeholder="MM/YY"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-[#314f56]">{copy.cvc}</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvc}
                        onChange={(event) => setCvc(digitsOnly(event.target.value).slice(0, networkMeta?.cvc ?? 3))}
                        className="mt-1 h-11 w-full rounded-xl border border-[#cfdfe3] px-3 font-mono text-[#002f37] outline-none focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8] transition-all duration-150"
                        placeholder={network === 'amex' ? '1234' : '123'}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-[#314f56]">{copy.amount}</span>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value) || '')}
                      placeholder="0.00"
                      className="mt-1 h-11 w-full rounded-xl border border-[#cfdfe3] px-3 font-semibold text-[#002f37] outline-none focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8] transition-all duration-150"
                    />
                  </label>

                  <div>
                    <p className="text-sm font-semibold text-[#314f56]">{copy.quickAmounts}</p>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {[10, 25, 50, 100].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAmount(value)}
                          className={`h-9 rounded-lg border text-sm font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${amount === value ? 'border-[#054752] bg-[#054752] text-white shadow-xs' : 'border-[#d7e5e8] bg-white text-[#314f56] hover:bg-slate-50'}`}
                        >
                          {value} ₼
                        </button>
                      ))}
                    </div>
                  </div>

                  {formMessage && (
                    <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${formMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                      {formMessage.text}
                    </div>
                  )}

                  <Button onClick={handleTopup} loading={topupMutation.isPending} className="w-full h-11 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md">
                    <Icon name="credit-card" size={16} />
                    {copy.pay}
                  </Button>
                </div>
              </Card>

              <Card className="p-5 md:p-6 lg:col-span-2 shadow-md border border-[#cfdfe3]/85 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#002f37]">{copy.history}</h2>
                    <p className="mt-1 text-sm text-[#526970]">{copy.emptyDesc}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(copy.filters) as WalletTransactionFilter[]).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                          activeFilter === filter
                            ? 'bg-[#054752] text-white shadow-sm hover:bg-[#043c45]'
                            : 'bg-[#f2f8f9] text-[#486067] hover:bg-[#e4f2f5] active:scale-95'
                        }`}
                      >
                        {copy.filters[filter]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-5">
                  {walletQuery.isError ? (
                    <EmptyState
                      className="py-12"
                      icon={<Icon name="alert-triangle" size={28} />}
                      title={copy.loadError}
                      action={
                        <Button variant="outline" onClick={() => void walletQuery.refetch()}>
                          <Icon name="refresh-cw" size={16} />
                          {copy.retry}
                        </Button>
                      }
                    />
                  ) : transactionsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                      ))}
                    </div>
                  ) : transactionsQuery.isError ? (
                    <EmptyState
                      className="py-12"
                      icon={<Icon name="alert-triangle" size={28} />}
                      title={copy.loadError}
                      action={
                        <Button variant="outline" onClick={() => void transactionsQuery.refetch()}>
                          <Icon name="refresh-cw" size={16} />
                          {copy.retry}
                        </Button>
                      }
                    />
                  ) : transactions.length === 0 ? (
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
                          <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/95 py-2 backdrop-blur-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#526970] bg-[#f8fbfb] px-3 py-1.5 rounded-lg border border-[#e4eff1]">{group.label}</span>
                            <span className="h-px flex-1 bg-slate-100" />
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
                                    ? (event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                          event.preventDefault();
                                          router.push(href);
                                        }
                                      }
                                    : undefined
                                }
                                className={`flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                  transaction.direction === 'credit' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-slate-400'
                                } ${isInteractive ? 'cursor-pointer hover:border-brand-300/40 hover:bg-[#f4fbfd]/50' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                                    transaction.direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    <Icon name={meta.icon} size={16} />
                                  </span>
                                  <div>
                                    <p className="font-semibold text-[#002f37]">{transactionLabel(transaction.type, language)}</p>
                                    {transaction.description && (
                                      <p className="mt-1 text-sm text-[#526970]">{transaction.description}</p>
                                    )}
                                    <p className="mt-1 text-sm text-[#526970]" title={formatAbsoluteTime(transaction.createdAt, language)}>
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

              {isDriver && (
                <Card className="p-5 md:p-6 lg:col-span-2 shadow-md border border-[#cfdfe3]/85 bg-white">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#002f37]">{copy.payouts}</h2>
                      <p className="mt-1 text-sm text-[#526970]">{copy.payoutsHint}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsPayoutsOpen((open) => !open)}>
                      <Icon name={isPayoutsOpen ? 'chevron-up' : 'chevron-down'} size={16} />
                      {isPayoutsOpen ? copy.hidePayouts : copy.showPayouts}
                    </Button>
                  </div>

                  {isPayoutsOpen && (
                    <div className="pt-5">
                      {payoutsQuery.isLoading ? (
                        <div className="space-y-3">
                          {[0, 1].map((i) => (
                            <Skeleton key={i} className="h-20 rounded-2xl" />
                          ))}
                        </div>
                      ) : payoutsQuery.isError ? (
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
                              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:flex-row md:items-center md:justify-between shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              <div className="flex items-start gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                  <Icon name="upload" size={16} />
                                </span>
                                <div>
                                  <p className="font-semibold text-[#002f37]">{copy.withdraw}</p>
                                  <p className="mt-1 text-sm text-[#526970]" title={formatAbsoluteTime(payout.createdAt, language)}>
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
                  )}
                </Card>
              )}
            </div>
          )}

          <PayoutModal
            isOpen={isPayoutOpen}
            onClose={() => setIsPayoutOpen(false)}
            availableBalance={wallet.availableBalance}
            onSubmit={handlePayout}
            isLoading={payoutMutation.isPending}
          />
        </div>
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
