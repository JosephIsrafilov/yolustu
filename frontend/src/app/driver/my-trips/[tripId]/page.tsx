'use client';

import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverLayout from '@/components/driver/DriverLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import TireLoader from '@/components/ui/TireLoader';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import TrackingMap from '@/components/ui/Map/TrackingMap';
import { useTracking } from '@/hooks/useTracking';
import { useRideChats } from '@/hooks/useRideChats';
import { useAppStore } from '@/store/useAppStore';
import { messagesService, tripsService } from '@/services';
import { ROUTES } from '@/lib/routes';
import { I18N } from '@/lib/i18n';
import { getLocalizedCityName } from '@/lib/cities';
import type { Trip, Booking } from '@/types';

const ACTIVE_BOOKING_STATUSES = new Set(['accepted', 'paid', 'boarded', 'no_show']);

export default function DriverTripManagePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const {
    language,
    bookings,
    fetchBookingRequests,
    markBoarded,
    markNoShow,
    startBoarding,
    simulateTrip,
    endTrip,
    cancelTrip,
    lastError,
    clearError,
    currentUser,
    unreadChats,
  } = useAppStore();

  const copy = I18N[language].tripManage;
  const chatLabel = language === 'az' ? 'Söhbət' : language === 'ru' ? 'Чат' : 'Chat';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmBoarding, setConfirmBoarding] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);
  const { getRideChatByBookingId, upsertRideChat } = useRideChats(Boolean(currentUser));

  const refreshTrip = useCallback(async () => {
    const data = await tripsService.getTripById(tripId);
    setTrip(data);
    return data;
  }, [tripId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Promise.all([refreshTrip(), fetchBookingRequests()]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshTrip, fetchBookingRequests]);

  const isTracking = trip?.status === 'boarding' || trip?.status === 'active';
  const tracking = useTracking(isTracking ? tripId : null);

  // Confirmed passengers for this trip (accepted/paid/boarded/no-show).
  const passengers = useMemo(
    () =>
      bookings.filter(
        (b) => b.tripId === tripId && ACTIVE_BOOKING_STATUSES.has(b.status),
      ),
    [bookings, tripId],
  );

  const shareUrl = useMemo(() => {
    if (!trip?.shareToken || typeof window === 'undefined') return '';
    return `${window.location.origin}/track/${trip.shareToken}`;
  }, [trip]);

  const statusLabel: Record<string, string> = {
    connecting: copy.statusConnecting,
    live: copy.statusLive,
    completed: copy.statusCompleted,
    ended: copy.statusEnded,
    offline: copy.statusOffline,
  };

  const handleBoarded = async (booking: Booking) => {
    setBusy(`board-${booking.id}`);
    await markBoarded(booking.id);
    setBusy(null);
  };

  const handleNoShow = async (booking: Booking) => {
    setBusy(`noshow-${booking.id}`);
    await markNoShow(booking.id);
    setBusy(null);
  };

  const handleOpenBoarding = async () => {
    setBusy('boarding');
    const ok = await startBoarding(tripId);
    if (ok) await refreshTrip();
    setBusy(null);
    setConfirmBoarding(false);
  };

  const handleCancelTrip = async () => {
    setBusy('cancel');
    const ok = await cancelTrip(tripId);
    if (ok) await refreshTrip();
    setBusy(null);
    setConfirmCancel(false);
  };

  const handleStartTrip = async () => {
    setBusy('start');
    const ok = await simulateTrip(tripId);
    if (ok) await refreshTrip();
    setBusy(null);
  };

  const handleEndTrip = async () => {
    setBusy('end');
    const ok = await endTrip(tripId);
    if (ok) await refreshTrip();
    setBusy(null);
    setConfirmEnd(false);
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <ProtectedRoute mode="driver">
          <div className="flex items-center justify-center py-16">
            <TireLoader />
          </div>
        </ProtectedRoute>
      </DriverLayout>
    );
  }

  if (!trip) {
    return (
      <DriverLayout>
        <ProtectedRoute mode="driver">
          <EmptyState
            icon={<Icon name="map" size={28} />}
            title={copy.notFound}
            action={<Button onClick={() => router.push(ROUTES.myTrips)}>{copy.back}</Button>}
          />
        </ProtectedRoute>
      </DriverLayout>
    );
  }

  const isFinished = trip.status === 'completed' || trip.status === 'cancelled';
  const departureCity = getLocalizedCityName(trip.departureCity, language);
  const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);

  return (
    <DriverLayout>
      <ProtectedRoute mode="driver">
        {lastError && (
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
            <div className="flex items-center justify-between gap-3">
              <span>{lastError}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">
                {I18N[language].common.close}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => router.push(ROUTES.myTrips)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text"
        >
          <Icon name="arrow-left" size={16} /> {copy.back}
        </button>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
              {departureCity} <Icon name="arrow-right" size={20} /> {arrivalCity}
            </h1>
            <div className="mt-2">
              <StatusBadge status={trip.status} type="trip" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={!shareUrl}>
            <Icon name="send" size={15} /> {copied ? copy.copied : copy.share}
          </Button>
        </div>

        {/* Live map */}
        {(isTracking || isFinished) && (
          <Card padding="sm" className="mb-5 overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
                <Icon name="map-pin" size={15} /> {copy.liveTracking}
              </h2>
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  tracking.status === 'live'
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-surface-dim text-text-secondary'
                }`}
              >
                {tracking.status === 'live' && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
                )}
                {statusLabel[tracking.status] ?? tracking.status}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl">
              <TrackingMap
                route={
                  tracking.route.length > 0
                    ? tracking.route
                    : trip.origin && trip.destination
                    ? [trip.origin, trip.destination]
                    : []
                }
                position={tracking.position}
                heading={tracking.heading}
                className="h-75 w-full"
              />
            </div>
            {tracking.route.length > 0 && (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-dim">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-out"
                    style={{ width: `${Math.round(tracking.progress * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-center text-xs text-text-secondary">
                  {copy.progress(Math.round(tracking.progress * 100))}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Passengers */}
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          <Icon name="users" size={15} /> {copy.passengers} ({passengers.length})
        </h2>
        {passengers.length === 0 ? (
          <Card>
            <p className="py-4 text-center text-sm text-text-secondary">{copy.noPassengers}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {passengers.map((booking) => {
              const name = booking.passenger?.fullName ?? 'Passenger';
              const rideChat = getRideChatByBookingId(booking.id);
              return (
                <Card key={booking.id} padding="sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                        {name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">{name}</p>
                        <p className="text-xs text-text-secondary">
                          {copy.seats(booking.seatsRequested)} ·{' '}
                          <StatusBadge status={booking.status} type="booking" />
                        </p>
                      </div>
                    </div>
                    {!isFinished && (
                      <div className="flex flex-none gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={openingChatId === booking.id}
                          loading={openingChatId === booking.id}
                          onClick={async () => {
                            if (openingChatId) return;
                            setOpeningChatId(booking.id);
                            try {
                              if (rideChat) {
                                router.push(ROUTES.chatDetails(rideChat.id));
                                return;
                              }

                              const conversation = await messagesService.createRideChat(booking.id);
                              upsertRideChat(conversation);
                              router.push(ROUTES.chatDetails(conversation.id));
                            } finally {
                              setOpeningChatId(null);
                            }
                          }}
                          className="relative"
                        >
                          <Icon name="message-square" size={14} /> {chatLabel}
                          {rideChat && unreadChats[rideChat.id] && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant={booking.status === 'boarded' ? 'secondary' : 'primary'}
                          disabled={busy === `board-${booking.id}` || booking.status === 'boarded'}
                          onClick={() => handleBoarded(booking)}
                        >
                          <Icon name="check" size={14} /> {copy.boardedAction}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `noshow-${booking.id}` || booking.status === 'no_show'}
                          onClick={() => handleNoShow(booking)}
                        >
                          <Icon name="x" size={14} /> {copy.noShowAction}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Controls */}
        {isFinished ? (
          <Card className="mt-6">
            <p className="py-2 text-center text-sm text-text-secondary">
              {trip.status === 'completed' ? copy.tripCompleted : copy.tripCancelled}
            </p>
          </Card>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {trip.status === 'active' && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={busy === 'boarding'}
                  onClick={() => setConfirmBoarding(true)}
                >
                  <Icon name="users" size={16} /> {copy.openBoarding}
                </Button>
              )}
              <Button
                variant="primary"
                className="flex-1"
                disabled={busy === 'start'}
                onClick={handleStartTrip}
              >
                <Icon name="car" size={16} /> {copy.startTrip}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy === 'end'}
                onClick={() => setConfirmEnd(true)}
              >
                {copy.endTrip}
              </Button>
            </div>
            <div className="mt-3">
              <Button
                variant="ghost"
                className="w-full text-danger-600 hover:bg-surface-dim"
                disabled={busy === 'cancel'}
                onClick={() => setConfirmCancel(true)}
              >
                <Icon name="x" size={15} /> {copy.cancelTrip}
              </Button>
            </div>
          </>
        )}

        {shareUrl && !isFinished && (
          <p className="mt-3 text-center text-xs text-text-secondary">{copy.shareHint}</p>
        )}

        <ConfirmationDialog
          isOpen={confirmBoarding}
          onClose={() => setConfirmBoarding(false)}
          onConfirm={handleOpenBoarding}
          title={copy.confirmBoardingTitle}
          description={copy.confirmBoardingDesc}
          confirmLabel={copy.confirmBoardingConfirm}
          cancelLabel={copy.confirmBoardingCancel}
          variant="info"
        />

        <ConfirmationDialog
          isOpen={confirmEnd}
          onClose={() => setConfirmEnd(false)}
          onConfirm={handleEndTrip}
          title={copy.confirmEndTitle}
          description={copy.confirmEndDesc}
          confirmLabel={copy.confirmEndConfirm}
          cancelLabel={copy.confirmEndCancel}
          variant="danger"
        />

        <ConfirmationDialog
          isOpen={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          onConfirm={handleCancelTrip}
          title={copy.confirmCancelTitle}
          description={copy.confirmCancelDesc}
          confirmLabel={copy.confirmCancelConfirm}
          cancelLabel={copy.confirmCancelCancel}
          variant="danger"
        />
      </ProtectedRoute>
    </DriverLayout>
  );
}
