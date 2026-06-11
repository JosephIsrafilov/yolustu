import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/utils';

const PAYOUT_COPY = {
  az: {
    title: 'Balansı çıxar',
    subtitle: 'Mövcud balansınızdan çıxarış üçün məbləğ daxil edin.',
    available: 'Mövcud balans',
    amount: 'Çıxarış məbləği',
    max: 'Maksimum',
    confirm: 'Çıxarışı təsdiqlə',
    cancel: 'Ləğv et',
    success: 'Çıxarış sorğusu göndərildi!',
    successDesc: 'Sorğunuz baxılır. Status tarixçədə görünəcək.',
    done: 'Bağla',
    errorAmount: 'Düzgün məbləğ daxil edin.',
    errorBalance: 'Balansınızda kifayət qədər vəsait yoxdur.',
    errorGeneric: 'Çıxarış alınmadı. Yenidən cəhd edin.',
  },
  ru: {
    title: 'Вывести средства',
    subtitle: 'Введите сумму для вывода с доступного баланса.',
    available: 'Доступный баланс',
    amount: 'Сумма вывода',
    max: 'Максимум',
    confirm: 'Подтвердить вывод',
    cancel: 'Отмена',
    success: 'Запрос на вывод отправлен!',
    successDesc: 'Запрос на рассмотрении. Статус появится в истории.',
    done: 'Закрыть',
    errorAmount: 'Введите корректную сумму.',
    errorBalance: 'Недостаточно средств на балансе.',
    errorGeneric: 'Вывод не выполнен. Попробуйте ещё раз.',
  },
  en: {
    title: 'Withdraw funds',
    subtitle: 'Enter an amount to withdraw from your available balance.',
    available: 'Available balance',
    amount: 'Withdrawal amount',
    max: 'Max',
    confirm: 'Confirm withdrawal',
    cancel: 'Cancel',
    success: 'Payout request submitted!',
    successDesc: 'Your request is under review. Its status will appear in the history.',
    done: 'Close',
    errorAmount: 'Enter a valid amount.',
    errorBalance: 'Insufficient balance.',
    errorGeneric: 'Payout failed. Please try again.',
  },
} as const;

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSubmit: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

export default function PayoutModal({ isOpen, onClose, availableBalance, onSubmit, isLoading }: PayoutModalProps) {
  const language = useAppStore((state) => state.language);
  const copy = PAYOUT_COPY[language];

  const [step, setStep] = useState<'amount' | 'success'>('amount');
  const [amount, setAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('amount');
    setAmount('');
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!amount || amount <= 0) {
      setError(copy.errorAmount);
      return;
    }
    if (amount > availableBalance) {
      setError(copy.errorBalance);
      return;
    }
    setError(null);
    try {
      await onSubmit(amount);
      setStep('success');
    } catch {
      setError(copy.errorGeneric);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-200">
        <Card className="relative w-full">
          {step !== 'success' && !isLoading && (
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors"
            >
              <Icon name="x" size={20} />
            </button>
          )}

          {step === 'amount' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text">{copy.title}</h2>
                <p className="mt-1 text-sm text-text-muted">{copy.subtitle}</p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-hover px-4 py-3">
                <span className="text-sm text-text-muted">{copy.available}</span>
                <span className="font-bold text-text">{formatPrice(availableBalance)}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-muted">{copy.amount}</p>
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance)}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {copy.max}
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || '')}
                  min={1}
                  max={availableBalance}
                  icon={<Icon name="upload" size={18} />}
                  error={error ?? undefined}
                />
              </div>

              <Button
                onClick={handleConfirm}
                loading={isLoading}
                disabled={!amount || amount <= 0 || amount > availableBalance}
                className="w-full"
              >
                {copy.confirm} {amount ? `(${formatPrice(amount)})` : ''}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text">{copy.success}</h2>
              <p className="text-text-muted">{copy.successDesc}</p>
              <Button onClick={resetAndClose} className="w-full mt-4">
                {copy.done}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
