'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import WalletPaymentModal from './WalletPaymentModal';
import { formatPrice } from '@/lib/utils';
import { getLocalizedCityName } from '@/lib/cities';
import type { Booking, Trip, User } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';
import { messagesService } from '@/services';

interface BookingCardProps {
  booking: Booking;
  trip?: Trip;
  driver?: User;
  onCancel?: () => void;
  onReview?: () => void;
  onPay?: () => void;
  onWalletPaySuccess?: () => void;
}

const BOOKING_CARD_I18N = {
  az: {
    chat: 'Söhbət',
    seatsUnit: 'yer',
    walletPay: 'Cüzdanla ödə',
    expiresIn: 'Son tarix:',
    waitingApproval: 'Sürücü təsdiqi gözlənilir',
  },
  ru: {
    chat: 'Чат',
    seatsUnit: 'мест',
    walletPay: 'Оплатить с кошелька',
    expiresIn: 'Срок:',
    waitingApproval: 'Ожидание подтверждения водителя',
  },
  en: {
    chat: 'Chat',
    seatsUnit: 'seats',
    walletPay: 'Pay from wallet',
    expiresIn: 'Expires:',
    waitingApproval: 'Waiting for driver approval',
  },
} as const;

export default function BookingCard({
  booking,
  trip,
  driver,
  onCancel,
  onReview,
  onPay,
  onWalletPaySuccess,
}: BookingCardProps) {
  const router = useRouter();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const language = useAppStore((state) => state.language);
  const unreadRides = useAppStore((state) => state.unreadRides) || {};
  const copy = I18N[language].bookings;
  const localCopy = BOOKING_CARD_I18N[language];

  if (!trip) return null;

  const departureCity = getLocalizedCityName(trip.departureCity, language);
  const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);
  const canCancel = booking.status === 'pending' || booking.status === 'accepted';
  const canReview = booking.status === 'completed';

  const openRideChat = async () => {
    if (isOpeningChat) return;
    setIsOpeningChat(true);
    try {
      const conversation = await messagesService.createRideChat(booking.id);
      router.push(ROUTES.chatDetails(conversation.id));
    } finally {
      setIsOpeningChat(false);
    }
  };

  return (
    <>
      <Card className="animate-fade-in min-h-[160px] flex flex-col justify-between">
        <div className="grid grid-cols-[1fr_auto] gap-4 mb-3 items-start h-12">
          <div className="min-w-0">
            <p className="text-base font-bold text-text truncate block w-full leading-6">
              {departureCity} {'->'} {arrivalCity}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted h-5">
              <Icon name="clock" size={12} className="shrink-0 flex-none" />
              <span className="truncate block w-full">{trip.date} {'·'} {trip.time}</span>
            </div>
          </div>
          <div className="shrink-0 flex-none h-6 flex items-center">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-text-secondary mb-3 h-5">
          <span className="font-semibold text-brand-600 shrink-0 flex-none">{formatPrice(trip.pricePerSeat)}</span>
          <span className="truncate block">{booking.seatsRequested} {localCopy.seatsUnit}</span>
          {['pending', 'accepted'].includes(booking.status) && booking.paymentDeadline && (
            <span className="truncate block ml-auto text-xs text-red-500 font-medium">
              {localCopy.expiresIn} {new Date(booking.paymentDeadline).toLocaleString()}
            </span>
          )}
        </div>

        {driver && (
          <div className="grid grid-cols-[28px_1fr] gap-2 py-2 border-t border-border items-center h-11">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0 flex-none">
              {driver.fullName.charAt(0)}
            </div>
            <div className="min-w-0 grid grid-rows-2">
              <p className="text-xs font-medium text-text truncate block w-full leading-4">{driver.fullName}</p>
              <p className="flex items-center gap-1 text-[10px] text-text-muted leading-3 h-3">
                <Icon name="star" size={10} className="text-accent-500 shrink-0 flex-none" fill="currentColor" />
                <span className="truncate">{driver.rating.toFixed(1)}</span>
              </p>
            </div>
          </div>
        )}

        {(canCancel || canReview || (booking.status === 'accepted' && (onPay || onWalletPaySuccess)) || ['pending', 'accepted', 'paid'].includes(booking.status)) && (
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border w-full">
            {booking.status === 'pending' && (
              <div className="text-sm font-semibold text-brand-600 text-center py-1 bg-brand-50 rounded-lg">
                {localCopy.waitingApproval}
              </div>
            )}
            {booking.status === 'accepted' && (onPay || onWalletPaySuccess) && (
              <div className="flex gap-2 w-full">
                {onPay && (
                  <Button variant="primary" size="sm" onClick={onPay} className="flex-1">
                    <Icon name="credit-card" size={14} className="shrink-0 flex-none" />
                    <span className="truncate">{copy.payBtn}</span>
                  </Button>
                )}
                {onWalletPaySuccess && (
                  <Button variant="secondary" size="sm" onClick={() => setIsWalletModalOpen(true)} className="flex-1">
                    <Icon name="credit-card" size={14} className="shrink-0 flex-none" />
                    <span className="truncate">{localCopy.walletPay}</span>
                  </Button>
                )}
              </div>
            )}
            <div className="flex gap-2 flex-nowrap items-center h-12 w-full">
              {['accepted', 'paid'].includes(booking.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRideChat}
                  loading={isOpeningChat}
                  className="flex-1 w-full flex items-center justify-center gap-1.5 relative animate-fade-in"
                >
                  <Icon name="message-square" size={14} className="shrink-0 flex-none" />
                  <span className="truncate">{localCopy.chat}</span>
                  {unreadRides[trip.id] && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </Button>
              )}
              {canCancel && onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 w-full">
                  <span className="truncate">{copy.cancelBtn}</span>
                </Button>
              )}
              {canReview && onReview && (
                <Button variant="secondary" size="sm" onClick={onReview} className="flex-1 w-full">
                  <Icon name="star" size={14} className="shrink-0 flex-none" />
                  <span className="truncate">{copy.reviewBtn}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <WalletPaymentModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        booking={booking}
        onPayDirect={() => {
          setIsWalletModalOpen(false);
          if (onPay) onPay();
        }}
        onPaymentSuccess={() => {
          setIsWalletModalOpen(false);
          if (onWalletPaySuccess) onWalletPaySuccess();
        }}
      />
    </>
  );
}
