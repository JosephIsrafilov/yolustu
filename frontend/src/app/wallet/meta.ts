import type { IconName } from '@/components/ui/Icon';

export type WalletLang = 'az' | 'ru' | 'en';

export interface TransactionMeta {
  icon: IconName;
  labels: Record<WalletLang, string>;
}

export const TRANSACTION_META: Record<string, TransactionMeta> = {
  passenger_payment: {
    icon: 'credit-card',
    labels: { az: 'Sernisin odenisi', ru: 'Oplata passazhira', en: 'Passenger payment' },
  },
  platform_fee: {
    icon: 'banknote',
    labels: { az: 'Platforma komissiyasi', ru: 'Komissiya platformy', en: 'Platform fee' },
  },
  driver_pending_earning: {
    icon: 'clock',
    labels: { az: 'Gozleyen gelir', ru: 'Ozhidaemyi dokhod', en: 'Pending income' },
  },
  driver_available_earning: {
    icon: 'banknote',
    labels: { az: 'Aktiv gelir', ru: 'Dostupnyi dokhod', en: 'Available income' },
  },
  refund: {
    icon: 'refresh-cw',
    labels: { az: 'Qaytarma', ru: 'Vozvrat', en: 'Refund' },
  },
  payout: {
    icon: 'upload',
    labels: { az: 'Cixaris', ru: 'Vyplata', en: 'Payout' },
  },
  adjustment: {
    icon: 'plus',
    labels: { az: 'Balans artirma', ru: 'Popolnenie', en: 'Top-up' },
  },
  reservation_hold: {
    icon: 'clock',
    labels: { az: 'Rezerv saxlanildi', ru: 'Summa v rezervatsii', en: 'Reservation hold' },
  },
  reservation_release: {
    icon: 'refresh-cw',
    labels: { az: 'Rezerv qaytarildi', ru: 'Rezervatsiya vozvrashchena', en: 'Reservation returned' },
  },
};

const FALLBACK_META: TransactionMeta = {
  icon: 'credit-card',
  labels: { az: 'Emeliyyat', ru: 'Operatsiya', en: 'Transaction' },
};

export function getTransactionMeta(type: string): TransactionMeta {
  return TRANSACTION_META[type] ?? FALLBACK_META;
}

export function transactionLabel(type: string, language: WalletLang): string {
  return getTransactionMeta(type).labels[language];
}
