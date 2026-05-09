'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import RouteTimeline from '@/components/trips/RouteTimeline';
import ReviewCard from '@/components/reviews/ReviewCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { formatPrice, formatRating } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

export default function TripDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { trips, users, reviews, bookings, currentUser, createBooking, isAuthenticated, lastError, clearError } = useAppStore();
  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState(false);

  const trip = trips.find((t) => t.id === id);
  if (!trip) return <WebLayout title="Gediş" showBack><EmptyState title="Gediş tapılmadı" /></WebLayout>;

  const driver = users.find((u) => u.id === trip.driverId);
  const tripReviews = reviews.filter((r) => r.targetUserId === trip.driverId);
  const isOwnTrip = currentUser?.id === trip.driverId;
  const existingBooking = bookings.find((b) => b.tripId === trip.id && b.passengerId === currentUser?.id && b.status !== 'cancelled' && b.status !== 'rejected');

  const handleBook = () => {
    if (!isAuthenticated || isOwnTrip || existingBooking) return;
    const bookingId = createBooking(trip.id, seats);
    if (!bookingId) return;
    setBooked(true);
    setTimeout(() => router.push(ROUTES.bookings), 1000);
  };

  return (
    <WebLayout title="Gediş detalları" showBack>
      <div className="grid lg:grid-cols-3 gap-6 stagger-children">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card><RouteTimeline departure={trip.departureCity} arrival={trip.arrivalCity} meetingPoint={trip.meetingPoint} dropoffPoint={trip.dropoffPoint} /></Card>
          <Card>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><Icon name="clock" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">Tarix</p><p className="text-sm font-semibold">{trip.date}</p><p className="text-xs text-text-muted">{trip.time}</p></div>
              <div><Icon name="users" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">Yerlər</p><p className="text-sm font-semibold">{trip.seatsAvailable}/{trip.seatsTotal}</p><p className="text-xs text-text-muted">boş</p></div>
              <div><Icon name="car" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">Maşın</p><p className="text-sm font-semibold">{trip.carModel}</p></div>
            </div>
          </Card>
          {trip.comment && (<Card padding="md"><div className="flex items-start gap-3"><Icon name="message-square" size={16} className="text-text-muted mt-0.5 shrink-0" /><p className="text-sm text-text-secondary">{trip.comment}</p></div></Card>)}
          <StatusBadge status={trip.status} type="trip" />
          {tripReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">Sürücü rəyləri</h3><div className="grid sm:grid-cols-2 gap-3">{tripReviews.slice(0, 4).map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            <Card className="bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100"><div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Yer başına qiymət</span><span className="text-2xl font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</span></div></Card>
            {lastError && (
              <Card padding="sm" className="bg-[#fff4f2] border-[#ffdad6]">
                <div className="flex items-center justify-between gap-3 text-sm font-medium text-[#93000a]">
                  <span>{lastError}</span>
                  <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">Bağla</button>
                </div>
              </Card>
            )}
            {driver && (<Card><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg">{driver.fullName.charAt(0)}</div><div className="flex-1"><p className="text-base font-semibold text-text">{driver.fullName}</p><div className="flex items-center gap-2 text-xs text-text-muted"><span className="flex items-center gap-0.5"><Icon name="star" size={11} className="text-accent-500" fill="currentColor" />{formatRating(driver.rating)}</span><span>{driver.totalTrips} gediş</span><span>{driver.city}</span></div></div></div></Card>)}
            {isOwnTrip && (<Card padding="sm" className="bg-amber-50 border-amber-200"><div className="flex items-center gap-2 text-sm text-amber-700"><Icon name="alert-triangle" size={16} />Öz gedişinizə rezerv edə bilməzsiniz.</div></Card>)}
            {!isOwnTrip && trip.status === 'active' && trip.seatsAvailable > 0 && !existingBooking && !booked && (
              <Card className="border-brand-200 shadow-card-hover"><div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-bold text-text">Rezerv sorğusu</p>
                  <p className="text-xs text-text-muted">Sürücü təsdiqlədikdən sonra rezerv aktiv olacaq.</p>
                </div>
                <div className="flex items-center justify-between"><span className="text-sm font-medium">Neçə yer?</span><div className="flex items-center gap-2"><button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center font-bold">−</button><span className="w-8 text-center font-bold">{seats}</span><button onClick={() => setSeats(Math.min(trip.seatsAvailable, seats + 1))} className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center font-bold">+</button></div></div>
                <div className="rounded-xl bg-surface-muted p-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-text-muted">Seçilən yerlər</span><span className="font-semibold">{seats}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span className="text-text-muted">Yer başına</span><span className="font-semibold">{formatPrice(trip.pricePerSeat)}</span></div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2"><span className="font-semibold text-text">Cəmi</span><span className="text-lg font-bold text-brand-600">{formatPrice(trip.pricePerSeat * seats)}</span></div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[#fff8e8] p-3 text-xs leading-5 text-[#6b4b00]">
                  <Icon name="shield-check" size={16} className="mt-0.5 shrink-0" />
                  <span>Ödənişi və razılaşmanı platformadan kənarda etməyin.</span>
                </div>
                <Button fullWidth size="lg" onClick={handleBook}>Rezerv sorğusu göndər</Button>
              </div></Card>
            )}
            {existingBooking && (<Card padding="sm" className="bg-brand-50 border-brand-200"><p className="text-sm text-brand-700 font-medium">Bu gediş üçün artıq sorğu göndərmisiniz.</p></Card>)}
            {booked && (<Card padding="sm" className="bg-green-50 border-green-200"><p className="text-sm text-green-700 font-medium">Sorğu göndərildi! Yönləndirilirsiniz...</p></Card>)}
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
