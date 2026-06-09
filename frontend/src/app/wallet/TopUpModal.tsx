import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';

const TOPUP_COPY = {
  az: {
    title: 'Balansı artır',
    presets: 'Hazır məbləğlər',
    custom: 'Və ya fərqli məbləğ daxil edin',
    continue: 'Davam et',
    fakePayment: 'Fake Ödəniş Səhifəsi',
    fakePaymentDesc: 'Bu səhifə yalnız test məqsədlidir. Gerçək pul çıxılmayacaq.',
    pay: 'Ödə',
    cancel: 'Ləğv et',
    success: 'Balansınız uğurla artırıldı!',
    done: 'Bağla',
  },
  ru: {
    title: 'Пополнить баланс',
    presets: 'Готовые суммы',
    custom: 'Или введите другую сумму',
    continue: 'Продолжить',
    fakePayment: 'Тестовая оплата',
    fakePaymentDesc: 'Это только для тестирования. Реальные деньги не спишутся.',
    pay: 'Оплатить',
    cancel: 'Отмена',
    success: 'Баланс успешно пополнен!',
    done: 'Закрыть',
  },
  en: {
    title: 'Top up wallet',
    presets: 'Quick amounts',
    custom: 'Or enter custom amount',
    continue: 'Continue',
    fakePayment: 'Mock Payment Page',
    fakePaymentDesc: 'This is for testing only. No real money will be charged.',
    pay: 'Pay',
    cancel: 'Cancel',
    success: 'Balance successfully topped up!',
    done: 'Close',
  },
} as const;

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => Promise<void>;
  isLoading?: boolean;
  initialAmount?: number;
}

export default function TopUpModal({ isOpen, onClose, onSuccess, isLoading, initialAmount }: TopUpModalProps) {
  const language = useAppStore((state) => state.language);
  const copy = TOPUP_COPY[language];

  const [step, setStep] = useState<'amount' | 'fake_payment' | 'success'>('amount');
  const [amount, setAmount] = useState<number | ''>(initialAmount || '');

  if (!isOpen) return null;

  const handleAmountSelect = (val: number) => setAmount(val);

  const handleContinue = () => {
    if (amount && amount > 0) {
      setStep('fake_payment');
    }
  };

  const handlePay = async () => {
    if (amount && amount > 0) {
      await onSuccess(amount);
      setStep('success');
    }
  };

  const resetAndClose = () => {
    setStep('amount');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-200">
        <Card className="relative w-full">
          {/* Close Button */}
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
              <h2 className="text-xl font-bold text-text">{copy.title}</h2>

              <div className="space-y-3">
                <p className="text-sm font-medium text-text-muted">{copy.presets}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20, 50, 100].map((val) => (
                    <Button
                      key={val}
                      variant={amount === val ? 'primary' : 'outline'}
                      onClick={() => handleAmountSelect(val)}
                      className="w-full"
                    >
                      {val} ₼
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-text-muted">{copy.custom}</p>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || '')}
                  min={1}
                  icon={<Icon name="credit-card" size={18} />}
                />
              </div>

              <Button
                onClick={handleContinue}
                disabled={!amount || amount <= 0}
                className="w-full"
              >
                {copy.continue} {amount ? `(${amount} ₼)` : ''}
              </Button>
            </div>
          )}

          {step === 'fake_payment' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="credit-card" size={32} />
              </div>
              <h2 className="text-xl font-bold text-text">{copy.fakePayment}</h2>
              <p className="text-text-muted">{copy.fakePaymentDesc}</p>

              <div className="bg-surface-hover rounded-lg p-4 text-left border border-border">
                <div className="flex justify-between items-center mb-2">
                  <Icon name="credit-card" size={20} className="text-brand-500 mb-2" />
                  <span className="font-bold text-lg text-text">{amount} ₼</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Card:</span>
                  <span className="text-text font-mono">**** **** **** 4242</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('amount')} className="flex-1" disabled={isLoading}>
                  {copy.cancel}
                </Button>
                <Button onClick={handlePay} loading={isLoading} className="flex-1">
                  {copy.pay}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text">{copy.success}</h2>
              <p className="text-text-muted text-lg">+{amount} ₼</p>
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
