import type { IconName } from '@/components/ui/Icon';
import type { WalletTransactionType } from '@/types';

export type WalletLang = 'az' | 'ru' | 'en';

export interface TransactionMeta {
  icon: IconName;
  labels: Record<WalletLang, string>;
}

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
  reservation_hold: {
    icon: 'clock',
    labels: { az: 'Rezervdə saxlanılıb', ru: 'Сумма зарезервирована', en: 'Reservation hold' },
  },
  reservation_release: {
    icon: 'refresh-cw',
    labels: { az: 'Rezerv geri qaytarılıb', ru: 'Резерв возвращён', en: 'Reservation returned' },
  },
};

const FALLBACK_META: TransactionMeta = {
  icon: 'credit-card',
  labels: { az: 'Əməliyyat', ru: 'Операция', en: 'Transaction' },
};

export function getTransactionMeta(type: string): TransactionMeta {
  return type in TRANSACTION_META
    ? TRANSACTION_META[type as WalletTransactionType]
    : FALLBACK_META;
}

export function transactionLabel(type: string, language: WalletLang): string {
  return getTransactionMeta(type).labels[language];
}
