'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import RouteTimeline from '@/components/trips/RouteTimeline';
import ReviewCard from '@/components/reviews/ReviewCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { formatPrice, formatRating } from '@/lib/utils';
import { Clock, Users, Car, Star, MessageSquare, AlertTriangle } from 'lucide-react';

export default function TripDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { trips, users, reviews, bookings, currentUser, createBooking, isAuthenticated } = useAppStore();
  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState(false);

  const trip = trips.find((t) => t.id === id);
  if (!trip) return <MobileShell title="Gediş" showBack><EmptyState title="Gediş tapılmadı" /></MobileShell>;

  const driver = users.find((u) => u.id === trip.driverId);
  const tripReviews = reviews.filter((r) => r.targetUserId === trip.driverId);
  const isOwnTrip = currentUser?.id === trip.driverId;
  const existingBooking = bookings.find((b) => b.tripId === trip.id && b.passengerId === currentUser?.id && b.status !== 'cancelled' && b.status !== 'rejected');

  const handleBook = () => {
    if (!isAuthenticated || isOwnTrip || existingBooking) return;
    createBooking(trip.id, seats);
    setBooked(true);
    setTimeout(() => router.push(ROUTES.bookings), 1000);
  };

  return (
    <MobileShell title="Gediş detalları" showBack showNav={false}>
      <div className="px-4 pt-4 pb-6 stagger-children">
        {/* Route */}
        <Card className="mb-3">
          <RouteTimeline departure={trip.departureCity} arrival={trip.arrivalCity} meetingPoint={trip.meetingPoint} dropoffPoint={trip.dropoffPoint} />
        </Card>

        {/* Trip Info */}
        <Card className="mb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <Clock size={18} className="mx-auto text-brand-500 mb-1" />
              <p className="text-xs text-text-muted">Tarix</p>
              <p className="text-sm font-semibold">{trip.date}</p>
              <p className="text-xs text-text-muted">{trip.time}</p>
            </div>
            <div>
              <Users size={18} className="mx-auto text-brand-500 mb-1" />
              <p className="text-xs text-text-muted">Yerlər</p>
              <p className="text-sm font-semibold">{trip.seatsAvailable}/{trip.seatsTotal}</p>
              <p className="text-xs text-text-muted">boş</p>
            </div>
            <div>
              <Car size={18} className="mx-auto text-brand-500 mb-1" />
              <p className="text-xs text-text-muted">Maşın</p>
              <p className="text-sm font-semibold">{trip.carModel}</p>
            </div>
          </div>
        </Card>

        {/* Price */}
        <Card className="mb-3 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Yer başına qiymət</span>
            <span className="text-2xl font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</span>
          </div>
        </Card>

        {/* Driver */}
        {driver && (
          <Card className="mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
                {driver.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-text">{driver.fullName}</p>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="flex items-center gap-0.5"><Star size={11} className="text-accent-500 fill-accent-500" />{formatRating(driver.rating)}</span>
                  <span>{driver.totalTrips} gediş</span>
                  <span>{driver.city}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Comment */}
        {trip.comment && (
          <Card padding="sm" className="mb-3">
            <div className="flex items-start gap-2">
              <MessageSquare size={14} className="text-text-muted mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">{trip.comment}</p>
            </div>
          </Card>
        )}

        <StatusBadge status={trip.status} type="trip" className="mb-3" />

        {/* Reviews */}
        {tripReviews.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text mb-2">Sürücü rəyləri</h3>
            <div className="flex flex-col gap-2">
              {tripReviews.slice(0, 3).map((r) => (
                <ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />
              ))}
            </div>
          </div>
        )}

        {/* Booking action */}
        {isOwnTrip && (
          <Card padding="sm" className="bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle size={16} />
              Öz gedişinizə rezerv edə bilməzsiniz.
            </div>
          </Card>
        )}

        {!isOwnTrip && trip.status === 'active' && trip.seatsAvailable > 0 && !existingBooking && !booked && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Neçə yer?</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center font-bold">−</button>
                <span className="w-8 text-center font-bold">{seats}</span>
                <button onClick={() => setSeats(Math.min(trip.seatsAvailable, seats + 1))} className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center font-bold">+</button>
              </div>
            </div>
            <Button fullWidth size="lg" onClick={handleBook}>Rezerv sorğusu göndər</Button>
          </div>
        )}

        {existingBooking && (
          <Card padding="sm" className="bg-brand-50 border-brand-200 mt-2">
            <p className="text-sm text-brand-700 font-medium">Bu gediş üçün artıq sorğu göndərmisiniz.</p>
          </Card>
        )}

        {booked && (
          <Card padding="sm" className="bg-green-50 border-green-200 mt-2">
            <p className="text-sm text-green-700 font-medium">Sorğu göndərildi! Yönləndirilirsiniz...</p>
          </Card>
        )}
      </div>
    </MobileShell>
  );
}
