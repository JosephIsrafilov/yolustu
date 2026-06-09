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
import type { Wallet, WalletTransaction } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import TopUpModal from './TopUpModal';

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
    topup: 'Balansı artır',
    topupPrompt: 'Məbləği daxil edin (AZN):',
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
    topup: 'Пополнить',
    topupPrompt: 'Введите сумму (AZN):',
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
    topup: 'Top up',
    topupPrompt: 'Enter amount (AZN):',
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
  const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);
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
    } catch (err) {
      alert('Top up failed');
      throw err;
    } finally {
      setIsTopUpLoading(false);
    }
  };

  return (
    <WebLayout title={copy.title}>
      <ProtectedRoute>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-brand-900 text-white relative">
                <p className="text-sm text-white/70">{copy.available}</p>
                <p className="mt-2 text-3xl font-black">{formatPrice(wallet?.availableBalance ?? 0)}</p>
                <div className="absolute top-4 right-4">
                  <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => setIsTopUpOpen(true)}>
                    {copy.topup}
                  </Button>
                </div>
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
        <TopUpModal 
          isOpen={isTopUpOpen} 
          onClose={() => setIsTopUpOpen(false)} 
          onSuccess={handleTopup} 
          isLoading={isTopUpLoading} 
        />
      </ProtectedRoute>
    </WebLayout>
  );
}
