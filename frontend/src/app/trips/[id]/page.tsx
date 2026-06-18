'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { formatPrice, formatRating, estimateDurationMinutes, formatDuration } from '@/lib/utils';
import { getLocalizedCityName } from '@/lib/cities';
import Icon from '@/components/ui/Icon';
import { MapContainer } from '@/components/ui/Map';
import { useRideChats } from '@/hooks/useRideChats';
import { messagesService, tripsService } from '@/services';
import type { Trip } from '@/types';
import { I18N } from '@/lib/i18n';
import { getUserCapabilities } from '@/lib/access-control';
import UserAvatar from '@/components/ui/UserAvatar';
import WalletPaymentModal from '@/components/bookings/WalletPaymentModal';
import SuccessModal from '@/components/ui/SuccessModal';

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
    driverModeTitle: 'Sərnişin rejimi tələb olunur',
    driverModeDesc: 'Gediş rezerv etmək üçün sərnişin rejiminə keçin.',
    switchToPassengerBtn: 'Rejimi dəyiş',
    waitingApproval: 'Sürücü təsdiqi gözlənilir',
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
    driverModeTitle: 'Требуется режим пассажира',
    driverModeDesc: 'Переключитесь в режим пассажира, чтобы бронировать поездки.',
    switchToPassengerBtn: 'Сменить режим',
    waitingApproval: 'Ожидание подтверждения водителя',
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
    driverModeTitle: 'Passenger mode required',
    driverModeDesc: 'Switch to passenger mode to book rides.',
    switchToPassengerBtn: 'Switch mode',
    waitingApproval: 'Waiting for driver approval',
  },
};

const PREFERENCE_I18N = {
  az: {
    title: 'Səyahət seçimləri və rahatlıq',
    femaleOnly: 'Yalnız qadınlar',
    smoking: 'Siqaret',
    pets: 'Heyvanlar',
    music: 'Musiqi',
    yes: 'Bəli',
    no: 'Xeyr',
    allowed: 'İcazəlidir',
    forbidden: 'Qadağandır',
    verifiedDriver: 'Təsdiqlənmiş Sürücü',
  },
  ru: {
    title: 'Параметры поездки и удобства',
    femaleOnly: 'Только женщины',
    smoking: 'Курение',
    pets: 'Питомцы',
    music: 'Музыка',
    yes: 'Да',
    no: 'Нет',
    allowed: 'Разрешено',
    forbidden: 'Запрещено',
    verifiedDriver: 'Подтвержденный водитель',
  },
  en: {
    title: 'Ride Preferences & Comfort',
    femaleOnly: 'Female only',
    smoking: 'Smoking',
    pets: 'Pets',
    music: 'Music',
    yes: 'Yes',
    no: 'No',
    allowed: 'Allowed',
    forbidden: 'Forbidden',
    verifiedDriver: 'Verified driver',
  },
} as const;

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
    unreadChats,
    activeMode,
    switchRole,
  } = useAppStore();
  const [seats, setSeats] = useState(1);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [hasBookingSucceeded, setHasBookingSucceeded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [loadedTrip, setLoadedTrip] = useState<Trip | null>(null);
  const [tripLoadError, setTripLoadError] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const tripId = Array.isArray(id) ? id[0] : id;
  const { getRideChatByBookingId, upsertRideChat } = useRideChats(isAuthenticated);

  const copy = TRIP_DETAILS_I18N[language] || TRIP_DETAILS_I18N.en;
  const common = I18N[language].common;
  const preferenceCopy = PREFERENCE_I18N[language] || PREFERENCE_I18N.en;
  const driverModeCopy = {
    title: copy.driverModeTitle,
    description: copy.driverModeDesc,
    action: copy.switchToPassengerBtn,
  };

  React.useEffect(() => {
    if (!tripId || trips.some((t) => t.id === tripId)) return;
    tripsService.getTripById(tripId)
      .then((tripData) => {
        setLoadedTrip(tripData);
        setTripLoadError(false);
      })
      .catch(() => {
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
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);
  const existingBooking = bookings.find((b) => b.tripId === trip.id && b.passengerId === currentUser?.id && b.status !== 'cancelled' && b.status !== 'rejected');
  const rideChatConversation = existingBooking ? getRideChatByBookingId(existingBooking.id) : undefined;
  const durationMin = estimateDurationMinutes(trip.origin, trip.destination, trip.departureCity, trip.arrivalCity);
  const departureCity = getLocalizedCityName(trip.departureCity, language);
  const arrivalCity = getLocalizedCityName(trip.arrivalCity, language);

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    if (isOwnTrip || existingBooking || isBookingLoading) return;
    setIsBookingLoading(true);
    let bookingId = '';
    try {
      bookingId = await createBooking(trip.id, seats);
    } catch {
      bookingId = '';
    } finally {
      setIsBookingLoading(false);
    }
    if (!bookingId) return;
    setHasBookingSucceeded(true);
    setShowSuccessModal(true);
  };

  const openRideChat = async () => {
    if (!existingBooking || isOpeningChat) return;
    setIsOpeningChat(true);
    try {
      if (rideChatConversation) {
        router.push(ROUTES.chatDetails(rideChatConversation.id));
        return;
      }

      const conversation = await messagesService.createRideChat(existingBooking.id);
      upsertRideChat(conversation);
      router.push(ROUTES.chatDetails(conversation.id));
    } finally {
      setIsOpeningChat(false);
    }
  };

  return (
    <WebLayout title={copy.tripDetailsTitle} showBack>
      <div className="grid lg:grid-cols-3 gap-6 stagger-children min-w-0">
        <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          <Card><RouteTimeline departure={trip.departureCity} arrival={trip.arrivalCity} meetingPoint={trip.meetingPoint} dropoffPoint={trip.dropoffPoint} /></Card>
          {trip.origin && trip.destination && (
            <Card className="overflow-hidden p-0">
              <div className="h-[320px] w-full">
                <MapContainer 
                  className="h-full w-full"
                  origin={trip.origin}
                  destination={trip.destination}
                  markers={[
                    { position: [trip.origin.lat, trip.origin.lng], type: 'origin', popup: departureCity },
                    { position: [trip.destination.lat, trip.destination.lng], type: 'destination', popup: arrivalCity }
                  ]}
                  fitBounds={[
                    [trip.origin.lat, trip.origin.lng],
                    [trip.destination.lat, trip.destination.lng]
                  ]}
                />
              </div>
            </Card>
          )}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div><Icon name="clock" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">{copy.dateLabel}</p><p className="text-sm font-semibold">{trip.date}</p><p className="text-xs text-text-muted">{trip.time}</p><p className="text-[11px] text-text-muted mt-1 bg-surface-muted inline-block px-2 py-0.5 rounded-full">{formatDuration(durationMin, language)}</p></div>
              <div><Icon name="users" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">{copy.seatsLabel}</p><p className="text-sm font-semibold">{trip.seatsAvailable}/{trip.seatsTotal}</p><p className="text-xs text-text-muted">{copy.availableLabel}</p></div>
              <div><Icon name="car" size={20} className="mx-auto text-brand-500 mb-1" /><p className="text-xs text-text-muted">{copy.vehicleLabel}</p><p className="text-sm font-semibold">{trip.carModel}</p></div>
            </div>
          </Card>
          <Card>
            <h4 className="text-sm font-bold text-text mb-3">
              {preferenceCopy.title}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.femaleOnly ? 'bg-pink-50/20 border-pink-200 text-pink-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name="venus" size={20} className={trip.femaleOnly ? 'text-pink-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{preferenceCopy.femaleOnly}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.femaleOnly ? preferenceCopy.yes : preferenceCopy.no}</span>
              </div>
              
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.smokingAllowed ? 'bg-brand-50/20 border-brand-200 text-brand-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name={trip.smokingAllowed ? "cigarette" : "cigarette-off"} size={20} className={trip.smokingAllowed ? 'text-brand-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{preferenceCopy.smoking}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.smokingAllowed ? preferenceCopy.allowed : preferenceCopy.forbidden}</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.petsAllowed ? 'bg-brand-50/20 border-brand-200 text-brand-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name="paw-print" size={20} className={trip.petsAllowed ? 'text-brand-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{preferenceCopy.pets}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.petsAllowed ? preferenceCopy.allowed : preferenceCopy.forbidden}</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${trip.musicAllowed !== false ? 'bg-brand-50/20 border-brand-200 text-brand-700' : 'bg-surface-muted/20 border-border text-text-secondary/60'}`}>
                <Icon name="music" size={20} className={trip.musicAllowed !== false ? 'text-brand-600' : 'text-text-muted'} />
                <span className="text-xs font-bold">{preferenceCopy.music}</span>
                <span className="text-[10px] text-text-muted font-medium">{trip.musicAllowed !== false ? preferenceCopy.allowed : preferenceCopy.forbidden}</span>
              </div>
            </div>
          </Card>
          {trip.comment && (<Card padding="md"><div className="flex items-start gap-3"><Icon name="message-square" size={16} className="text-text-muted mt-0.5 shrink-0" /><p className="text-sm text-text-secondary">{trip.comment}</p></div></Card>)}
          {tripReviews.length > 0 && (<div><h3 className="text-lg font-semibold text-text mb-3">{copy.driverReviewsTitle}</h3><div className="grid sm:grid-cols-2 gap-3">{tripReviews.slice(0, 4).map((r) => (<ReviewCard key={r.id} review={r} author={users.find((u) => u.id === r.authorId)} />))}</div></div>)}
        </div>
        <div className="lg:col-span-1 min-w-0">
          <div className="sticky top-24 flex flex-col gap-4 min-w-0">
            <Card className="bg-linear-to-r from-brand-50 to-blue-50 border-brand-100"><div className="flex items-center justify-between"><span className="text-sm text-text-secondary">{copy.pricePerSeatLabel}</span><span className="text-2xl font-bold text-brand-600">{formatPrice(trip.pricePerSeat)}</span></div></Card>
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
                <Link
                  href={ROUTES.profileDetails(driver.id)}
                  className="flex items-center gap-3"
                  aria-label={driver.fullName}
                >
                  <UserAvatar name={driver.fullName} avatarUrl={driver.avatarUrl} size={48} />
                  <div className="flex-1">
                    <p className="text-base font-semibold text-text flex items-center gap-1">
                      <span className="hover:text-brand-600">{driver.fullName}</span>
                      {driver.verificationStatus === 'approved' && (
                        <span title={preferenceCopy.verifiedDriver}>
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
                      <span>{getLocalizedCityName(driver.city, language)}</span>
                    </div>
                  </div>
                </Link>
              </Card>
            )}
            {isOwnTrip && (<Card padding="sm" className="bg-amber-50 border-amber-200"><div className="flex items-center gap-2 text-sm text-amber-700"><Icon name="alert-triangle" size={16} />{copy.ownTripWarning}</div></Card>)}
            
            {(!isOwnTrip && (existingBooking?.status === 'accepted' || existingBooking?.status === 'paid')) && (
              <div className="flex flex-col gap-2">
                <Button 
                  fullWidth 
                  variant="outline" 
                  onClick={openRideChat}
                  loading={isOpeningChat}
                  className="flex items-center justify-center gap-2 relative"
                >
                  <Icon name="message-square" size={18} />
                  {copy.goToChatBtn}
                  {rideChatConversation && unreadChats[rideChatConversation.id] && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </Button>
                
                {existingBooking && (existingBooking.status === 'accepted' || existingBooking.status === 'paid') && (
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      language === 'az' 
                        ? `Salam! Mən Yolmates ilə ${trip.departureCity} şəhərindən ${trip.arrivalCity} şəhərinə gedirəm. Sürücü: ${driver?.fullName || 'Sürücü'}, Vaxt: ${trip.date} ${trip.time}. Gediş detalları: ${window.location.origin}/trips/${trip.id}`
                        : language === 'ru'
                        ? `Привет! Я еду с Yolmates из ${trip.departureCity} в ${trip.arrivalCity}. Водитель: ${driver?.fullName || 'Водитель'}, Время: ${trip.date} ${trip.time}. Детали поездки: ${window.location.origin}/trips/${trip.id}`
                        : `Hi! I am traveling with Yolmates from ${trip.departureCity} to ${trip.arrivalCity}. Driver: ${driver?.fullName || 'Driver'}, Time: ${trip.date} ${trip.time}. Trip details: ${window.location.origin}/trips/${trip.id}`
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
            
            {!isOwnTrip && isAuthenticated && capabilities.canAccessDriverDashboard && !capabilities.canBookRide && (
              <Card padding="sm" className="bg-blue-50 border-blue-200">
                <div className="space-y-2 text-sm text-blue-800">
                  <p className="font-semibold">{driverModeCopy.title}</p>
                  <p>{driverModeCopy.description}</p>
                  <Button size="sm" variant="outline" onClick={() => switchRole('passenger')}>
                    {driverModeCopy.action}
                  </Button>
                </div>
              </Card>
            )}
            {!isOwnTrip && (!isAuthenticated || capabilities.canBookRide) && trip.status === 'active' && trip.seatsAvailable > 0 && !existingBooking && !hasBookingSucceeded && (
              <Card className="border-brand-200 shadow-card-hover"><div className="flex flex-col gap-4">
                <div>
                  <p className="text-base font-bold text-text">{copy.bookingRequestTitle}</p>
                  <p className="text-xs text-text-muted">{copy.bookingRequestDesc}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{copy.howManySeats}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSeats(Math.max(1, seats - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted font-bold">
                      <Icon name="minus" size={14} />
                    </button>
                    <span className="w-8 text-center font-bold">{seats}</span>
                    <button onClick={() => setSeats(Math.min(trip.seatsAvailable, seats + 1))} className="h-9 w-9 rounded-lg bg-surface-muted flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
                <div className="rounded-xl bg-surface-muted p-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-text-muted">{copy.selectedSeats}</span><span className="font-semibold">{seats}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span className="text-text-muted">{copy.perSeat}</span><span className="font-semibold">{formatPrice(trip.pricePerSeat)}</span></div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2"><span className="font-semibold text-text">{copy.totalLabel}</span><span className="text-lg font-bold text-brand-600">{formatPrice(trip.pricePerSeat * seats)}</span></div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[#fff8e8] p-3 text-xs leading-5 text-[#6b4b00]">
                  <Icon name="shield-check" size={16} className="mt-0.5 shrink-0" />
                  <span>{copy.warningOffline}</span>
                </div>
                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleBook}
                  loading={isBookingLoading}
                  disabled={isBookingLoading}
                >
                  {copy.submitRequestBtn}
                </Button>
              </div></Card>
            )}
            {existingBooking && (
              <Card className="border-brand-200 shadow-card-hover border-2">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-text">Sizin Rezerviniz</p>
                    <StatusBadge status={existingBooking.status} />
                  </div>
                  <div className="rounded-xl bg-surface-muted p-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-text-muted">{copy.selectedSeats}</span><span className="font-semibold">{existingBooking.seatsRequested}</span></div>
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2"><span className="font-semibold text-text">{copy.totalLabel}</span><span className="text-lg font-bold text-brand-600">{formatPrice(existingBooking.totalPrice || (trip.pricePerSeat * existingBooking.seatsRequested))}</span></div>
                  </div>
                  
                  {existingBooking.status === 'pending' && (
                    <div className="text-sm font-semibold text-brand-600 text-center py-2 bg-brand-50 rounded-lg">
                      {copy.waitingApproval}
                    </div>
                  )}
                  {existingBooking.status === 'accepted' && (
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={async () => {
                        try {
                          const service = await import('@/services').then(m => m.paymentsService);
                          const res = await service.createPaymentSession(existingBooking.id);
                          if (res.provider === 'mock') {
                            await service.mockSucceed(res.paymentId);
                            await fetchBookings();
                            return;
                          }
                          window.location.href = res.checkoutUrl;
                        } catch (error) {
                          console.error('Payment start failed', error);
                        }
                      }} className="flex-1">
                        <Icon name="credit-card" size={14} className="shrink-0 flex-none" />
                        <span className="truncate">{I18N[language].bookings.payBtn}</span>
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setIsWalletModalOpen(true)} className="flex-1">
                        <Icon name="credit-card" size={14} className="shrink-0 flex-none" />
                        <span className="truncate">Cüzdanla ödə</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {existingBooking && (
        <WalletPaymentModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          booking={existingBooking}
          onPayDirect={async () => {
            setIsWalletModalOpen(false);
            try {
              const service = await import('@/services').then(m => m.paymentsService);
              const res = await service.createPaymentSession(existingBooking.id);
              if (res.provider === 'mock') {
                await service.mockSucceed(res.paymentId);
                await fetchBookings();
                return;
              }
              window.location.href = res.checkoutUrl;
            } catch (error) {
              console.error('Payment start failed', error);
            }
          }}
          onPaymentSuccess={() => {
            setIsWalletModalOpen(false);
            fetchBookings();
          }}
        />
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push(ROUTES.bookings);
        }}
        title={language === 'az' ? 'Rezerv Sorğusu Göndərildi!' : language === 'ru' ? 'Запрос отправлен!' : 'Booking Request Sent!'}
        description={
          language === 'az'
            ? 'Rezerv sorğunuz uğurla sürücüyə göndərildi. Sürücü təsdiqlədikdən sonra ödəniş edə bilərsiniz.'
            : language === 'ru'
            ? 'Ваш запрос на бронирование успешно отправлен водителю. Вы сможете оплатить после подтверждения.'
            : 'Your booking request has been successfully sent to the driver. You can pay after confirmation.'
        }
        buttonLabel={language === 'az' ? 'Tamam' : language === 'ru' ? 'ОК' : 'OK'}
      />
    </WebLayout>
  );
}
