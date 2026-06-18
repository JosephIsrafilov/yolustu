'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoadingState from '@/components/ui/LoadingState';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { messagesService } from '@/services';
import { useRideChats } from '@/hooks/useRideChats';

export default function LegacyTripChatRedirectPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const fetchBookings = useAppStore((state) => state.fetchBookings);
  const { getRideChatsByRideId, upsertRideChat, loading } = useRideChats(isAuthenticated);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }

    if (!id || loading) {
      return;
    }

    const rideChats = getRideChatsByRideId(id);
    if (rideChats.length === 1) {
      router.replace(ROUTES.chatDetails(rideChats[0].id));
      return;
    }
    if (rideChats.length > 1) {
      router.replace(ROUTES.chats);
      return;
    }

    let active = true;

    fetchBookings()
      .then(async () => {
        if (!active) return;

        const booking = useAppStore
          .getState()
          .bookings.find(
            (item) =>
              item.tripId === id &&
              item.passengerId === currentUser?.id &&
              (item.status === 'accepted' || item.status === 'paid'),
          );

        if (!booking) {
          router.replace(ROUTES.chats);
          return;
        }

        const conversation = await messagesService.createRideChat(booking.id);
        upsertRideChat(conversation);
        router.replace(ROUTES.chatDetails(conversation.id));
      })
      .catch(() => {
        router.replace(ROUTES.chats);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, fetchBookings, getRideChatsByRideId, id, isAuthenticated, loading, router, upsertRideChat]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-8">
        <LoadingState />
      </main>
      <Footer />
    </div>
  );
}
