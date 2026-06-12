import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { paymentsService } from '@/services';
import type { Booking } from '@/types';
import { formatPrice } from '@/lib/utils';
import TopUpModal from '@/app/wallet/TopUpModal';

const MODAL_COPY = {
  az: {
    title: 'Cüzdanla ödəniş',
    balance: 'Cari balans',
    tripPrice: 'Səfər qiyməti',
    missing: 'Çatışmayan məbləğ',
    paySuccess: 'Ödəniş uğurludur!',
    done: 'Bağla',
    cancel: 'Ləğv et',
    confirmPay: 'Ödənişi təsdiqlə',
    insufficientFunds: 'Balansınızda kifayət qədər vəsait yoxdur.',
    optionPayDirect: 'Yalnız səfəri ödə (Cüzdansız)',
    optionTopupExact: 'Çatışmayan məbləği artır',
    optionTopupMore: 'Fərqli məbləğ artır',
    loading: 'Yüklənir...',
  },
  ru: {
    title: 'Оплата с кошелька',
    balance: 'Текущий баланс',
    tripPrice: 'Стоимость поездки',
    missing: 'Не хватает',
    paySuccess: 'Оплата прошла успешно!',
    done: 'Закрыть',
    cancel: 'Отмена',
    confirmPay: 'Подтвердить оплату',
    insufficientFunds: 'Недостаточно средств на балансе.',
    optionPayDirect: 'Оплатить только поездку (без кошелька)',
    optionTopupExact: 'Пополнить ровно на недостающую сумму',
    optionTopupMore: 'Пополнить на другую сумму',
    loading: 'Загрузка...',
  },
  en: {
    title: 'Wallet Payment',
    balance: 'Current Balance',
    tripPrice: 'Trip Price',
    missing: 'Missing Amount',
    paySuccess: 'Payment successful!',
    done: 'Close',
    cancel: 'Cancel',
    confirmPay: 'Confirm Payment',
    insufficientFunds: 'Insufficient funds in your wallet.',
    optionPayDirect: 'Pay for trip directly (bypass wallet)',
    optionTopupExact: 'Top up the exact missing amount',
    optionTopupMore: 'Top up a different amount',
    loading: 'Loading...',
  },
} as const;

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onPayDirect: () => void;
  onPaymentSuccess: () => void;
}

export default function WalletPaymentModal({ isOpen, onClose, booking, onPayDirect, onPaymentSuccess }: WalletPaymentModalProps) {
  const language = useAppStore((state) => state.language);
  const copy = MODAL_COPY[language];

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const wallet = await paymentsService.getWallet();
      setBalance(wallet.availableBalance);
    } catch (e) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchBalance();
    } else {
      setIsSuccess(false);
      setBalance(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const price = booking.totalPrice || 0;
  const currentBalance = balance || 0;
  const missingAmount = Math.max(0, price - currentBalance);
  const hasEnough = missingAmount === 0;

  const handleWalletPay = async () => {
    try {
      setIsPaying(true);
      await paymentsService.payFromWallet(booking.id);
      setIsSuccess(true);
      onPaymentSuccess();
    } catch (error) {
      alert('Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const handleTopupExact = async () => {
    try {
      setIsPaying(true);
      await paymentsService.topupWallet(missingAmount, crypto.randomUUID());
      await fetchBalance();
    } catch (error) {
      alert('Top-up failed');
    } finally {
      setIsPaying(false);
    }
  };

  const handleTopupCustom = () => {
    setIsTopUpOpen(true);
  };

  const handleTopupModalSuccess = async (amount: number) => {
    await paymentsService.topupWallet(amount, crypto.randomUUID());
    await fetchBalance();
    setIsTopUpOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <Card className="relative w-full">
          {!isSuccess && !isPaying && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors"
            >
              <Icon name="x" size={20} />
            </button>
          )}

          {isSuccess ? (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text">{copy.paySuccess}</h2>
              <Button onClick={onClose} className="w-full mt-4">
                {copy.done}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="py-10">
              <LoadingState />
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text">{copy.title}</h2>
              
              <div className="bg-surface-hover rounded-lg p-4 space-y-2 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">{copy.tripPrice}:</span>
                  <span className="font-bold text-text">{formatPrice(price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">{copy.balance}:</span>
                  <span className="font-bold text-text">{formatPrice(currentBalance)}</span>
                </div>
                {!hasEnough && (
                  <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                    <span className="text-accent-600 font-medium">{copy.missing}:</span>
                    <span className="font-bold text-accent-600">{formatPrice(missingAmount)}</span>
                  </div>
                )}
              </div>

              {hasEnough ? (
                <div className="space-y-3">
                  <Button onClick={handleWalletPay} loading={isPaying} className="w-full">
                    {copy.confirmPay}
                  </Button>
                  <Button variant="outline" onClick={onClose} disabled={isPaying} className="w-full">
                    {copy.cancel}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-text-muted text-center">{copy.insufficientFunds}</p>
                  <div className="space-y-2">
                    <Button onClick={onPayDirect} variant="outline" className="w-full justify-between">
                      <span>{copy.optionPayDirect}</span>
                      <Icon name="credit-card" size={16} />
                    </Button>
                    <Button onClick={handleTopupExact} loading={isPaying} className="w-full justify-between">
                      <span>{copy.optionTopupExact} (+{formatPrice(missingAmount)})</span>
                      <Icon name="plus" size={16} />
                    </Button>
                    <Button onClick={handleTopupCustom} variant="secondary" className="w-full justify-between">
                      <span>{copy.optionTopupMore}</span>
                      <Icon name="credit-card" size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <TopUpModal 
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={handleTopupModalSuccess}
      />
    </div>
  );
}
