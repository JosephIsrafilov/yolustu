import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/data/app_user.dart';
import '../network/providers.dart';
import '../../features/auth/data/session_storage.dart';

final languageProvider = StateNotifierProvider<LanguageNotifier, AppLanguage>((ref) {
  final storage = ref.watch(sessionStorageProvider);
  return LanguageNotifier(storage);
});

class LanguageNotifier extends StateNotifier<AppLanguage> {
  final SessionStorage _storage;
  static const _key = 'app_language';

  LanguageNotifier(this._storage) : super(AppLanguage.az) {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final langStr = await _storage.read(_key);
    if (langStr != null) {
      final lang = AppLanguage.values.firstWhere(
        (e) => e.name == langStr,
        orElse: () => AppLanguage.az,
      );
      state = lang;
    }
  }

  Future<void> setLanguage(AppLanguage language) async {
    state = language;
    await _storage.write(_key, language.name);
  }
}

final l10nProvider = Provider<AppLocalizations>((ref) {
  final lang = ref.watch(languageProvider);
  return AppLocalizations(lang);
});

class AppLocalizations {
  final AppLanguage language;
  
  AppLocalizations(this.language);

  // Common
  String get commonAll => _get({'az': 'Bütün', 'en': 'All', 'ru': 'Все'});
  String get commonSearch => _get({'az': 'Axtar', 'en': 'Search', 'ru': 'Найти'});
  String get commonFrom => _get({'az': 'Haradan', 'en': 'From', 'ru': 'Откуда'});
  String get commonTo => _get({'az': 'Haraya', 'en': 'To', 'ru': 'Куда'});
  String get commonDate => _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get commonPassenger => _get({'az': 'Sərnişin', 'en': 'Passenger', 'ru': 'Пассажир'});
  String get commonClose => _get({'az': 'Bağla', 'en': 'Close', 'ru': 'Закрыть'});
  String get commonBack => _get({'az': 'Geri', 'en': 'Back', 'ru': 'Назад'});
  String get commonError => _get({'az': 'Xəta baş verdi', 'en': 'An error occurred', 'ru': 'Произошла ошибка'});

  // Auth & Onboarding
  String get loginTitle => _get({'az': 'Daxil ol', 'en': 'Log in', 'ru': 'Войти'});
  String get loginSubtitle => _get({'az': 'Hesabınıza daxil olun', 'en': 'Log in to your account', 'ru': 'Войдите в свой аккаунт'});
  String get phoneLabel => _get({'az': 'Mobil Nömrə', 'en': 'Phone Number', 'ru': 'Номер телефона'});
  String get passwordLabel => _get({'az': 'Şifrə', 'en': 'Password', 'ru': 'Пароль'});
  String get loginBtn => _get({'az': 'Daxil ol', 'en': 'Log in', 'ru': 'Войти'});
  String get noAccount => _get({'az': 'Hesabınız yoxdur?', 'en': 'Don\'t have an account?', 'ru': 'Нет аккаунта?'});
  String get registerLink => _get({'az': 'Qeydiyyatdan keçin', 'en': 'Sign up', 'ru': 'Зарегистрироваться'});
  String get registerTitle => _get({'az': 'Qeydiyyat', 'en': 'Sign up', 'ru': 'Регистрация'});
  String get fullNameLabel => _get({'az': 'Ad və Soyad', 'en': 'Full Name', 'ru': 'Имя и Фамилия'});
  String get verifyBtn => _get({'az': 'Təsdiqlə', 'en': 'Verify', 'ru': 'Подтвердить'});
  
  // Navigation
  String get navHome => _get({'az': 'Ana səhifə', 'en': 'Home', 'ru': 'Главная'});
  String get navSearch => _get({'az': 'Axtar', 'en': 'Search', 'ru': 'Поиск'});
  String get navTrips => _get({'az': 'Gedişlər', 'en': 'Trips', 'ru': 'Поездки'});
  String get navChat => _get({'az': 'Söhbətlər', 'en': 'Chats', 'ru': 'Чаты'});
  String get navProfile => _get({'az': 'Profil', 'en': 'Profile', 'ru': 'Профиль'});
  String get navDriverPanel => _get({'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});

  // Chat
  String get chatTitle => _get({'az': 'Söhbət', 'en': 'Chat', 'ru': 'Чат'});
  String get chatPlaceholder => _get({'az': 'Mesajınızı yazın...', 'en': 'Type a message...', 'ru': 'Введите сообщение...'});
  String get chatSend => _get({'az': 'Göndər', 'en': 'Send', 'ru': 'Отправить'});
  String get chatSupport => _get({'az': 'Dəstək', 'en': 'Support', 'ru': 'Поддержка'});
  String get chatCallInApp => _get({'az': 'Tətbiqdaxili zəng', 'en': 'In-app call', 'ru': 'Звонок в приложении'});
  String get chatCallExternal => _get({'az': 'Zəng et', 'en': 'Call', 'ru': 'Позвонить'});

  // Profile & Settings
  String get profileSettings => _get({'az': 'Tənzimləmələr', 'en': 'Settings', 'ru': 'Настройки'});
  String get profileLanguage => _get({'az': 'Dil', 'en': 'Language', 'ru': 'Язык'});
  String get profileSupport => _get({'az': 'Dəstək çatına yaz', 'en': 'Contact Support', 'ru': 'Написать в поддержку'});
  String get profileLogout => _get({'az': 'Çıxış', 'en': 'Log out', 'ru': 'Выйти'});

  // Create Ride & AI
  String get aiTitle => _get({'az': 'Tövsiyə edilən qiymət', 'en': 'Recommended price', 'ru': 'Рекомендуемая цена'});
  String get aiSuggestBtn => _get({'az': 'Sİ təklifi al', 'en': 'Get AI suggestion', 'ru': 'Получить предложение ИИ'});
  String get applyPrice => _get({'az': 'Bu qiyməti istifadə et', 'en': 'Use this price', 'ru': 'Использовать эту цену'});

  // Home Screen
  String get homeHeroTitle => _get({'az': 'Azərbaycan daxilində', 'en': 'Within Azerbaijan', 'ru': 'В пределах Азербайджана'});
  String get homeHeroSubtitle => _get({'az': 'yolu paylaşın', 'en': 'share your ride', 'ru': 'делитесь поездкой'});
  String get homeHeroDescription => _get({'az': 'Rahat, təhlükəsiz və ucuz səyahət', 'en': 'Comfortable, safe and affordable travel', 'ru': 'Комфортная, безопасная и доступная поездка'});
  String get homeDriverPanelBtn => _get({'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});
  String get homeDocumentsPendingBtn => _get({'az': 'Sənədlər yoxlanılır', 'en': 'Documents under review', 'ru': 'Документы на проверке'});
  String get homeBecomeDriverBtn => _get({'az': 'Sürücü ol', 'en': 'Become a driver', 'ru': 'Стать водителем'});
  String get homePopularRoutes => _get({'az': 'Populyar marşrutlar', 'en': 'Popular routes', 'ru': 'Популярные маршруты'});
  String get homeDailyTrips => _get({'az': 'Gündəlik 15+ reis', 'en': 'Daily 15+ trips', 'ru': 'Ежедневно 15+ рейсов'});

  // Search Screen
  String get searchTitle => _get({'az': 'Səyahət axtar', 'en': 'Search trip', 'ru': 'Найти поездку'});
  String get searchFromLabel => _get({'az': 'Haradan', 'en': 'From', 'ru': 'Откуда'});
  String get searchToLabel => _get({'az': 'Hara', 'en': 'To', 'ru': 'Куда'});
  String get searchSwapTooltip => _get({'az': 'Şəhərləri dəyiş', 'en': 'Swap cities', 'ru': 'Поменять города'});
  String get searchDateLabel => _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get searchPassengersLabel => _get({'az': 'Sərnişin sayı', 'en': 'Number of passengers', 'ru': 'Количество пассажиров'});
  String get searchSameLocationError => _get({'az': 'Çıxış və təyinat eyni ola bilməz', 'en': 'Origin and destination cannot be the same', 'ru': 'Начало и пункт назначения не могут совпадать'});

  // Trip List Screen
  String get tripListSearchFailed => _get({'az': 'Axtarış alınmadı', 'en': 'Search failed', 'ru': 'Поиск не удался'});
  String get tripListNoResults => _get({'az': 'Səyahət tapılmadı', 'en': 'No trips found', 'ru': 'Поездки не найдены'});
  String get tripListNoResultsMessage => _get({'az': 'Bu marşrut üçün uyğun reis yoxdur. Filtri dəyişin və ya başqa tarix seçin.', 'en': 'No matching trips for this route. Change filters or try another date.', 'ru': 'Нет подходящих рейсов для этого маршрута. Измените фильтры или выберите другую дату.'});
  String get tripListSortTime => _get({'az': 'Vaxta görə', 'en': 'By time', 'ru': 'По времени'});
  String get tripListSortPrice => _get({'az': 'Qiymətə görə', 'en': 'By price', 'ru': 'По цене'});
  String get tripListVerifiedOnly => _get({'az': 'Yalnız təsdiqlənmiş', 'en': 'Verified only', 'ru': 'Только проверенные'});

  // Bookings Screen
  String get bookingsTitle => _get({'az': 'Rezervasiyalarım', 'en': 'My Reservations', 'ru': 'Мои резервации'});
  String get bookingsLoading => _get({'az': 'Yüklənir...', 'en': 'Loading...', 'ru': 'Загрузка...'});
  String get bookingsLoadFailed => _get({'az': 'Yüklənmədi', 'en': 'Failed to load', 'ru': 'Не удалось загрузить'});
  String get bookingsEmpty => _get({'az': 'Hələ rezervasiya yoxdur', 'en': 'No reservations yet', 'ru': 'Пока нет резерваций'});
  String get bookingsEmptyMessage => _get({'az': 'Səyahət axtarın və ilk rezervasiyanızı edin.', 'en': 'Search for trips and make your first reservation.', 'ru': 'Ищите поездки и сделайте свою первую резервацию.'});
  String get bookingsSearchTrips => _get({'az': 'Gediş axtar', 'en': 'Search trips', 'ru': 'Искать поездки'});

  // Settings Screen
  String get settingsGeneral => _get({'az': 'Ümumi', 'en': 'General', 'ru': 'Общие'});
  String get settingsLanguageTitle => _get({'az': 'Dil', 'en': 'Language', 'ru': 'Язык'});
  String get settingsLanguageAz => _get({'az': 'Azərbaycan', 'en': 'Azerbaijani', 'ru': 'Азербайджанский'});
  String get settingsLanguageEn => _get({'az': 'İngilis', 'en': 'English', 'ru': 'Английский'});
  String get settingsLanguageRu => _get({'az': 'Rus', 'en': 'Russian', 'ru': 'Русский'});
  String get settingsDarkMode => _get({'az': 'Qaranlıq rejim', 'en': 'Dark mode', 'ru': 'Тёмный режим'});
  String get settingsThemeSystem => _get({'az': 'Sistem', 'en': 'System', 'ru': 'Система'});
  String get settingsThemeLight => _get({'az': 'İşıqlı', 'en': 'Light', 'ru': 'Светлая'});
  String get settingsThemeDark => _get({'az': 'Qaranlıq', 'en': 'Dark', 'ru': 'Тёмная'});
  String get settingsNotifications => _get({'az': 'Bildirişlər', 'en': 'Notifications', 'ru': 'Уведомления'});
  String get settingsPushNotifications => _get({'az': 'Push bildirişləri', 'en': 'Push notifications', 'ru': 'Push-уведомления'});
  String get settingsEmailNotifications => _get({'az': 'E-poçt bildirişləri', 'en': 'Email notifications', 'ru': 'Email-уведомления'});
  String get settingsAccount => _get({'az': 'Hesab', 'en': 'Account', 'ru': 'Учётная запись'});
  String get settingsSecurity => _get({'az': 'Təhlükəsizlik', 'en': 'Security', 'ru': 'Безопасность'});
  String get settingsPrivacy => _get({'az': 'Məxfilik', 'en': 'Privacy', 'ru': 'Конфиденциальность'});
  String get settingsComingSoon => _get({'az': 'Tezliklə', 'en': 'Coming soon', 'ru': 'Скоро'});

  // Booking Detail Screen
  String get bookingDetailTitle => _get({'az': 'Rezervasiya detalları', 'en': 'Booking details', 'ru': 'Детали резервации'});
  String get bookingDetailNotFound => _get({'az': 'Rezervasiya tapılmadı', 'en': 'Booking not found', 'ru': 'Резервация не найдена'});
  String get bookingDetailGoBack => _get({'az': 'Geri qayıt', 'en': 'Go back', 'ru': 'Вернуться'});
  String get bookingDetailCancelTitle => _get({'az': 'Rezervasiyanı ləğv et', 'en': 'Cancel booking', 'ru': 'Отменить резервацию'});
  String get bookingDetailCancelMessage => _get({'az': 'Bu rezervasiyanı ləğv etmək istəyirsiniz?', 'en': 'Do you want to cancel this booking?', 'ru': 'Вы хотите отменить эту резервацию?'});
  String get bookingDetailCancelBtn => _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отменить'});
  String get bookingDetailDismiss => _get({'az': 'İmtina', 'en': 'Dismiss', 'ru': 'Отклонить'});
  String get bookingDetailDate => _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get bookingDetailTime => _get({'az': 'Vaxt', 'en': 'Time', 'ru': 'Время'});
  String get bookingDetailDriver => _get({'az': 'Sürücü', 'en': 'Driver', 'ru': 'Водитель'});
  String get bookingDetailSeats => _get({'az': 'Yerlər', 'en': 'Seats', 'ru': 'Места'});
  String get bookingDetailTotal => _get({'az': 'Cəmi', 'en': 'Total', 'ru': 'Итого'});
  String get bookingDetailMessageDriver => _get({'az': 'Sürücüyə yaz', 'en': 'Message driver', 'ru': 'Написать водителю'});
  String get bookingDetailLeaveReview => _get({'az': 'Rəy yaz', 'en': 'Leave review', 'ru': 'Оставить отзыв'});

  // Trip Detail Screen
  String get tripDetailTitle => _get({'az': 'Səyahət detalları', 'en': 'Trip details', 'ru': 'Детали поездки'});
  String get tripDetailNotFound => _get({'az': 'Səyahət tapılmadı', 'en': 'Trip not found', 'ru': 'Поездка не найдена'});
  String get tripDetailNotFoundMessage => _get({'az': 'Bu səyahət artıq mövcud deyil.', 'en': 'This trip is no longer available.', 'ru': 'Эта поездка больше недоступна.'});
  String get tripDetailDuration => _get({'az': '~4 saat', 'en': '~4 hours', 'ru': '~4 часа'});
  String get tripDetailDriverSection => _get({'az': 'Sürücü', 'en': 'Driver', 'ru': 'Водитель'});
  String get tripDetailTripsCount => _get({'az': 'səyahət', 'en': 'trips', 'ru': 'поездок'});
  String get tripDetailInfoSection => _get({'az': 'Səyahət məlumatları', 'en': 'Trip information', 'ru': 'Информация о поездке'});
  String get tripDetailAvailableSeats => _get({'az': 'Boş yerlər', 'en': 'Available seats', 'ru': 'Свободные места'});
  String get tripDetailSeatsUnit => _get({'az': 'yer', 'en': 'seats', 'ru': 'мест'});
  String get tripDetailCar => _get({'az': 'Avtomobil', 'en': 'Car', 'ru': 'Автомобиль'});
  String get tripDetailLuggage => _get({'az': 'Baqaj', 'en': 'Luggage', 'ru': 'Багаж'});
  String get tripDetailLuggageSize => _get({'az': 'Orta ölçülü çamadan', 'en': 'Medium-sized suitcase', 'ru': 'Чемодан среднего размера'});
  String get tripDetailPreferences => _get({'az': 'Üstünlüklər', 'en': 'Preferences', 'ru': 'Предпочтения'});
  String get tripDetailNoSmoking => _get({'az': 'Siqaret yox', 'en': 'No smoking', 'ru': 'Без курения'});
  String get tripDetailMusic => _get({'az': 'Musiqi var', 'en': 'Music available', 'ru': 'Музыка доступна'});
  String get tripDetailLuggageAllowed => _get({'az': 'Baqaj olar', 'en': 'Luggage allowed', 'ru': 'Багаж разрешен'});
  String get tripDetailBookBtn => _get({'az': 'Rezerv et', 'en': 'Book', 'ru': 'Забронировать'});
  String get tripDetailNoSeats => _get({'az': 'Yer yoxdur', 'en': 'No seats', 'ru': 'Нет мест'});
  String get tripDetailPriceLabel => _get({'az': 'Qiymət', 'en': 'Price', 'ru': 'Цена'});

  // Wallet Screen
  String get walletTitle => _get({'az': 'Pul kisəsi', 'en': 'Wallet', 'ru': 'Кошелёк'});
  String get walletMockBanner => _get({'az': 'Demo rejimi — ödənişlər hələ qoşulmayıb.', 'en': 'Demo mode — payments not yet connected.', 'ru': 'Демо-режим — платежи ещё не подключены.'});
  String get walletBalance => _get({'az': 'Balans', 'en': 'Balance', 'ru': 'Баланс'});
  String get walletPaymentMethod => _get({'az': 'Ödəniş üsulu', 'en': 'Payment method', 'ru': 'Способ оплаты'});
  String get walletNoCard => _get({'az': 'Kart əlavə edilməyib', 'en': 'No card added', 'ru': 'Карта не добавлена'});
  String get walletAddCard => _get({'az': 'Əlavə et', 'en': 'Add', 'ru': 'Добавить'});
  String get walletTransactions => _get({'az': 'Əməliyyatlar', 'en': 'Transactions', 'ru': 'Операции'});
  String get walletTopUp => _get({'az': 'Balans artımı', 'en': 'Top up', 'ru': 'Пополнение баланса'});
  String get walletComingSoon => _get({'az': 'Tezliklə', 'en': 'Coming soon', 'ru': 'Скоро'});
  String get walletTopUpBtn => _get({'az': 'Balansı artır', 'en': 'Top up balance', 'ru': 'Пополнить баланс'});

  // Driver Panel Screen
  String get driverPanelTitle => _get({'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});
  String get driverPanelAccessDenied => _get({'az': 'Bu səhifəyə giriş qadağandır.', 'en': 'Access to this page is forbidden.', 'ru': 'Доступ к этой странице запрещён.'});
  String get driverPanelGoBack => _get({'az': 'Geri qayıt', 'en': 'Go back', 'ru': 'Вернуться'});
  String get driverPanelHello => _get({'az': 'Salam', 'en': 'Hello', 'ru': 'Привет'});
  String get driverPanelVerified => _get({'az': 'Təsdiqlənmiş sürücü', 'en': 'Verified driver', 'ru': 'Проверенный водитель'});
  String get driverPanelQuickActions => _get({'az': 'Tez əməliyyatlar', 'en': 'Quick actions', 'ru': 'Быстрые действия'});
  String get driverPanelCreateRide => _get({'az': 'Yeni gediş yarat', 'en': 'Create new ride', 'ru': 'Создать новую поездку'});
  String get driverPanelMyRides => _get({'az': 'Gedişlərim', 'en': 'My rides', 'ru': 'Мои поездки'});
  String get driverPanelRequests => _get({'az': 'Sorğular', 'en': 'Requests', 'ru': 'Запросы'});
  String get driverPanelActiveRide => _get({'az': 'Aktiv gediş', 'en': 'Active ride', 'ru': 'Активная поездка'});
  String get driverPanelEarnings => _get({'az': 'Gəlir', 'en': 'Earnings', 'ru': 'Доход'});
  String get driverPanelThisMonth => _get({'az': 'Bu ay', 'en': 'This month', 'ru': 'В этом месяце'});
  String get driverPanelVehicles => _get({'az': 'Avtomobillər', 'en': 'Vehicles', 'ru': 'Автомобили'});
  String get driverPanelManageVehicles => _get({'az': 'Avtomobilləri idarə et', 'en': 'Manage vehicles', 'ru': 'Управлять автомобилями'});

  // Profile Screen
  String get profileTitle => _get({'az': 'Profil', 'en': 'Profile', 'ru': 'Профиль'});
  String get profileWallet => _get({'az': 'Pul kisəsi', 'en': 'Wallet', 'ru': 'Кошелёк'});
  String get profileReservations => _get({'az': 'Rezervasiyalarım', 'en': 'My Reservations', 'ru': 'Мои резервации'});
  String get profileReviews => _get({'az': 'Rəylər', 'en': 'Reviews', 'ru': 'Отзывы'});
  String get profileNotifications => _get({'az': 'Bildirişlər', 'en': 'Notifications', 'ru': 'Уведомления'});
  String get profileDriverPanel => _get({'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});
  String get profileDriverPending => _get({'az': 'Sürücü statusu: Yoxlanılır', 'en': 'Driver status: Under review', 'ru': 'Статус водителя: На проверке'});
  String get profileBecomeDriver => _get({'az': 'Sürücü olmaq istəyirsiniz?', 'en': 'Want to become a driver?', 'ru': 'Хотите стать водителем?'});
  String get profileSettingsMenu => _get({'az': 'Parametrlər', 'en': 'Settings', 'ru': 'Настройки'});
  String get profileHelp => _get({'az': 'Kömək', 'en': 'Help', 'ru': 'Помощь'});
  String get profileLogoutConfirm => _get({'az': 'Çıxış etmək istədiyinizə əminsiniz?', 'en': 'Are you sure you want to log out?', 'ru': 'Вы уверены, что хотите выйти?'});
  String get profileLogoutBtn => _get({'az': 'Çıxış et', 'en': 'Log out', 'ru': 'Выйти'});
  String get profileCancel => _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отмена'});

  // Trust & Safety
  String get trustVerifiedDriver => _get({'az': 'Təsdiqlənmiş sürücü', 'en': 'Verified driver', 'ru': 'Проверенный водитель'});
  String get trustDocumentsChecked => _get({'az': 'Sənədlər yoxlanılıb', 'en': 'Documents verified', 'ru': 'Документы проверены'});
  String get trustSafetyNote => _get({'az': 'Şəxsiyyət və sürücülük vəsiqəsi təsdiqlənib', 'en': 'Identity and license verified', 'ru': 'Удостоверение личности и права проверены'});
  String get trustTripsCount => _get({'az': 'səyahət', 'en': 'trips', 'ru': 'поездок'});
  String get trustRating => _get({'az': 'Reytinq', 'en': 'Rating', 'ru': 'Рейтинг'});

  // Active Ride Safety
  String get safetyTitle => _get({'az': 'Təhlükəsizlik', 'en': 'Safety', 'ru': 'Безопасность'});
  String get safetyShareTrip => _get({'az': 'Səfəri paylaş', 'en': 'Share trip', 'ru': 'Поделиться поездкой'});
  String get safetyShareCopied => _get({'az': 'Məlumat kopyalandı', 'en': 'Trip details copied', 'ru': 'Информация скопирована'});
  String get safetySOS => _get({'az': 'Təcili yardım (SOS)', 'en': 'Emergency (SOS)', 'ru': 'Экстренная помощь (SOS)'});
  String get safetySOSConfirmTitle => _get({'az': 'Təcili yardım çağırın?', 'en': 'Call emergency services?', 'ru': 'Вызвать экстренную помощь?'});
  String get safetySOSConfirmMessage => _get({'az': 'Təcili yardım nömrəsi: 112\n\nSəfər məlumatı buferə kopyalanacaq.', 'en': 'Emergency number: 112\n\nTrip details will be copied to clipboard.', 'ru': 'Экстренный номер: 112\n\nИнформация о поездке будет скопирована.'});
  String get safetySOSCall => _get({'az': '112-yə zəng et', 'en': 'Call 112', 'ru': 'Позвонить 112'});
  String get safetySOSCopy => _get({'az': 'Məlumatı kopyala', 'en': 'Copy details', 'ru': 'Скопировать данные'});
  String get safetyCancel => _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отмена'});

  String _get(Map<String, String> translations) {
    return translations[language.name] ?? translations['az'] ?? '';
  }
}
