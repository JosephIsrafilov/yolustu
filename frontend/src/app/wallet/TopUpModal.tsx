import React, { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/utils';
import { paymentsService } from '@/services';

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'maestro' | 'unionpay' | 'unknown';

interface CardNetworkMeta {
  label: string;
  pattern: RegExp;
  lengths: number[];
  cvcLength: number;
  accent: string;
}

const CARD_NETWORKS: Record<Exclude<CardNetwork, 'unknown'>, CardNetworkMeta> = {
  visa: {
    label: 'Visa',
    pattern: /^4/,
    lengths: [13, 16, 19],
    cvcLength: 3,
    accent: 'from-[#152a72] to-[#1a79c7]',
  },
  mastercard: {
    label: 'Mastercard',
    pattern: /^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/,
    lengths: [16],
    cvcLength: 3,
    accent: 'from-[#161616] to-[#d45721]',
  },
  amex: {
    label: 'American Express',
    pattern: /^3[47]/,
    lengths: [15],
    cvcLength: 4,
    accent: 'from-[#195c8f] to-[#40a4d8]',
  },
  discover: {
    label: 'Discover',
    pattern: /^(6011|65|64[4-9])/,
    lengths: [16, 19],
    cvcLength: 3,
    accent: 'from-[#3b250f] to-[#d9822b]',
  },
  maestro: {
    label: 'Maestro',
    pattern: /^(50|5[6-9]|6)/,
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    cvcLength: 3,
    accent: 'from-[#173d7a] to-[#cf4038]',
  },
  unionpay: {
    label: 'UnionPay',
    pattern: /^62/,
    lengths: [16, 17, 18, 19],
    cvcLength: 3,
    accent: 'from-[#114f7e] to-[#cf2e2e]',
  },
};

const TOPUP_COPY = {
  az: {
    title: 'Balansı artır',
    presets: 'Hazır məbləğlər',
    amount: 'Məbləğ',
    cardDetails: 'Kart məlumatları',
    cardNumber: 'Kart nömrəsi',
    cardholder: 'Kart sahibinin adı',
    expiry: 'Bitmə tarixi',
    cvc: 'CVC',
    pay: 'Balansı artır',
    cancel: 'Ləğv et',
    success: 'Balansınız uğurla artırıldı',
    done: 'Bağla',
    error: 'Ödəniş alınmadı. Yenidən cəhd edin.',
    secure: 'Təhlükəsiz kart ödənişi',
    card: 'Kart',
    invalidAmount: 'Düzgün məbləğ daxil edin.',
    invalidNumber: 'Kart nömrəsini yoxlayın.',
    invalidName: 'Kart sahibinin adını daxil edin.',
    invalidExpiry: 'Check the expiry date.',
    invalidCvc: 'Check the CVC.',
    methodMock: 'Demo Top-up',
    methodStripe: 'Pay with Stripe',
  },
  ru: {
    title: 'Пополнить баланс',
    presets: 'Готовые суммы',
    amount: 'Сумма',
    cardDetails: 'Данные карты',
    cardNumber: 'Номер карты',
    cardholder: 'Имя владельца',
    expiry: 'Срок',
    cvc: 'CVC',
    pay: 'Пополнить',
    cancel: 'Отмена',
    success: 'Баланс успешно пополнен',
    done: 'Закрыть',
    error: 'Платёж не прошёл. Попробуйте ещё раз.',
    secure: 'Безопасная оплата картой',
    card: 'Карта',
    invalidAmount: 'Введите корректную сумму.',
    invalidNumber: 'Проверьте номер карты.',
    invalidName: 'Введите имя владельца карты.',
    invalidExpiry: 'Проверьте срок действия.',
    invalidCvc: 'Проверьте CVC.',
    methodMock: 'Demo (Mock)',
    methodStripe: 'Stripe',
  },
  en: {
    title: 'Top up wallet',
    presets: 'Quick amounts',
    amount: 'Amount',
    cardDetails: 'Card details',
    cardNumber: 'Card number',
    cardholder: 'Cardholder name',
    expiry: 'Expiry',
    cvc: 'CVC',
    pay: 'Top up wallet',
    cancel: 'Cancel',
    success: 'Balance topped up',
    done: 'Close',
    error: 'Payment failed. Please try again.',
    secure: 'Secure card payment',
    card: 'Card',
    invalidAmount: 'Enter a valid amount.',
    invalidNumber: 'Check the card number.',
    invalidName: 'Enter the cardholder name.',
    invalidExpiry: 'Check the expiry date.',
    invalidCvc: 'Check the CVC.',
    methodMock: 'Demo Top-up',
    methodStripe: 'Stripe',
  },
} as const;

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => Promise<void>;
  isLoading?: boolean;
  initialAmount?: number;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function detectCardNetwork(number: string): CardNetwork {
  const digits = onlyDigits(number);
  const network = Object.entries(CARD_NETWORKS).find(([, meta]) => meta.pattern.test(digits));
  return (network?.[0] as CardNetwork | undefined) ?? 'unknown';
}

function formatCardNumber(value: string, network: CardNetwork) {
  const digits = onlyDigits(value).slice(0, 19);
  const groups = network === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const parts: string[] = [];
  let cursor = 0;

  groups.forEach((size) => {
    const part = digits.slice(cursor, cursor + size);
    if (part) parts.push(part);
    cursor += size;
  });

  return parts.join(' ');
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidLuhn(value: string) {
  const digits = onlyDigits(value);
  if (digits.length < 12) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isValidExpiry(value: string) {
  const [monthValue, yearValue] = value.split('/');
  if (!monthValue || !yearValue || yearValue.length !== 2) return false;

  const month = Number(monthValue);
  const year = Number(`20${yearValue}`);
  if (month < 1 || month > 12) return false;

  const expiry = new Date(year, month, 0, 23, 59, 59);
  return expiry >= new Date();
}

function maskCard(number: string) {
  const digits = onlyDigits(number);
  if (!digits) return '•••• •••• •••• ••••';
  return `•••• •••• •••• ${digits.slice(-4).padStart(4, '•')}`;
}

export default function TopUpModal({ isOpen, onClose, onSuccess, isLoading, initialAmount }: TopUpModalProps) {
  const language = useAppStore((state) => state.language);
  const copy = TOPUP_COPY[language];

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [amount, setAmount] = useState<number | ''>(initialAmount || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'mock' | 'stripe'>('mock');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const network = useMemo(() => detectCardNetwork(cardNumber), [cardNumber]);
  const networkMeta = network === 'unknown' ? null : CARD_NETWORKS[network];
  const cvcLength = networkMeta?.cvcLength ?? 3;

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('form');
    setAmount('');
    setCardNumber('');
    setCardholder('');
    setExpiry('');
    setCvc('');
    setError(null);
    onClose();
  };

  const validate = () => {
    const digits = onlyDigits(cardNumber);
    if (!amount || amount <= 0) return copy.invalidAmount;
    if (networkMeta && !networkMeta.lengths.includes(digits.length)) return copy.invalidNumber;
    if (!isValidLuhn(digits)) return copy.invalidNumber;
    if (cardholder.trim().length < 3) return copy.invalidName;
    if (!isValidExpiry(expiry)) return copy.invalidExpiry;
    if (onlyDigits(cvc).length !== cvcLength) return copy.invalidCvc;
    return null;
  };

  const handlePay = async () => {
    if (method === 'mock') {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
    } else {
      if (!amount || amount <= 0) {
        setError(copy.invalidAmount);
        return;
      }
    }

    try {
      setError(null);
      if (method === 'mock') {
        await onSuccess(Number(amount));
        setStep('success');
      } else {
        setIsRedirecting(true);
        const res = await paymentsService.createStripeTopUp(Number(amount));
        window.location.href = res.checkout_url;
      }
    } catch {
      setError(copy.error);
      setIsRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-3xl animate-slide-up">
        <Card className="relative w-full overflow-hidden p-0">
          {step !== 'success' && !isLoading && (
            <button
              type="button"
              onClick={resetAndClose}
              aria-label={copy.cancel}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Icon name="x" size={20} />
            </button>
          )}

          {step === 'form' && (
            <div className={`grid gap-0 ${method === 'mock' ? 'md:grid-cols-[0.9fr_1.1fr]' : 'md:grid-cols-1'}`}>
              {method === 'mock' && (
                <div className="bg-[#f6fafb] p-5 md:p-6">
                <div className={`flex aspect-[1.58] min-h-[190px] flex-col justify-between rounded-2xl bg-gradient-to-br ${networkMeta?.accent ?? 'from-[#20383f] to-[#5b6b70]'} p-5 text-white shadow-[0_18px_45px_rgba(15,35,40,0.22)]`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-white/70">{copy.secure}</p>
                      <p className="mt-1 text-lg font-bold">{networkMeta?.label ?? copy.card}</p>
                    </div>
                    <span className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner ring-1 ring-white/30" />
                  </div>
                  <div>
                    <p className="font-mono text-lg tracking-wide">{maskCard(cardNumber)}</p>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <p className="min-h-5 truncate text-xs font-semibold uppercase text-white/75">
                        {cardholder || copy.cardholder}
                      </p>
                      <p className="font-mono text-sm text-white/85">{expiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-semibold text-[#002f37]">{copy.presets}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 50, 100, 200, 500].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(value)}
                        className={`h-10 rounded-xl border text-sm font-semibold transition-colors ${
                          amount === value
                            ? 'border-[#054752] bg-[#054752] text-white'
                            : 'border-[#d7e5e8] bg-white text-[#314f56] hover:bg-[#edf6f8]'
                        }`}
                      >
                        {value} ₼
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              )}

              <div className="space-y-5 p-5 md:p-6">
                <div>
                  <h2 className="pr-10 text-xl font-bold text-[#002f37]">{copy.title}</h2>

                  {/* Segmented Control */}
                  <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setMethod('mock')}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                        method === 'mock' ? 'bg-white text-[#054752] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {copy.methodMock}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('stripe')}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                        method === 'stripe' ? 'bg-white text-[#054752] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {copy.methodStripe}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#314f56]">{copy.amount}</span>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value) || '')}
                      className="h-12 w-full rounded-xl border border-[#cfdfe3] bg-white px-4 text-base font-semibold text-[#002f37] outline-none transition-colors focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8]"
                      placeholder="0.00"
                    />
                  </label>

                  {method === 'mock' && (
                    <>
                      <label className="space-y-1.5">
                        <span className="text-sm font-semibold text-[#314f56]">{copy.cardNumber}</span>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            value={cardNumber}
                            onChange={(event) => setCardNumber(formatCardNumber(event.target.value, detectCardNetwork(event.target.value)))}
                            className="h-12 w-full rounded-xl border border-[#cfdfe3] bg-white px-4 pr-28 font-mono text-base text-[#002f37] outline-none transition-colors focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8]"
                            placeholder="4242 4242 4242 4242"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#edf6f8] px-2 py-1 text-xs font-bold text-[#34575f]">
                            {networkMeta?.label ?? copy.card}
                          </span>
                        </div>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-semibold text-[#314f56]">{copy.cardholder}</span>
                        <input
                          type="text"
                          autoComplete="cc-name"
                          value={cardholder}
                          onChange={(event) => setCardholder(event.target.value.toUpperCase())}
                          className="h-12 w-full rounded-xl border border-[#cfdfe3] bg-white px-4 text-base font-semibold text-[#002f37] outline-none transition-colors focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8]"
                          placeholder="YUSIF ALIYEV"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1.5">
                          <span className="text-sm font-semibold text-[#314f56]">{copy.expiry}</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={expiry}
                            onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                            className="h-12 w-full rounded-xl border border-[#cfdfe3] bg-white px-4 font-mono text-base text-[#002f37] outline-none transition-colors focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8]"
                            placeholder="MM/YY"
                          />
                        </label>

                        <label className="space-y-1.5">
                          <span className="text-sm font-semibold text-[#314f56]">{copy.cvc}</span>
                          <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cvc}
                            onChange={(event) => setCvc(onlyDigits(event.target.value).slice(0, cvcLength))}
                            className="h-12 w-full rounded-xl border border-[#cfdfe3] bg-white px-4 font-mono text-base text-[#002f37] outline-none transition-colors focus:border-[#054752] focus:ring-2 focus:ring-[#b9e1e8]"
                            placeholder={network === 'amex' ? '1234' : '123'}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <Icon name="alert-triangle" size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button variant="outline" onClick={resetAndClose} className="flex-1" disabled={isLoading || isRedirecting}>
                    {copy.cancel}
                  </Button>
                  <Button onClick={handlePay} loading={isLoading || isRedirecting} className="flex-1">
                    {method === 'stripe' ? copy.methodStripe : copy.pay}
                    {amount ? ` ${formatPrice(Number(amount))}` : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-5 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Icon name="check" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#002f37]">{copy.success}</h2>
                <p className="mt-2 text-lg font-semibold text-[#426168]">+{formatPrice(Number(amount) || 0)}</p>
              </div>
              <Button onClick={resetAndClose} className="w-full sm:mx-auto sm:w-auto">
                {copy.done}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
