import type { IconName } from '@/components/ui/Icon';
import type { WalletTransactionType } from '@/types';

export type WalletLang = 'az' | 'ru' | 'en';

export interface TransactionMeta {
  icon: IconName;
  labels: Record<WalletLang, string>;
}

/**
 * Single source of truth for per-type transaction presentation: the icon and
 * the localized label. Replaces the previously scattered `TYPE_ICON` map and
 * the inline labels object in `transactionLabel`. A drift test in
 * `src/__tests__/wallet-transaction-meta.test.ts` asserts every
 * `WalletTransactionType` has an entry here, so a backend type addition fails
 * a test instead of crashing at runtime.
 */
export const TRANSACTION_META: Record<WalletTransactionType, TransactionMeta> = {
  passenger_payment: {
    icon: 'credit-card',
    labels: { az: 'Sərnişin ödənişi', ru: 'Оплата пассажира', en: 'Passenger payment' },
  },
  platform_fee: {
    icon: 'banknote',
    labels: { az: 'Platforma komissiyası', ru: 'Комиссия платформы', en: 'Platform fee' },
  },
  driver_pending_earning: {
    icon: 'clock',
    labels: { az: 'Gözləyən gəlir', ru: 'Ожидаемый доход', en: 'Pending income' },
  },
  driver_available_earning: {
    icon: 'banknote',
    labels: { az: 'Aktiv gəlir', ru: 'Доступный доход', en: 'Available income' },
  },
  refund: {
    icon: 'refresh-cw',
    labels: { az: 'Qaytarma', ru: 'Возврат', en: 'Refund' },
  },
  payout: {
    icon: 'upload',
    labels: { az: 'Çıxarış', ru: 'Выплата', en: 'Payout' },
  },
  adjustment: {
    icon: 'plus',
    labels: { az: 'Balans artırma', ru: 'Пополнение', en: 'Top-up' },
  },
};

const FALLBACK_META: TransactionMeta = {
  icon: 'credit-card',
  labels: { az: 'Əməliyyat', ru: 'Операция', en: 'Transaction' },
};

/** Safe lookup so an unknown/unmapped type never crashes the UI. */
export function getTransactionMeta(type: WalletTransactionType): TransactionMeta {
  return TRANSACTION_META[type] ?? FALLBACK_META;
}

export function transactionLabel(type: WalletTransactionType, language: WalletLang): string {
  return getTransactionMeta(type).labels[language];
}
