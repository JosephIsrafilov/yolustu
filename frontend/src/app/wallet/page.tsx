'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';
import { paymentsService } from '@/services';
import type { Wallet, WalletTransaction } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const WALLET_COPY = {
  az: {
    title: 'Balans',
    available: 'Mövcud balans',
    pending: 'Gözləyən gəlir',
    earned: 'Tamamlanmış gəlir',
    spent: 'Ödənişlər',
    refunded: 'Qaytarılıb',
    history: 'Əməliyyat tarixçəsi',
    empty: 'Balans əməliyyatı yoxdur',
  },
  ru: {
    title: 'Баланс',
    available: 'Доступный баланс',
    pending: 'Ожидающий доход',
    earned: 'Завершённый доход',
    spent: 'Оплаты',
    refunded: 'Возвраты',
    history: 'История операций',
    empty: 'Операций по балансу пока нет',
  },
  en: {
    title: 'Wallet',
    available: 'Available balance',
    pending: 'Pending earnings',
    earned: 'Completed earnings',
    spent: 'Payments',
    refunded: 'Refunded',
    history: 'Transaction history',
    empty: 'No wallet transactions yet',
  },
} as const;

function transactionLabel(type: WalletTransaction['type']) {
  return type.replaceAll('_', ' ');
}

export default function WalletPage() {
  const language = useAppStore((state) => state.language);
  const copy = WALLET_COPY[language];
  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

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

  return (
    <WebLayout title={copy.title}>
      <ProtectedRoute>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-brand-900 text-white">
                <p className="text-sm text-white/70">{copy.available}</p>
                <p className="mt-2 text-3xl font-black">{formatPrice(wallet?.availableBalance ?? 0)}</p>
              </Card>
              <Card>
                <p className="text-sm text-text-muted">{copy.pending}</p>
                <p className="mt-2 text-3xl font-black text-accent-600">{formatPrice(wallet?.pendingBalance ?? 0)}</p>
              </Card>
              <Card>
                <p className="text-sm text-text-muted">{copy.earned}</p>
                <p className="mt-2 text-3xl font-black text-text">{formatPrice(wallet?.totalEarned ?? 0)}</p>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <p className="text-sm text-text-muted">{copy.spent}</p>
                <p className="mt-2 text-2xl font-black text-text">{formatPrice(wallet?.totalSpent ?? 0)}</p>
              </Card>
              <Card>
                <p className="text-sm text-text-muted">{copy.refunded}</p>
                <p className="mt-2 text-2xl font-black text-text">{formatPrice(wallet?.totalRefunded ?? 0)}</p>
              </Card>
            </div>
            <Card>
              <h2 className="mb-4 text-lg font-bold text-text">{copy.history}</h2>
              {transactions.length === 0 ? (
                <EmptyState icon={<Icon name="credit-card" size={28} />} title={copy.empty} description="" />
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-semibold capitalize text-text">{transactionLabel(tx.type)}</p>
                        <p className="text-xs text-text-muted">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <div className={tx.direction === 'credit' ? 'text-accent-600' : 'text-text'}>
                        {tx.direction === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </ProtectedRoute>
    </WebLayout>
  );
}
