'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import BookingCard from '@/components/bookings/BookingCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { I18N } from '@/lib/i18n';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { messagesService } from '@/services';
import { useRideChats } from '@/hooks/useRideChats';
import { effectiveBookingStatus } from '@/lib/bookings';

export default function BookingsPage() {
  const router = useRouter();
  const { bookings, trips, users, currentUser, cancelBooking, fetchBookings, fetchTrips, lastError, clearError, language } = useAppStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelDialogBookingId, setCancelDialogBookingId] = useState<string | null>(null);
  const { getRideChatByBookingId, upsertRideChat } = useRideChats(Boolean(currentUser));

  const copy = I18N[language].bookings;
  const common = I18N[language].common;

  React.useEffect(() => {
    fetchBookings();
    fetchTrips();
  }, [fetchBookings, fetchTrips]);

  const myBookings = bookings
    .filter((booking) => booking.passengerId === currentUser?.id)
    .map((booking) => ({
      ...booking,
      status: effectiveBookingStatus(booking.status, booking.paymentDeadline),
    }));
  const upcoming = myBookings.filter((booking) =>
    ['pending', 'accepted', 'paid', 'boarded'].includes(booking.status),
  );
  const past = myBookings.filter((booking) =>
    ['completed', 'cancelled', 'rejected', 'expired', 'no_show'].includes(booking.status),
  );
  const current = tab === 'upcoming' ? upcoming : past;

  return (
    <WebLayout title={copy.title}>
      <ProtectedRoute>
        {lastError && (
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
            <div className="flex items-center justify-between gap-3">
              <span>{lastError}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
            </div>
          </div>
        )}
        <div className="mb-6 flex max-w-xs gap-1 rounded-xl bg-surface-muted p-1">
          {(['upcoming', 'past'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                tab === item ? 'bg-white text-brand-600 shadow-sm' : 'text-text-muted',
              )}
            >
              {item === 'upcoming' ? copy.upcomingTab : copy.pastTab}
            </button>
          ))}
        </div>
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push(ROUTES.chats)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:bg-surface-muted"
          >
            <Icon name="message-square" size={16} />
            <span>{language === 'az' ? 'Sohbetler' : language === 'ru' ? 'Чаты' : 'Chats'}</span>
          </button>
        </div>
        {current.length > 0 ? (
          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.map((booking) => {
              const trip = booking.trip ?? trips.find((item) => item.id === booking.tripId);
              const driver = trip ? trip.driver ?? users.find((user) => user.id === trip.driverId) : undefined;
              return (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  trip={trip}
                  driver={driver}
                  rideChatConversationId={getRideChatByBookingId(booking.id)?.id}
                  onCancel={() => setCancelDialogBookingId(booking.id)}
                  onReview={() => router.push(`${ROUTES.createReview}?tripId=${booking.tripId}&targetUserId=${trip?.driverId}`)}
                  onOpenRideChat={async () => {
                    const existingConversation = getRideChatByBookingId(booking.id);
                    if (existingConversation) {
                      router.push(ROUTES.chatDetails(existingConversation.id));
                      return;
                    }

                    const conversation = await messagesService.createRideChat(booking.id);
                    upsertRideChat(conversation);
                    router.push(ROUTES.chatDetails(conversation.id));
                  }}
                  onPay={async () => {
                    try {
                      const service = await import('@/services').then(m => m.paymentsService);
                      const res = await service.createPaymentSession(booking.id);
                      if (res.provider === 'mock') {
                        await service.mockSucceed(res.paymentId);
                        await fetchBookings();
                        return;
                      }
                      window.location.href = res.checkoutUrl;
                    } catch {
                      alert(copy.paymentFail);
                    }
                  }}
                  onWalletPaySuccess={async () => {
                    await fetchBookings();
                  }}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="calendar-check" size={28} />}
            title={tab === 'upcoming' ? copy.emptyUpcoming : copy.emptyPast}
            description={copy.searchAction}
          />
        )}

        <ConfirmationDialog
          isOpen={cancelDialogBookingId !== null}
          onClose={() => setCancelDialogBookingId(null)}
          onConfirm={async () => {
            if (cancelDialogBookingId) {
              await cancelBooking(cancelDialogBookingId);
            }
          }}
          title={
            language === 'az'
              ? 'Rezervasiyanı ləğv etmək istəyirsiniz?'
              : language === 'ru'
              ? 'Отменить бронирование?'
              : 'Cancel Booking?'
          }
          description={
            language === 'az'
              ? 'Bu rezervasiyanı ləğv etmək istədiyinizdən əminsiniz? Bu addım geri qaytarıla bilməz.'
              : language === 'ru'
              ? 'Вы уверены, что хотите отменить это бронирование? Это действие нельзя отменить.'
              : 'Are you sure you want to cancel this booking? This action cannot be undone.'
          }
          confirmLabel={
            language === 'az'
              ? 'Bəli, ləğv et'
              : language === 'ru'
              ? 'Да, отменить'
              : 'Yes, cancel'
          }
          cancelLabel={
            language === 'az'
              ? 'Xeyr, saxla'
              : language === 'ru'
              ? 'Нет, оставить'
              : 'No, keep'
          }
          variant="danger"
        />
      </ProtectedRoute>
    </WebLayout>
  );
}
