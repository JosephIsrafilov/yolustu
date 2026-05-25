'use client';

import React from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import BookingRequestCard from '@/components/bookings/BookingRequestCard';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';

const REQUESTS_I18N = {
  az: {
    pendingHeading: (count: number) => `Gözləyən sorğular (${count})`,
    pastHeading: 'Keçmiş sorğular',
    noRequestsTitle: 'Sorğu yoxdur',
    noRequestsDesc: 'Gedişlərinizə sorğu gəldikdə burada görünəcək',
  },
  ru: {
    pendingHeading: (count: number) => `Ожидающие заявки (${count})`,
    pastHeading: 'Прошедшие заявки',
    noRequestsTitle: 'Заявок нет',
    noRequestsDesc: 'Когда на ваши поездки поступят заявки, они появятся здесь',
  },
  en: {
    pendingHeading: (count: number) => `Pending requests (${count})`,
    pastHeading: 'Past requests',
    noRequestsTitle: 'No requests',
    noRequestsDesc: 'Requests for your trips will appear here',
  },
} as const;

export default function DriverRequestsPage() {
  const {
    bookings,
    trips,
    users,
    currentUser,
    acceptBooking,
    rejectBooking,
    fetchBookingRequests,
    fetchTrips,
    lastError,
    clearError,
    language,
  } = useAppStore();

  React.useEffect(() => {
    fetchBookingRequests();
    fetchTrips();
  }, [fetchBookingRequests, fetchTrips]);

  const common = I18N[language].common;
  const localCopy = REQUESTS_I18N[language];

  const driverTrips = trips.filter((trip) => trip.driverId === currentUser?.id);
  const driverTripIds = new Set(driverTrips.map((trip) => trip.id));
  const requests = bookings.filter((booking) => driverTripIds.has(booking.tripId) || booking.trip?.driverId === currentUser?.id);
  const pending = requests.filter((booking) => booking.status === 'pending');
  const others = requests.filter((booking) => booking.status !== 'pending');

  const renderRequest = (booking: (typeof bookings)[number], readonly = false) => {
    const trip = booking.trip ?? trips.find((item) => item.id === booking.tripId);
    const passenger = booking.passenger ?? users.find((user) => user.id === booking.passengerId);

    return (
      <BookingRequestCard
        key={booking.id}
        booking={booking}
        passenger={passenger}
        trip={trip}
        onAccept={readonly ? () => {} : () => acceptBooking(booking.id)}
        onReject={readonly ? () => {} : () => rejectBooking(booking.id)}
      />
    );
  };

  return (
    <DriverLayout>
      <ProtectedRoute mode="driver">
        {lastError && (
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
            <div className="flex items-center justify-between gap-3">
              <span>{lastError}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
            </div>
          </div>
        )}
        <div className="stagger-children">
          {pending.length > 0 && (
            <>
              <h3 className="mb-3 text-lg font-semibold text-text">{localCopy.pendingHeading(pending.length)}</h3>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pending.map((booking) => renderRequest(booking))}</div>
            </>
          )}

          {others.length > 0 && (
            <>
              <h3 className="mb-3 text-lg font-semibold text-text">{localCopy.pastHeading}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{others.map((booking) => renderRequest(booking, true))}</div>
            </>
          )}

          {requests.length === 0 && (
            <EmptyState icon={<Icon name="inbox" size={28} />} title={localCopy.noRequestsTitle} description={localCopy.noRequestsDesc} />
          )}
        </div>
      </ProtectedRoute>
    </DriverLayout>
  );
}
