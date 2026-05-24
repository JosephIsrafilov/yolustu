'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import RouteTimeline from '@/components/trips/RouteTimeline';
import ReviewCard from '@/components/reviews/ReviewCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { formatPrice, formatRating } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import { MapContainer, TripRoute } from '@/components/ui/Map';
import { tripsService } from '@/services';
import type { Trip } from '@/types';
import { I18N } from '@/lib/i18n';

const TRIP_DETAILS_I18N = {
  az: {
    tripTitle: 'Gediş',
    tripNotFound: 'Gediş tapılmadı',
    tripDetailsTitle: 'Gediş detalları',
    dateLabel: 'Tarix',
    seatsLabel: 'Yerlər',
    availableLabel: 'boş',
    vehicleLabel: 'Maşın',
    driverReviewsTitle: 'Sürücü rəyləri',
    pricePerSeatLabel: 'Yer başına qiymət',
    ridesLabel: (count: number) => `${count} gediş`,
    ownTripWarning: 'Öz gedişinizə rezerv edə bilməzsiniz.',
    goToChatBtn: 'Söhbətə keç',
    bookingRequestTitle: 'Rezerv sorğusu',
    bookingRequestDesc: 'Sürücü təsdiqlədikdən sonra rezerv aktiv olacaq.',
    howManySeats: 'Neçə yer?',
    selectedSeats: 'Seçilən yerlər',
    perSeat: 'Yer başına',
    totalLabel: 'Cəmi',
    warningOffline: 'Ödənişi və razılaşmanı platformadan kənarda etməyin.',
    submitRequestBtn: 'Rezerv sorğusu göndər',
    alreadyBooked: 'Bu gediş üçün artıq sorğu göndərmisiniz.',
    bookedSuccess: 'Sorğu göndərildi! Yönləndirilirsiniz...',
  },
  ru: {
    tripTitle: 'Поездка',
    tripNotFound: 'Поездка не найдена',
    tripDetailsTitle: 'Детали поездки',
    dateLabel: 'Дата',
    seatsLabel: 'Места',
    availableLabel: 'свободно',
    vehicleLabel: 'Машина',
    driverReviewsTitle: 'Отзывы о водителе',
    pricePerSeatLabel: 'Цена за место',
    ridesLabel: (count: number) => `${count} поездок`,
    ownTripWarning: 'Вы не можете забронировать собственную поездку.',
    goToChatBtn: 'Перейти к чату',
    bookingRequestTitle: 'Запрос бронирования',
    bookingRequestDesc: 'Бронирование станет активным после подтверждения водителем.',
    howManySeats: 'Сколько мест?',
    selectedSeats: 'Выбранные места',
    perSeat: 'За место',
    totalLabel: 'Итого',
    warningOffline: 'Не производите оплату и договоренности вне платформы.',
    submitRequestBtn: 'Отправить запрос',
    alreadyBooked: 'Вы уже отправили запрос на эту поездку.',
    bookedSuccess: 'Запрос отправлен! Перенаправление...',
  },
  en: {
    tripTitle: 'Trip',
    tripNotFound: 'Trip not found',
    tripDetailsTitle: 'Trip Details',
    dateLabel: 'Date',
    seatsLabel: 'Seats',
    availableLabel: 'available',
    vehicleLabel: 'Vehicle',
    driverReviewsTitle: 'Driver reviews',
    pricePerSeatLabel: 'Price per seat',
    ridesLabel: (count: number) => `${count} rides`,
    ownTripWarning: 'You cannot book your own trip.',
    goToChatBtn: 'Go to chat',
    bookingRequestTitle: 'Booking request',
    bookingRequestDesc: 'Booking will be active after driver confirmation.',
    howManySeats: 'How many seats?',
    selectedSeats: 'Selected seats',
    perSeat: 'Per seat',
    totalLabel: 'Total',
    warningOffline: 'Do not make payments or agreements outside the platform.',
    submitRequestBtn: 'Send booking request',
    alreadyBooked: 'You have already sent a request for this trip.',
    bookedSuccess: 'Request sent! Redirecting...',
  },
};

export default function TripDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    trips,
    users,
    reviews,
    bookings,
    currentUser,
    createBooking,
    fetchBookings,
    isAuthenticated,
    lastError,
    clearError,
    language,
  } = useAppStore();
  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState(false);
  const [loadedTrip, setLoadedTrip] = useState<Trip | null>(null);
  const [tripLoadError, setTripLoadError] = useState(false);
  const tripId = Array.isArray(id) ? id[0] : id;

  const copy = TRIP_DETAILS_I18N[language] || TRIP_DETAILS_I18N.en;
  const common = I18N[language].common;

  React.useEffect(() => {
    if (!tripId || trips.some((t) => t.id === tripId)) return;
    tripsService.getTripById(tripId)
      .then((tripData) => {
        setLoadedTrip(tripData);
        setTripLoadError(false);
      })
      .catch((error) => {
        console.error('Fetch trip details error:', error);
        setTripLoadError(true);
      });
  }, [tripId, trips]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    fetchBookings();
  }, [isAuthenticated, fetchBookings]);

  const trip = trips.find((t) => t.id === tripId) ?? loadedTrip;
  if (!trip && !tripLoadError) {
    return (
      <WebLayout title={copy.tripTitle} showBack>
        <LoadingState />
      </WebLayout>
    );
  }
  if (!trip) return <WebLayout title={copy.tripTitle} showBack><EmptyState title={copy.tripNotFound} /></WebLayout>;

  const driver = trip.driver ?? users.find((u) => u.id === trip.driverId);
  const tripReviews = reviews.filter((r) => r.targetUserId === trip.driverId);
  const isOwnTrip = currentUser?.id === trip.driverId;
  const existingBooking = bookings.find((b) => b.tripId === trip.id && b.passengerId === currentUser?.id && b.status !== 'cancelled' && b.status !== 'rejected');

  const handleBook = async () => {
    if (!isAuthenticated || isOwnTrip || existingBooking) return;
    let bookingId = '';
    try {
      bookingId = await createBooking(trip.id, seats);
    } catch {
      bookingId = '';
    }
    if (!bookingId) return;
    setBooked(true);
    setTimeout(() => router.push(ROUTES.bookings), 1000);
  };

  return (
    <WebLayout title={copy.tripDetailsTitle} showBack>
      <div className="grid lg:grid-cols-3 gap-6 stagger-children">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card><RouteTimeline departure={trip.departureCity} arrival={trip.arrivalCity} meetingPoint={trip.meetingPoint} dropoffPoint={trip.dropoffPoint} /></Card>
          {trip.origin && trip.destination && (
            <Card className="overflow-hidden p-0">
              <div className="h-[320px] w-full">
                <MapContainer className="min-h-[320px]">
                  <TripRoute
                    origin={trip.origin}
                    destination={trip.destination}
                    departureCity={trip.departureCity}
                    arrivalCity={trip.arrivalCity}
                  />
                </MapContainer>
              </div>
            </Card>
          )}
          <Card>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><Icon name="clock" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">{copy.dateLabel}</p><p className="text-sm font-semibold">{trip.date}</p><p className="text-xs text-text-muted">{trip.time}</p></div>
              <div><Icon name="users" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">{copy.seatsLabel}</p><p className="text-sm font-semibold">{trip.seatsAvailable}/{trip.seatsTotal}</p><p className="text-xs text-text-muted">{copy.availableLabel}</p></div>
              <div><Icon name="car" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">{copy.vehicleLabel}</p><p className="text-sm font-semibold">{trip.carModel}</p></div>
            </div>
          </Card>
          <Card>
            <h4 className="text-sm font-bold text-text mb-3">
              {language === 'az' ? 'Səyahət seçimləri və rahatlıq' : language === 'ru' ? 'Параметры поездки и удобства' : 'Ride Preferences & Comfort'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.femaleOnly ? 'bg-pink-50/20 border-pink-200 text-pink-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name="venus" size={20} className={trip.femaleOnly ? 'text-pink-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{language === 'az' ? 'Yalnız xanımlar' : language === 'ru' ? 'Только женщины' : 'Female only'}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.femaleOnly ? (language === 'az' ? 'Bəli' : 'Да') : (language === 'az' ? 'Xeyr' : 'Нет')}</span>
              </div>
              
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.smokingAllowed ? 'bg-brand-50/20 border-brand-200 text-brand-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name={trip.smokingAllowed ? "cigarette" : "cigarette-off"} size={20} className={trip.smokingAllowed ? 'text-brand-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{language === 'az' ? 'Siqaret çəkmək' : language === 'ru' ? 'Курение' : 'Smoking'}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.smokingAllowed ? (language === 'az' ? 'İcazəli' : 'Разрешено') : (language === 'az' ? 'Qadağan' : 'Запрещено')}</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.petsAllowed ? 'bg-brand-50/20 border-brand-200 text-brand-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name="paw-print" size={20} className={trip.petsAllowed ? 'text-brand-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{language === 'az' ? 'Ev heyvanı' : language === 'ru' ? 'Животные' : 'Pets'}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.petsAllowed ? (language === 'az' ? 'İcazəli' : 'Разрешено') : (language === 'az' ? 'Qadağan' : 'Запрещено')}</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.musicAllowed !== false ? 'bg-brand-50/20 border-brand-200 text-brand-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name="music" size={20} className={trip.musicAllowed !== false ? 'text-brand-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{language === 'az' ? 'Musiqi dinləmək' : language === 'ru' ? 'Музыка' : 'Music'}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.musicAllowed !== false ? (language === 'az' ? 'İcazəli' : 'Разрешено') : (language === 'az' ? 'Qadağan' : 'Запрещено')}</span>
              </div>
            </div>
          </Card>
          {trip.comment && (<Card padding="md"><div className="flex items-start gap-3"><Icon name="message-square" size={16} className="text-text-muted mt-0.5 shrink-0" /><p className="text-sm text-text-secondary">{trip.comment}</p></div></Card>)}
          <StatusBadge status={trip.status} type="trip" />
          {tripReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">{copy.driverReviewsTitle}</h3><div className="grid sm:grid-cols-2 gap-3">{tripReviews.slice(0, 4).map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            <Card className="bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100"><div className="flex items-center justify-between"><span className="text-sm text-text-secondary">{copy.pricePerSeatLabel}</span><span className="text-2xl font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</span></div></Card>
            {lastError && (
              <Card padding="sm" className="bg-[#fff4f2] border-[#ffdad6]">
                <div className="flex items-center justify-between gap-3 text-sm font-medium text-[#93000a]">
                  <span>{lastError}</span>
                  <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
                </div>
              </Card>
            )}
            {driver && (
              <Card>
                <div className="flex items-center gap-3">
                  {driver.avatarUrl ? (
                    <Image src={driver.avatarUrl} alt={driver.fullName} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
                      {driver.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-semibold text-text flex items-center gap-1">
                      <span>{driver.fullName}</span>
                      {driver.verificationStatus === 'approved' && (
                        <span title="Təsdiqlənmiş Sürücü">
                          <Icon name="shield-check" size={16} className="text-green-600 shrink-0" />
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="flex items-center gap-0.5">
                        <Icon name="star" size={11} className="text-accent-500" fill="currentColor" />
                        {formatRating(driver.rating)}
                      </span>
                      <span>{copy.ridesLabel(driver.totalTrips)}</span>
                      <span>{driver.city}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {isOwnTrip && (<Card padding="sm" className="bg-amber-50 border-amber-200"><div className="flex items-center gap-2 text-sm text-amber-700"><Icon name="alert-triangle" size={16} />{copy.ownTripWarning}</div></Card>)}
            
            {(isOwnTrip || existingBooking?.status === 'accepted' || existingBooking?.status === 'paid') && (
              <div className="flex flex-col gap-2">
                <Button 
                  fullWidth 
                  variant="outline" 
                  onClick={() => router.push(ROUTES.tripDetails(trip.id) + '/chat')}
                  className="flex items-center justify-center gap-2"
                >
                  <Icon name="message-square" size={18} />
                  {copy.goToChatBtn}
                </Button>
                
                {existingBooking && (existingBooking.status === 'accepted' || existingBooking.status === 'paid') && (
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      language === 'az' 
                        ? `Salam! Mən Yolüstü ilə ${trip.departureCity} şəhərindən ${trip.arrivalCity} şəhərinə gedirəm. Sürücü: ${driver?.fullName || 'Sürücü'}, Vaxt: ${trip.date} ${trip.time}. Gediş detalları: ${window.location.origin}/trips/${trip.id}`
                        : language === 'ru'
                        ? `Привет! Я еду с Yolustu из ${trip.departureCity} в ${trip.arrivalCity}. Водитель: ${driver?.fullName || 'Водитель'}, Время: ${trip.date} ${trip.time}. Детали поездки: ${window.location.origin}/trips/${trip.id}`
                        : `Hi! I am traveling with Yolustu from ${trip.departureCity} to ${trip.arrivalCity}. Driver: ${driver?.fullName || 'Driver'}, Time: ${trip.date} ${trip.time}. Trip details: ${window.location.origin}/trips/${trip.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white py-2.5 px-4 font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    <Icon name="send" size={18} />
                    <span>{I18N[language].createTrip.whatsappShare}</span>
                  </a>
                )}
              </div>
            )}
            
            {!isOwnTrip && trip.status === 'active' && trip.seatsAvailable > 0 && !existingBooking && !booked && (
              <Card className="border-brand-200 shadow-card-hover"><div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-bold text-text">{copy.bookingRequestTitle}</p>
                  <p className="text-xs text-text-muted">{copy.bookingRequestDesc}</p>
                </div>
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{copy.howManySeats}</span><div className="flex items-center gap-2"><button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center font-bold">−</button><span className="w-8 text-center font-bold">{seats}</span><button onClick={() => setSeats(Math.min(trip.seatsAvailable, seats + 1))} className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center font-bold">+</button></div></div>
                <div className="rounded-xl bg-surface-muted p-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-text-muted">{copy.selectedSeats}</span><span className="font-semibold">{seats}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span className="text-text-muted">{copy.perSeat}</span><span className="font-semibold">{formatPrice(trip.pricePerSeat)}</span></div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2"><span className="font-semibold text-text">{copy.totalLabel}</span><span className="text-lg font-bold text-brand-600">{formatPrice(trip.pricePerSeat * seats)}</span></div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[#fff8e8] p-3 text-xs leading-5 text-[#6b4b00]">
                  <Icon name="shield-check" size={16} className="mt-0.5 shrink-0" />
                  <span>{copy.warningOffline}</span>
                </div>
                <Button fullWidth size="lg" onClick={handleBook}>{copy.submitRequestBtn}</Button>
              </div></Card>
            )}
            {existingBooking && (<Card padding="sm" className="bg-brand-50 border-brand-200"><p className="text-sm text-brand-700 font-medium">{copy.alreadyBooked}</p></Card>)}
            {booked && (<Card padding="sm" className="bg-green-50 border-green-200"><p className="text-sm text-green-700 font-medium">{copy.bookedSuccess}</p></Card>)}
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
