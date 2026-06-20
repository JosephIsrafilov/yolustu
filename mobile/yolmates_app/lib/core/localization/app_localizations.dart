import 'dart:ui' as ui;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/data/app_user.dart';
import '../network/providers.dart';
import '../../features/auth/data/session_storage.dart';

final languageProvider =
    StateNotifierProvider<LanguageNotifier, AppLanguage>((ref) {
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
      return;
    }
    state = _deviceLanguage(ui.PlatformDispatcher.instance.locale);
  }

  Future<void> setLanguage(AppLanguage language) async {
    state = language;
    await _storage.write(_key, language.name);
  }

  AppLanguage _deviceLanguage(ui.Locale locale) {
    switch (locale.languageCode.toLowerCase()) {
      case 'az':
        return AppLanguage.az;
      case 'ru':
        return AppLanguage.ru;
      default:
        return AppLanguage.en;
    }
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
  String get commonAll => _get({'az': 'Bütün', 'en': 'All', 'ru': 'Всё'});
  String get allCities =>
      _get({'az': 'Bütün Şəhərlər', 'en': 'All Cities', 'ru': 'Все города'});
  String get commonSearch =>
      _get({'az': 'Axtar', 'en': 'Search', 'ru': 'Найти'});
  String get commonFrom =>
      _get({'az': 'Haradan', 'en': 'From', 'ru': 'Откуда'});
  String get commonTo => _get({'az': 'Haraya', 'en': 'To', 'ru': 'Куда'});
  String get commonDate => _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get commonPassenger =>
      _get({'az': 'Sərnişin', 'en': 'Passenger', 'ru': 'Пассажир'});
  String get dateSelectTitle =>
      _get({'az': 'Tarix Seçin', 'en': 'Select Date', 'ru': 'Выберите дату'});
  String get dateToday =>
      _get({'az': 'Bu gün', 'en': 'Today', 'ru': 'Сегодня'});
  String get dateTomorrow =>
      _get({'az': 'Sabah', 'en': 'Tomorrow', 'ru': 'Завтра'});
  String get dateThisWeek =>
      _get({'az': 'Bu həftə', 'en': 'This week', 'ru': 'На этой неделе'});
  String get dateFromCalendar => _get({
        'az': 'Təqvimdən seçin...',
        'en': 'Select from calendar...',
        'ru': 'Выбрать из календаря...'
      });
  String get dateOptional => _get({
        'az': 'Tarix seçin (İstəyə görə)',
        'en': 'Select Date (Optional)',
        'ru': 'Выберите дату (Необязательно)'
      });
  String get dateDeparture => _get(
      {'az': 'Gediş tarixi', 'en': 'Departure Date', 'ru': 'Дата отправления'});
  String get commonClose =>
      _get({'az': 'Bağla', 'en': 'Close', 'ru': 'Закрыть'});
  String get commonBack => _get({'az': 'Geri', 'en': 'Back', 'ru': 'Назад'});
  String get commonError => _get({
        'az': 'Xəta baş verdi',
        'en': 'An error occurred',
        'ru': 'Произошла ошибка'
      });

  String apiErrorMessage(String code, String fallback) {
    switch (code) {
      case 'NETWORK_ERROR':
        return _get({
          'az': 'İnternet bağlantısı yoxdur',
          'en': 'No internet connection',
          'ru': 'Нет подключения к интернету'
        });
      case 'TIMEOUT':
        return _get({
          'az': 'Sorğu vaxtı bitdi. Zəhmət olmasa yenidən cəhd edin',
          'en': 'Request timed out. Please try again',
          'ru': 'Время ожидания истекло. Пожалуйста, попробуйте снова'
        });
      case 'UNAUTHORIZED':
        return _get({
          'az': 'İstifadəçi təsdiqi tələb olunur',
          'en': 'User authentication required',
          'ru': 'Требуется аутентификация пользователя'
        });
      case 'FORBIDDEN':
        return _get({
          'az': 'Bu əməliyyata icazəniz yoxdur',
          'en': 'You do not have permission for this operation',
          'ru': 'У вас нет прав на эту операцию'
        });
      case 'NOT_FOUND':
        return _get({
          'az': 'Məlumat tapılmadı',
          'en': 'Data not found',
          'ru': 'Данные не найдены'
        });
      case 'CONFLICT':
        return _get({
          'az': 'Məlumat artıq mövcuddur',
          'en': 'Data already exists',
          'ru': 'Данные уже существуют'
        });
      case 'VALIDATION_ERROR':
        return _get({
          'az': 'Məlumat doğrulanması uğursuz oldu',
          'en': 'Data validation failed',
          'ru': 'Ошибка валидации данных'
        });
      case 'RATE_LIMITED':
        return _get({
          'az': 'Çox tez-tez cəhd etdiniz. Zəhmət olmasa gözləyin',
          'en': 'Too many attempts. Please wait',
          'ru': 'Слишком много попыток. Пожалуйста, подождите'
        });
      case 'SERVER_ERROR':
        return _get({
          'az': 'Server xətası. Zəhmət olmasa yenidən cəhd edin',
          'en': 'Server error. Please try again',
          'ru': 'Ошибка сервера. Пожалуйста, попробуйте снова'
        });
      case 'CANCELLED':
        return _get({
          'az': 'Sorğu ləğv edildi',
          'en': 'Request cancelled',
          'ru': 'Запрос отменен'
        });
      case 'BAD_CERTIFICATE':
        return _get({
          'az': 'SSL sertifikatı səhvdir',
          'en': 'Bad SSL certificate',
          'ru': 'Неверный SSL-сертификат'
        });
      default:
        // Try to translate the fallback message, otherwise return it.
        if (fallback.toLowerCase().contains('server')) {
          return _get(
              {'az': fallback, 'en': 'Server error', 'ru': 'Ошибка сервера'});
        }
        return fallback;
    }
  }

  // Auth & Onboarding
  String get loginTitle =>
      _get({'az': 'Daxil ol', 'en': 'Log in', 'ru': 'Войти'});
  String get loginSubtitle => _get({
        'az': 'Hesabınıza daxil olun',
        'en': 'Log in to your account',
        'ru': 'Войдите в свой аккаунт'
      });
  String get phoneLabel =>
      _get({'az': 'Mobil Nömrə', 'en': 'Phone Number', 'ru': 'Номер телефона'});
  String get passwordLabel =>
      _get({'az': 'Şifrə', 'en': 'Password', 'ru': 'Пароль'});
  String get loginBtn =>
      _get({'az': 'Daxil ol', 'en': 'Log in', 'ru': 'Войти'});
  String get noAccount => _get({
        'az': 'Hesabınız yoxdur?',
        'en': 'Don\'t have an account?',
        'ru': 'Нет аккаунта?'
      });
  String get registerLink => _get({
        'az': 'Qeydiyyatdan keçin',
        'en': 'Sign up',
        'ru': 'Зарегистрироваться'
      });
  String get registerTitle =>
      _get({'az': 'Qeydiyyat', 'en': 'Sign up', 'ru': 'Регистрация'});
  String get firstNameLabel =>
      _get({'az': 'Ad', 'en': 'First Name', 'ru': 'Имя'});
  String get lastNameLabel =>
      _get({'az': 'Soyad', 'en': 'Last Name', 'ru': 'Фамилия'});
  String get emailLabel =>
      _get({'az': 'E-poçt', 'en': 'Email', 'ru': 'Эл. почта'});
  String get verifyBtn =>
      _get({'az': 'Təsdiqlə', 'en': 'Verify', 'ru': 'Подтвердить'});
  String get registerNameRequired => _get({
        'az': 'Ad və Soyad daxil edilməlidir',
        'en': 'Name and Surname are required',
        'ru': 'Введите имя и фамилию'
      });
  String get registerEmailRequired => _get({
        'az': 'E-poçt daxil edilməlidir',
        'en': 'Email is required',
        'ru': 'Введите эл. почту'
      });
  String get registerEmailInvalid => _get({
        'az': 'Düzgün e-poçt daxil edin',
        'en': 'Enter a valid email',
        'ru': 'Введите правильную эл. почту'
      });
  String get registerPasswordRequired => _get({
        'az': 'Şifrə daxil edilməlidir',
        'en': 'Password is required',
        'ru': 'Введите пароль'
      });
  String get registerPasswordLength => _get({
        'az': 'Şifrə ən az 8 simvol olmalıdır',
        'en': 'Password must be at least 8 characters',
        'ru': 'Пароль должен быть не менее 8 символов'
      });

  String get onboardingSkip =>
      _get({'az': 'Keç', 'en': 'Skip', 'ru': 'Пропустить'});
  String get onboardingNext =>
      _get({'az': 'Növbəti', 'en': 'Next', 'ru': 'Далее'});
  String get onboardingStart =>
      _get({'az': 'Başla', 'en': 'Start', 'ru': 'Начать'});
  String get onboardingSaveMoneyTitle => _get({
        'az': 'Səyahət xərclərini azaldın',
        'en': 'Save on every trip',
        'ru': 'Экономьте на каждой поездке'
      });
  String get onboardingSaveMoneyMessage => _get({
        'az':
            'Şəhərlərarası yolu paylaşın, biletdən daha sərfəli qiymətlə gedin.',
        'en': 'Share intercity rides and pay less than regular tickets.',
        'ru':
            'Делите междугородние поездки и платите меньше, чем за обычные билеты.'
      });
  String get onboardingSafeTitle => _get({
        'az': 'Daha təhlükəsiz seçin',
        'en': 'Travel with confidence',
        'ru': 'Путешествуйте спокойнее'
      });
  String get onboardingSafeMessage => _get({
        'az':
            'Təsdiqlənmiş sürücülər, reytinqlər və dəstək ilə daha güvənli yol gedin.',
        'en': 'Verified drivers, ratings, and support help you ride safer.',
        'ru':
            'Проверенные водители, рейтинги и поддержка делают поездку безопаснее.'
      });
  String get onboardingEasyTitle => _get({
        'az': 'Bir neçə toxunuşla hazırdır',
        'en': 'Easy from search to chat',
        'ru': 'Легко от поиска до чата'
      });
  String get onboardingEasyMessage => _get({
        'az':
            'Axtarın, bron edin və sürücü ilə söhbətə bir neçə toxunuşda başlayın.',
        'en': 'Search, book, and chat with the driver in just a few taps.',
        'ru':
            'Ищите, бронируйте и общайтесь с водителем всего в несколько касаний.'
      });

  // Navigation
  String get navHome =>
      _get({'az': 'Ana səhifə', 'en': 'Home', 'ru': 'Главная'});
  String get navSearch => _get({'az': 'Axtar', 'en': 'Search', 'ru': 'Поиск'});
  String get navTrips =>
      _get({'az': 'Gedişlər', 'en': 'Trips', 'ru': 'Поездки'});
  String get navChat => _get({'az': 'Söhbətlər', 'en': 'Chats', 'ru': 'Чаты'});
  String get navProfile =>
      _get({'az': 'Profil', 'en': 'Profile', 'ru': 'Профиль'});
  String get navDriverPanel => _get(
      {'az': 'Panel', 'en': 'Driver Panel', 'ru': 'Панель водителя'});

  // Chat
  String get chatTitle => _get({'az': 'Söhbət', 'en': 'Chat', 'ru': 'Чат'});
  String get chatPlaceholder => _get({
        'az': 'Mesajınızı yazın...',
        'en': 'Type a message...',
        'ru': 'Введите сообщение...'
      });
  String get chatSend =>
      _get({'az': 'Göndər', 'en': 'Send', 'ru': 'Отправить'});
  String get chatSupport =>
      _get({'az': 'Dəstək', 'en': 'Support', 'ru': 'Поддержка'});
  String get chatCallInApp => _get({
        'az': 'Tətbiqdaxili zəng',
        'en': 'In-app call',
        'ru': 'Звонок в приложении'
      });
  String get chatCallExternal =>
      _get({'az': 'Zəng et', 'en': 'Call', 'ru': 'Позвонить'});
  String get chatEmpty =>
      _get({'az': 'Mesaj yoxdur', 'en': 'No messages', 'ru': 'Нет сообщений'});
  String get chatEmptyMessage => _get({
        'az': 'Rezerv etdikdən sonra sürücü ilə burada yazışa biləcəksiniz.',
        'en': 'After booking, you can chat with your driver here.',
        'ru': 'После бронирования вы сможете общаться с водителем здесь.'
      });
  String get chatSearchTrips => _get(
      {'az': 'Səyahət axtar', 'en': 'Search trips', 'ru': 'Искать поездки'});

  // Profile & Settings
  String get profileSettings =>
      _get({'az': 'Tənzimləmələr', 'en': 'Settings', 'ru': 'Настройки'});
  String get profileLanguage =>
      _get({'az': 'Dil', 'en': 'Language', 'ru': 'Язык'});
  String get profileSupport => _get({
        'az': 'Dəstək çatına yaz',
        'en': 'Contact Support',
        'ru': 'Написать в поддержку'
      });
  String get profileLogout =>
      _get({'az': 'Çıxış', 'en': 'Log out', 'ru': 'Выйти'});

  // Create Ride & AI
  String get aiTitle => _get({
        'az': 'Tövsiyə edilən qiymət',
        'en': 'Recommended price',
        'ru': 'Рекомендуемая цена'
      });
  String get aiSuggestBtn => _get({
        'az': 'Sİ təklifi al',
        'en': 'Get AI suggestion',
        'ru': 'Получить предложение ИИ'
      });
  String get applyPrice => _get({
        'az': 'Bu qiyməti istifadə et',
        'en': 'Use this price',
        'ru': 'Использовать эту цену'
      });

  // Home Screen
  String get homeHeroTitle => _get({
        'az': 'Azərbaycan daxilində',
        'en': 'Within Azerbaijan',
        'ru': 'В пределах Азербайджана'
      });
  String get homeHeroSubtitle => _get({
        'az': 'yolu paylaşın',
        'en': 'share your ride',
        'ru': 'делитесь поездкой'
      });
  String get homeHeroDescription => _get({
        'az': 'Rahat, təhlükəsiz və ucuz səyahət',
        'en': 'Comfortable, safe and affordable travel',
        'ru': 'Комфортная, безопасная и доступная поездка'
      });
  String get homeDriverPanelBtn => _get(
      {'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});
  String get homeDocumentsPendingBtn => _get({
        'az': 'Sənədlər yoxlanılır',
        'en': 'Documents under review',
        'ru': 'Документы на проверке'
      });
  String get homeBecomeDriverBtn => _get(
      {'az': 'Sürücü ol', 'en': 'Become a driver', 'ru': 'Стать водителем'});
  String get homePopularRoutes => _get({
        'az': 'Populyar marşrutlar',
        'en': 'Popular routes',
        'ru': 'Популярные маршруты'
      });
  String get homeDailyTrips => _get({
        'az': 'Gündəlik 15+ reis',
        'en': 'Daily 15+ trips',
        'ru': 'Ежедневно 15+ рейсов'
      });

  // Search Screen
  String get searchTitle =>
      _get({'az': 'Səyahət axtar', 'en': 'Search trip', 'ru': 'Найти поездку'});
  String get searchFromLabel =>
      _get({'az': 'Haradan', 'en': 'From', 'ru': 'Откуда'});
  String get searchToLabel => _get({'az': 'Hara', 'en': 'To', 'ru': 'Куда'});
  String get searchSwapTooltip => _get(
      {'az': 'Şəhərləri dəyiş', 'en': 'Swap cities', 'ru': 'Поменять города'});
  String get searchDateLabel =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get searchPassengersLabel => _get({
        'az': 'Sərnişin sayı',
        'en': 'Number of passengers',
        'ru': 'Количество пассажиров'
      });
  String get searchSameLocationError => _get({
        'az': 'Çıxış və təyinat eyni ola bilməz',
        'en': 'Origin and destination cannot be the same',
        'ru': 'Начало и пункт назначения не могут совпадать'
      });
  String get searchRecentSearches => _get({
        'az': 'Son axtarışlar',
        'en': 'Recent searches',
        'ru': 'Недавние поиски'
      });

  // Trip List Screen
  String get tripListSearchFailed => _get({
        'az': 'Axtarış alınmadı',
        'en': 'Search failed',
        'ru': 'Поиск не удался'
      });
  String get tripListNoResults => _get({
        'az': 'Səyahət tapılmadı',
        'en': 'No trips found',
        'ru': 'Поездки не найдены'
      });
  String get tripListNoResultsMessage => _get({
        'az':
            'Bu marşrut üçün uyğun reis yoxdur. Filtri dəyişin və ya başqa tarix seçin.',
        'en':
            'No matching trips for this route. Change filters or try another date.',
        'ru':
            'Нет подходящих рейсов для этого маршрута. Измените фильтры или выберите другую дату.'
      });
  String get tripListModifySearch => _get({
        'az': 'Axtarışı dəyişdir',
        'en': 'Modify search',
        'ru': 'Изменить поиск'
      });
  String get tripListSortTime =>
      _get({'az': 'Vaxta görə', 'en': 'By time', 'ru': 'По времени'});
  String get tripListSortPrice =>
      _get({'az': 'Qiymətə görə', 'en': 'By price', 'ru': 'По цене'});
  String get tripListVerifiedOnly => _get({
        'az': 'Yalnız təsdiqlənmiş',
        'en': 'Verified only',
        'ru': 'Только проверенные'
      });

  // Bookings Screen
  String get bookingsTitle => _get({
        'az': 'Rezervasiyalarım',
        'en': 'My Reservations',
        'ru': 'Мои резервации'
      });
  String get bookingsLoading =>
      _get({'az': 'Yüklənir...', 'en': 'Loading...', 'ru': 'Загрузка...'});
  String get bookingsLoadFailed => _get({
        'az': 'Yüklənmədi',
        'en': 'Failed to load',
        'ru': 'Не удалось загрузить'
      });
  String get bookingsEmpty => _get({
        'az': 'Hələ rezervasiya yoxdur',
        'en': 'No reservations yet',
        'ru': 'Пока нет резерваций'
      });
  String get bookingsEmptyMessage => _get({
        'az': 'Səyahət axtarın və ilk rezervasiyanızı edin.',
        'en': 'Search for trips and make your first reservation.',
        'ru': 'Ищите поездки и сделайте свою первую резервацию.'
      });
  String get bookingsSearchTrips =>
      _get({'az': 'Gediş axtar', 'en': 'Search trips', 'ru': 'Искать поездки'});

  // Settings Screen
  String get settingsGeneral =>
      _get({'az': 'Ümumi', 'en': 'General', 'ru': 'Общие'});
  String get settingsLanguageTitle =>
      _get({'az': 'Dil', 'en': 'Language', 'ru': 'Язык'});
  String get settingsLanguageAz =>
      _get({'az': 'Azərbaycan', 'en': 'Azerbaijani', 'ru': 'Азербайджанский'});
  String get settingsLanguageEn =>
      _get({'az': 'İngilis', 'en': 'English', 'ru': 'Английский'});
  String get settingsLanguageRu =>
      _get({'az': 'Rus', 'en': 'Russian', 'ru': 'Русский'});
  String get settingsDarkMode =>
      _get({'az': 'Qaranlıq rejim', 'en': 'Dark mode', 'ru': 'Тёмный режим'});
  String get settingsThemeSystem =>
      _get({'az': 'Sistem', 'en': 'System', 'ru': 'Система'});
  String get settingsThemeLight =>
      _get({'az': 'İşıqlı', 'en': 'Light', 'ru': 'Светлая'});
  String get settingsThemeDark =>
      _get({'az': 'Qaranlıq', 'en': 'Dark', 'ru': 'Тёмная'});
  String get settingsNotifications =>
      _get({'az': 'Bildirişlər', 'en': 'Notifications', 'ru': 'Уведомления'});
  String get settingsPushNotifications => _get({
        'az': 'Push bildirişləri',
        'en': 'Push notifications',
        'ru': 'Push-уведомления'
      });
  String get settingsEmailNotifications => _get({
        'az': 'E-poçt bildirişləri',
        'en': 'Email notifications',
        'ru': 'Email-уведомления'
      });
  String get settingsAccount =>
      _get({'az': 'Hesab', 'en': 'Account', 'ru': 'Учётная запись'});
  String get settingsSecurity =>
      _get({'az': 'Təhlükəsizlik', 'en': 'Security', 'ru': 'Безопасность'});
  String get settingsPrivacy =>
      _get({'az': 'Məxfilik', 'en': 'Privacy', 'ru': 'Конфиденциальность'});
  String get settingsComingSoon =>
      _get({'az': 'Tezliklə', 'en': 'Coming soon', 'ru': 'Скоро'});

  String get notificationsTitle =>
      _get({'az': 'Bildirişlər', 'en': 'Notifications', 'ru': 'Уведомления'});
  String get notificationsMarkAllRead => _get(
      {'az': 'Hamısını oxu', 'en': 'Mark all read', 'ru': 'Прочитать все'});
  String get notificationsEmpty => _get({
        'az': 'Bildiriş yoxdur',
        'en': 'No notifications',
        'ru': 'Нет уведомлений'
      });
  String get notificationsEmptyMessage => _get({
        'az': 'Yeni bildirişlər burada görünəcək.',
        'en': 'New notifications will appear here.',
        'ru': 'Новые уведомления появятся здесь.'
      });
  String get notificationsCheckAgain => _get(
      {'az': 'Yenidən yoxla', 'en': 'Check again', 'ru': 'Проверить снова'});

  // Booking Detail Screen
  String get bookingDetailTitle => _get({
        'az': 'Rezervasiya detalları',
        'en': 'Booking details',
        'ru': 'Детали резервации'
      });
  String get bookingDetailNotFound => _get({
        'az': 'Rezervasiya tapılmadı',
        'en': 'Booking not found',
        'ru': 'Резервация не найдена'
      });
  String get bookingDetailGoBack =>
      _get({'az': 'Geri qayıt', 'en': 'Go back', 'ru': 'Вернуться'});
  String get bookingDetailCancelTitle => _get({
        'az': 'Rezervasiyanı ləğv et',
        'en': 'Cancel booking',
        'ru': 'Отменить резервацию'
      });
  String get bookingDetailCancelMessage => _get({
        'az': 'Bu rezervasiyanı ləğv etmək istəyirsiniz?',
        'en': 'Do you want to cancel this booking?',
        'ru': 'Вы хотите отменить эту резервацию?'
      });
  String get bookingDetailCancelBtn =>
      _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отменить'});
  String get bookingDetailDismiss =>
      _get({'az': 'İmtina', 'en': 'Dismiss', 'ru': 'Отклонить'});
  String get bookingDetailDate =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get bookingDetailTime =>
      _get({'az': 'Vaxt', 'en': 'Time', 'ru': 'Время'});
  String get bookingDetailDriver =>
      _get({'az': 'Sürücü', 'en': 'Driver', 'ru': 'Водитель'});
  String get bookingDetailSeats =>
      _get({'az': 'Yerlər', 'en': 'Seats', 'ru': 'Места'});
  String get bookingDetailTotal =>
      _get({'az': 'Cəmi', 'en': 'Total', 'ru': 'Итого'});
  String get bookingDetailMessageDriver => _get({
        'az': 'Sürücüyə yaz',
        'en': 'Message driver',
        'ru': 'Написать водителю'
      });
  String get bookingDetailLeaveReview =>
      _get({'az': 'Rəy yaz', 'en': 'Leave review', 'ru': 'Оставить отзыв'});

  // Trip Detail Screen
  String get tripDetailTitle => _get({
        'az': 'Səyahət detalları',
        'en': 'Trip details',
        'ru': 'Детали поездки'
      });
  String get tripDetailNotFound => _get({
        'az': 'Səyahət tapılmadı',
        'en': 'Trip not found',
        'ru': 'Поездка не найдена'
      });
  String get tripDetailNotFoundMessage => _get({
        'az': 'Bu səyahət artıq mövcud deyil.',
        'en': 'This trip is no longer available.',
        'ru': 'Эта поездка больше недоступна.'
      });
  String get tripDetailDuration =>
      _get({'az': '~4 saat', 'en': '~4 hours', 'ru': '~4 часа'});
  String get tripDetailDriverSection =>
      _get({'az': 'Sürücü', 'en': 'Driver', 'ru': 'Водитель'});
  String get tripDetailTripsCount =>
      _get({'az': 'səyahət', 'en': 'trips', 'ru': 'поездок'});
  String get tripDetailInfoSection => _get({
        'az': 'Səyahət məlumatları',
        'en': 'Trip information',
        'ru': 'Информация о поездке'
      });
  String get tripDetailAvailableSeats => _get(
      {'az': 'Boş yerlər', 'en': 'Available seats', 'ru': 'Свободные места'});
  String get tripDetailSeatsUnit =>
      _get({'az': 'yer', 'en': 'seats', 'ru': 'мест'});
  String get tripDetailCar =>
      _get({'az': 'Avtomobil', 'en': 'Car', 'ru': 'Автомобиль'});
  String get tripDetailLuggage =>
      _get({'az': 'Baqaj', 'en': 'Luggage', 'ru': 'Багаж'});
  String get tripDetailLuggageSize => _get({
        'az': 'Orta ölçülü çamadan',
        'en': 'Medium-sized suitcase',
        'ru': 'Чемодан среднего размера'
      });
  String get tripDetailPreferences =>
      _get({'az': 'Üstünlüklər', 'en': 'Preferences', 'ru': 'Предпочтения'});
  String get tripDetailNoSmoking =>
      _get({'az': 'Siqaret yox', 'en': 'No smoking', 'ru': 'Без курения'});
  String get tripDetailMusic => _get(
      {'az': 'Musiqi var', 'en': 'Music available', 'ru': 'Музыка доступна'});
  String get tripDetailLuggageAllowed => _get(
      {'az': 'Baqaj olar', 'en': 'Luggage allowed', 'ru': 'Багаж разрешен'});
  String get tripDetailBookBtn =>
      _get({'az': 'Rezerv et', 'en': 'Book', 'ru': 'Забронировать'});
  String get tripDetailNoSeats =>
      _get({'az': 'Yer yoxdur', 'en': 'No seats', 'ru': 'Нет мест'});
  String get tripDetailPriceLabel =>
      _get({'az': 'Qiymət', 'en': 'Price', 'ru': 'Цена'});

  // Wallet Screen
  String get walletTitle =>
      _get({'az': 'Pul kisəsi', 'en': 'Wallet', 'ru': 'Кошелёк'});
  String get walletMockBanner => _get({
        'az': 'Demo rejimi — ödənişlər hələ qoşulmayıb.',
        'en': 'Demo mode — payments not yet connected.',
        'ru': 'Демо-режим — платежи ещё не подключены.'
      });
  String get walletBalance =>
      _get({'az': 'Balans', 'en': 'Balance', 'ru': 'Баланс'});
  String get walletPaymentMethod => _get(
      {'az': 'Ödəniş üsulu', 'en': 'Payment method', 'ru': 'Способ оплаты'});
  String get walletNoCard => _get({
        'az': 'Kart əlavə edilməyib',
        'en': 'No card added',
        'ru': 'Карта не добавлена'
      });
  String get walletAddCard =>
      _get({'az': 'Əlavə et', 'en': 'Add', 'ru': 'Добавить'});
  String get walletTransactions =>
      _get({'az': 'Əməliyyatlar', 'en': 'Transactions', 'ru': 'Операции'});
  String get walletTopUp =>
      _get({'az': 'Balans artımı', 'en': 'Top up', 'ru': 'Пополнение баланса'});
  String get walletComingSoon =>
      _get({'az': 'Tezliklə', 'en': 'Coming soon', 'ru': 'Скоро'});
  String get walletTopUpBtn => _get({
        'az': 'Balansı artır',
        'en': 'Top up balance',
        'ru': 'Пополнить баланс'
      });

  String get walletEmpty => _get({
        'az': 'Əməliyyat yoxdur',
        'en': 'No transactions',
        'ru': 'Нет операций'
      });
  String get walletEmptyMessage => _get({
        'az': 'Pul kisəsində hələ heç bir hərəkət yoxdur.',
        'en': 'Your wallet has no activity yet.',
        'ru': 'В кошельке пока нет операций.'
      });
  String get walletRefresh =>
      _get({'az': 'Yenilə', 'en': 'Refresh', 'ru': 'Обновить'});
  String get walletPassengerBalance => _get({
        'az': 'Sərnişin balansı',
        'en': 'Passenger balance',
        'ru': 'Баланс пассажира'
      });
  String get walletPassengerBalanceDesc => _get({
        'az': 'Səyahətlər üçün ödəniş',
        'en': 'Used to pay for rides',
        'ru': 'Для оплаты поездок'
      });
  String get walletDriverBalance => _get({
        'az': 'Sürücü balansı',
        'en': 'Driver balance',
        'ru': 'Баланс водителя'
      });
  String get walletDriverBalanceDesc => _get({
        'az': 'Yalnız çıxarış',
        'en': 'Withdrawals only',
        'ru': 'Только для вывода'
      });
  String get walletWithdraw =>
      _get({'az': 'Çıxarış', 'en': 'Withdraw', 'ru': 'Вывести'});

  // Driver Onboarding & Verification Extras
  String get commonContinue =>
      _get({'az': 'Davam et', 'en': 'Continue', 'ru': 'Продолжить'});
  String get commonErrorPrefix => _get({
        'az': 'Xəta baş verdi',
        'en': 'An error occurred',
        'ru': 'Произошла ошибка'
      });
  String get driverVerificationSentSuffix => _get({
        'az': 'təsdiq üçün göndərildi',
        'en': 'sent for verification',
        'ru': 'отправлен на проверку'
      });
  String get driverVerificationMockSuccess => _get({
        'az': 'Sürücü statusu təsdiqləndi (MOCK)',
        'en': 'Driver status verified (MOCK)',
        'ru': 'Статус водителя подтвержден (MOCK)'
      });
  String get driverVerificationTitle =>
      _get({'az': 'Təsdiqləmə', 'en': 'Verification', 'ru': 'Верификация'});
  String get driverVerificationMockBtn => _get({
        'az': 'Mock Təsdiqlə (Geliştirici)',
        'en': 'Mock Verify (Dev)',
        'ru': 'Mock Подтвердить (Дев)'
      });
  String get driverOnboardingTitle => _get(
      {'az': 'Sürücü Rejimi', 'en': 'Driver Mode', 'ru': 'Режим водителя'});
  String get driverOnboardingBenefits =>
      _get({'az': 'Üstünlüklər', 'en': 'Benefits', 'ru': 'Преимущества'});
  String get driverOnboardingRequirements =>
      _get({'az': 'Tələblər', 'en': 'Requirements', 'ru': 'Требования'});
  String get mockApprove => _get({
        'az': 'Mock Təsdiqlə (Geliştirici)',
        'en': 'Mock Approve (Developer)',
        'ru': 'Мок-подтверждение'
      });
  String get uploadDocument => _get({
        'az': 'Sürücülük vəsiqəsi və ya Şəxsiyyət vəsiqəsi yüklə',
        'en': 'Upload Driver License or ID Card',
        'ru': 'Загрузите документы'
      });
  String get driverVerificationInfo => _get({
        'az':
            'Təsdiq prosesi bir neçə dəqiqə çəkə bilər. Status yeniləndikdə Sürücü Paneli aktivləşəcək.',
        'en':
            'Verification can take a few minutes. Driver Panel will be activated once status updates.',
        'ru': 'Процесс подтверждения может занять несколько минут.'
      });
  String get driverOnboardingCheckStatus => _get({
        'az': 'Təsdiq statusuna bax',
        'en': 'Check verification status',
        'ru': 'Проверить статус'
      });
  String get driverVerificationUpload => _get({
        'az': 'Sənəd yüklə',
        'en': 'Upload document',
        'ru': 'Загрузить документ'
      });

  // Driver Panel Screen
  String get driverPanelTitle => _get(
      {'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});
  String get driverWalletTitle =>
      _get({'az': 'Balans', 'en': 'Balance', 'ru': 'Баланс'});
  String get driverPanelAccessDenied => _get({
        'az': 'Bu səhifəyə giriş qadağandır.',
        'en': 'Access to this page is forbidden.',
        'ru': 'Доступ к этой странице запрещён.'
      });
  String get driverPanelGoBack =>
      _get({'az': 'Geri qayıt', 'en': 'Go back', 'ru': 'Вернуться'});
  String get driverPanelHello =>
      _get({'az': 'Salam', 'en': 'Hello', 'ru': 'Привет'});
  String get driverPanelVerified => _get({
        'az': 'Təsdiqlənmiş sürücü',
        'en': 'Verified driver',
        'ru': 'Проверенный водитель'
      });
  String get driverPanelQuickActions => _get({
        'az': 'Tez əməliyyatlar',
        'en': 'Quick actions',
        'ru': 'Быстрые действия'
      });
  String get driverPanelCreateRide => _get({
        'az': 'Yeni gediş',
        'en': 'Create new ride',
        'ru': 'Создать новую поездку'
      });
  String get driverPanelMyRides =>
      _get({'az': 'Gedişlərim', 'en': 'My rides', 'ru': 'Мои поездки'});
  String get driverPanelRequests =>
      _get({'az': 'Sorğular', 'en': 'Requests', 'ru': 'Запросы'});
  String get driverPanelActiveRide => _get(
      {'az': 'Aktiv gediş', 'en': 'Active ride', 'ru': 'Активная поездка'});
  String get driverPanelEarnings =>
      _get({'az': 'Gəlir', 'en': 'Earnings', 'ru': 'Доход'});
  String get driverPanelThisMonth =>
      _get({'az': 'Bu ay', 'en': 'This month', 'ru': 'В этом месяце'});
  String get driverPanelVehicles =>
      _get({'az': 'Avtomobillər', 'en': 'Vehicles', 'ru': 'Автомобили'});
  String get driverPanelManageVehicles => _get({
        'az': 'Avtomobilləri idarə et',
        'en': 'Manage vehicles',
        'ru': 'Управлять автомобилями'
      });

  // Profile Screen
  String get profileTitle =>
      _get({'az': 'Profil', 'en': 'Profile', 'ru': 'Профиль'});
  String get profileWallet =>
      _get({'az': 'Pul kisəsi', 'en': 'Wallet', 'ru': 'Кошелёк'});
  String get profileReservations => _get({
        'az': 'Rezervasiyalarım',
        'en': 'My Reservations',
        'ru': 'Мои резервации'
      });
  String get profileReviews =>
      _get({'az': 'Rəylər', 'en': 'Reviews', 'ru': 'Отзывы'});
  String get profileNotifications =>
      _get({'az': 'Bildirişlər', 'en': 'Notifications', 'ru': 'Уведомления'});
  String get profileDriverPanel => _get(
      {'az': 'Sürücü Paneli', 'en': 'Driver Panel', 'ru': 'Панель водителя'});
  String get profileDriverPending => _get({
        'az': 'Sürücü statusu: Yoxlanılır',
        'en': 'Driver status: Under review',
        'ru': 'Статус водителя: На проверке'
      });
  String get profileBecomeDriver => _get({
        'az': 'Sürücü olmaq istəyirsiniz?',
        'en': 'Want to become a driver?',
        'ru': 'Хотите стать водителем?'
      });
  String get profileSettingsMenu =>
      _get({'az': 'Parametrlər', 'en': 'Settings', 'ru': 'Настройки'});
  String get profileHelp => _get({'az': 'Kömək', 'en': 'Help', 'ru': 'Помощь'});
  String get profileLogoutConfirm => _get({
        'az': 'Çıxış etmək istədiyinizə əminsiniz?',
        'en': 'Are you sure you want to log out?',
        'ru': 'Вы уверены, что хотите выйти?'
      });
  String get profileLogoutBtn =>
      _get({'az': 'Çıxış et', 'en': 'Log out', 'ru': 'Выйти'});
  String get profileCancel =>
      _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отмена'});
  String get profileEdit => _get({
        'az': 'Profili yenilə',
        'en': 'Edit Profile',
        'ru': 'Редактировать профиль'
      });
  String get profileSave =>
      _get({'az': 'Yadda saxla', 'en': 'Save', 'ru': 'Сохранить'});
  String get modePassenger =>
      _get({'az': 'Sərnişin', 'en': 'Passenger', 'ru': 'Пассажир'});
  String get modeDriver =>
      _get({'az': 'Sürücü', 'en': 'Driver', 'ru': 'Водитель'});

  // Trust & Safety
  String get trustVerifiedDriver => _get({
        'az': 'Təsdiqlənmiş sürücü',
        'en': 'Verified driver',
        'ru': 'Проверенный водитель'
      });
  String get trustDocumentsChecked => _get({
        'az': 'Sənədlər yoxlanılıb',
        'en': 'Documents verified',
        'ru': 'Документы проверены'
      });
  String get trustSafetyNote => _get({
        'az': 'Şəxsiyyət və sürücülük vəsiqəsi təsdiqlənib',
        'en': 'Identity and license verified',
        'ru': 'Удостоверение личности и права проверены'
      });
  String get trustTripsCount =>
      _get({'az': 'səyahət', 'en': 'trips', 'ru': 'поездок'});
  String get trustRating =>
      _get({'az': 'Reytinq', 'en': 'Rating', 'ru': 'Рейтинг'});

  // Active Ride Safety
  String get safetyTitle =>
      _get({'az': 'Təhlükəsizlik', 'en': 'Safety', 'ru': 'Безопасность'});
  String get safetyShareTrip => _get(
      {'az': 'Səfəri paylaş', 'en': 'Share trip', 'ru': 'Поделиться поездкой'});
  String get safetyShareCopied => _get({
        'az': 'Məlumat kopyalandı',
        'en': 'Trip details copied',
        'ru': 'Информация скопирована'
      });
  String get safetySOS => _get({
        'az': 'Təcili yardım (SOS)',
        'en': 'Emergency (SOS)',
        'ru': 'Экстренная помощь (SOS)'
      });
  String get safetySOSConfirmTitle => _get({
        'az': 'Təcili yardım çağırın?',
        'en': 'Call emergency services?',
        'ru': 'Вызвать экстренную помощь?'
      });
  String get safetySOSConfirmMessage => _get({
        'az':
            'Təcili yardım nömrəsi: 112\n\nSəfər məlumatı buferə kopyalanacaq.',
        'en':
            'Emergency number: 112\n\nTrip details will be copied to clipboard.',
        'ru': 'Экстренный номер: 112\n\nИнформация о поездке будет скопирована.'
      });
  String get safetySOSCall =>
      _get({'az': '112-yə zəng et', 'en': 'Call 112', 'ru': 'Позвонить 112'});
  String get safetySOSCopy => _get({
        'az': 'Məlumatı kopyala',
        'en': 'Copy details',
        'ru': 'Скопировать данные'
      });
  String get safetyCancel =>
      _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отмена'});

  // Create Ride Screen
  String get createRideTitle => _get(
      {'az': 'Səyahət yarat', 'en': 'Create trip', 'ru': 'Создать поездку'});
  String get createRideFrom =>
      _get({'az': 'Haradan', 'en': 'From', 'ru': 'Откуда'});
  String get createRideTo => _get({'az': 'Hara', 'en': 'To', 'ru': 'Куда'});
  String get createRideDate =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Дата'});
  String get createRideTime =>
      _get({'az': 'Vaxt', 'en': 'Time', 'ru': 'Время'});
  String get createRideSeats => _get(
      {'az': 'Boş yerlər', 'en': 'Available seats', 'ru': 'Свободные места'});
  String get createRideSeatsLabel => _get(
      {'az': 'Yer sayı', 'en': 'Number of seats', 'ru': 'Количество мест'});
  String get createRidePrice => _get({
        'az': 'Bir yer üçün qiymət (AZN)',
        'en': 'Price per seat (AZN)',
        'ru': 'Цена за место (AZN)'
      });
  String get createRidePriceHint =>
      _get({'az': 'məs. 15', 'en': 'e.g. 15', 'ru': 'напр. 15'});
  String get createRidePriceRequired => _get(
      {'az': 'Qiyməti daxil edin', 'en': 'Enter price', 'ru': 'Введите цену'});
  String get createRidePriceInvalid => _get({
        'az': 'Düzgün qiymət daxil edin',
        'en': 'Enter valid price',
        'ru': 'Введите корректную цену'
      });
  String get createRideAiTitle => _get({
        'az': 'AI qiymət təklifi',
        'en': 'AI price suggestion',
        'ru': 'Предложение цены от ИИ'
      });
  String get createRideAiGetSuggestion => _get({
        'az': 'Təklif al',
        'en': 'Get suggestion',
        'ru': 'Получить предложение'
      });
  String get createRideAiRetry =>
      _get({'az': 'Yenidən cəhd et', 'en': 'Retry', 'ru': 'Попробовать снова'});
  String get createRideAiSuggestionLabel => _get({
        'az': 'Təklif olunan qiymət:',
        'en': 'Suggested price:',
        'ru': 'Предлагаемая цена:'
      });
  String get createRideAiUsePrice => _get({
        'az': 'Bu qiyməti istifadə et',
        'en': 'Use this price',
        'ru': 'Использовать эту цену'
      });
  String get createRideAiError => _get({
        'az': 'Qiymət təklifi alınmadı',
        'en': 'Failed to get price suggestion',
        'ru': 'Не удалось получить предложение цены'
      });
  String get createRidePreferences =>
      _get({'az': 'Üstünlüklər', 'en': 'Preferences', 'ru': 'Предпочтения'});
  String get createRideLuggage => _get(
      {'az': 'Baqaja icazə', 'en': 'Luggage allowed', 'ru': 'Багаж разрешен'});
  String get createRideSmoking =>
      _get({'az': 'Siqaret', 'en': 'Smoking', 'ru': 'Курение'});
  String get createRideMusic =>
      _get({'az': 'Musiqi', 'en': 'Music', 'ru': 'Музыка'});
  String get createRideNotes => _get({
        'az': 'Qeyd (istəyə bağlı)',
        'en': 'Notes (optional)',
        'ru': 'Примечания (необязательно)'
      });
  String get createRideNotesHint => _get({
        'az': 'Sərnişinlər üçün əlavə məlumat',
        'en': 'Additional info for passengers',
        'ru': 'Дополнительная информация для пассажиров'
      });
  String get createRidePublish =>
      _get({'az': 'Dərc et', 'en': 'Publish', 'ru': 'Опубликовать'});
  String get createRideSameLocationError => _get({
        'az': 'Çıxış və təyinat eyni ola bilməz',
        'en': 'Origin and destination cannot be the same',
        'ru': 'Начало и пункт назначения не могут совпадать'
      });
  String get createRidePublishError => _get({
        'az': 'Səyahət dərc edilə bilmədi. Yenidən cəhd edin.',
        'en': 'Failed to publish trip. Please try again.',
        'ru': 'Не удалось опубликовать поездку. Попробуйте снова.'
      });
  String get createRideSuccessTitle => _get({
        'az': 'Səyahət dərc edildi',
        'en': 'Trip published',
        'ru': 'Поездка опубликована'
      });
  String get createRideSuccessMessage => _get({
        'az': 'Sərnişinlər artıq sizi tapa bilər.',
        'en': 'Passengers can now find you.',
        'ru': 'Пассажиры теперь могут найти вас.'
      });

  // Add Vehicle Screen
  String get addVehicleTitle => _get({
        'az': 'Avtomobil əlavə et',
        'en': 'Add vehicle',
        'ru': 'Добавить автомобиль'
      });
  String get addVehicleBrand =>
      _get({'az': 'Marka', 'en': 'Brand', 'ru': 'Марка'});
  String get addVehicleBrandHint =>
      _get({'az': 'Toyota', 'en': 'Toyota', 'ru': 'Toyota'});
  String get addVehicleModel =>
      _get({'az': 'Model', 'en': 'Model', 'ru': 'Модель'});
  String get addVehicleModelHint =>
      _get({'az': 'Camry', 'en': 'Camry', 'ru': 'Camry'});
  String get addVehicleYear => _get({'az': 'İl', 'en': 'Year', 'ru': 'Год'});
  String get addVehicleYearHint =>
      _get({'az': '2020', 'en': '2020', 'ru': '2020'});
  String get addVehicleYearInvalid =>
      _get({'az': 'İl daxil edin', 'en': 'Enter year', 'ru': 'Введите год'});
  String addVehicleYearRange(int startYear, int endYear) => _get({
        'az': '$startYear–$endYear aralığında',
        'en': 'Between $startYear-$endYear',
        'ru': 'В диапазоне $startYear–$endYear'
      });
  String get addVehicleColor =>
      _get({'az': 'Rəng', 'en': 'Color', 'ru': 'Цвет'});
  String get addVehicleColorHint =>
      _get({'az': 'Ağ', 'en': 'White', 'ru': 'Белый'});
  String get addVehiclePlate =>
      _get({'az': 'Dövlət nömrəsi', 'en': 'License plate', 'ru': 'Госномер'});
  String get addVehiclePlateHint =>
      _get({'az': '90-AA-123', 'en': '90-AA-123', 'ru': '90-AA-123'});
  String get addVehicleSeatsCount => _get(
      {'az': 'Oturacaq sayı', 'en': 'Seat count', 'ru': 'Количество мест'});
  String get addVehicleSeatsAvailable => _get({
        'az': 'Boş oturacaqlar',
        'en': 'Available seats',
        'ru': 'Свободные места'
      });
  String get addVehicleSave =>
      _get({'az': 'Yadda saxla', 'en': 'Save', 'ru': 'Сохранить'});
  String get addVehicleRequired => _get({
        'az': 'Bu sahə tələb olunur',
        'en': 'This field is required',
        'ru': 'Это поле обязательно'
      });
  String get addVehicleSaveError => _get({
        'az': 'Yadda saxlanmadı. Yenidən cəhd edin.',
        'en': 'Failed to save. Please try again.',
        'ru': 'Не удалось сохранить. Попробуйте снова.'
      });
  String get addVehicleSuccessSnackbar => _get({
        'az': 'Avtomobil yadda saxlanıldı',
        'en': 'Vehicle saved',
        'ru': 'Автомобиль сохранён'
      });

  // My Rides Screen
  String get myRidesTitle =>
      _get({'az': 'Səfərlərim', 'en': 'My rides', 'ru': 'Мои поездки'});
  String get myRidesNewRide =>
      _get({'az': 'Yeni səfər', 'en': 'New ride', 'ru': 'Новая поездка'});
  String get myRidesLoading =>
      _get({'az': 'Yüklənir...', 'en': 'Loading...', 'ru': 'Загрузка...'});
  String get myRidesLoadFailed => _get({
        'az': 'Yüklənmədi',
        'en': 'Failed to load',
        'ru': 'Не удалось загрузить'
      });
  String get myRidesEmpty => _get({
        'az': 'Hələ səfər yoxdur',
        'en': 'No rides yet',
        'ru': 'Пока нет поездок'
      });
  String get myRidesEmptyMessage => _get({
        'az': 'İlk səfərinizi yaradın və sərnişin tapın.',
        'en': 'Create your first ride and find passengers.',
        'ru': 'Создайте свою первую поездку и найдите пассажиров.'
      });
  String get myRidesCreateAction =>
      _get({'az': 'Səfər yarat', 'en': 'Create ride', 'ru': 'Создать поездку'});
  String get myRidesSeatsLabel =>
      _get({'az': 'yer', 'en': 'seats', 'ru': 'мест'});
  String get myRidesActionRequests =>
      _get({'az': 'Sorğular', 'en': 'Requests', 'ru': 'Запросы'});
  String get myRidesActionDuplicate =>
      _get({'az': 'Dublikat', 'en': 'Duplicate', 'ru': 'Дублировать'});
  String get myRidesActionCancel =>
      _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отменить'});
  String get myRidesDuplicateSuccess => _get({
        'az': 'Səfər dublikat edildi',
        'en': 'Ride duplicated',
        'ru': 'Поездка дублирована'
      });
  String get myRidesCancelTitle => _get(
      {'az': 'Səfəri ləğv et', 'en': 'Cancel ride', 'ru': 'Отменить поездку'});
  String get myRidesCancelMessage => _get({
        'az': 'Bu səfəri ləğv etmək istəyirsiniz?',
        'en': 'Do you want to cancel this ride?',
        'ru': 'Вы хотите отменить эту поездку?'
      });
  String get myRidesCancelConfirm =>
      _get({'az': 'Ləğv et', 'en': 'Cancel', 'ru': 'Отменить'});
  String get myRidesCancelDismiss =>
      _get({'az': 'İmtina', 'en': 'Dismiss', 'ru': 'Отклонить'});

  // Passenger Requests Screen
  String get passengerRequestsTitle => _get({
        'az': 'Sərnişin sorğuları',
        'en': 'Passenger requests',
        'ru': 'Запросы пассажиров'
      });
  String get passengerRequestsEmpty =>
      _get({'az': 'Sorğu yoxdur', 'en': 'No requests', 'ru': 'Нет запросов'});
  String get passengerRequestsEmptyMessage => _get({
        'az': 'Yeni sərnişin sorğuları burada görünəcək.',
        'en': 'New passenger requests will appear here.',
        'ru': 'Новые запросы пассажиров появятся здесь.'
      });
  String get passengerRequestsSeatsLabel =>
      _get({'az': 'yer', 'en': 'seats', 'ru': 'мест'});
  String get passengerRequestsReject =>
      _get({'az': 'Rədd et', 'en': 'Reject', 'ru': 'Отклонить'});
  String get passengerRequestsAccept =>
      _get({'az': 'Qəbul et', 'en': 'Accept', 'ru': 'Принять'});

  // Active Ride Screen
  String get activeRideTitle => _get({
        'az': 'Səfər İdarəetmə',
        'en': 'Ride Management',
        'ru': 'Управление поездкой'
      });
  String get activeRideError => _get({
        'az': 'Xəta baş verdi',
        'en': 'An error occurred',
        'ru': 'Произошла ошибка'
      });
  String get activeRideCompleted => _get({
        'az': 'Səfər tamamlandı!',
        'en': 'Ride completed!',
        'ru': 'Поездка завершена!'
      });
  String get activeRideStartButton =>
      _get({'az': 'Səfərə başla', 'en': 'Start ride', 'ru': 'Начать поездку'});
  String get activeRideCompleteButton => _get(
      {'az': 'Səfəri bitir', 'en': 'Complete ride', 'ru': 'Завершить поездку'});
  String get activeRideGoBack =>
      _get({'az': 'Geri qayıt', 'en': 'Go back', 'ru': 'Вернуться'});

  String get authIntroSubtitle => _get({
        'az': 'Azərbaycan daxilində rahat və ucuz carpooling platforması',
        'en': 'Comfortable and affordable carpooling across Azerbaijan',
        'ru': 'Удобная и доступная платформа карпулинга по Азербайджану'
      });
  String get phoneLoginSubtitle => _get({
        'az': 'Telefon nömrənizi daxil edin, sizə təsdiq kodu göndərək.',
        'en':
            'Enter your phone number and we will send you a verification code.',
        'ru': 'Введите номер телефона, и мы отправим вам код подтверждения.'
      });
  String get phoneLoginPhoneRequired => _get({
        'az': 'Nömrəni daxil edin',
        'en': 'Enter your phone number',
        'ru': 'Введите номер телефона'
      });
  String get phoneLoginPhoneLength => _get({
        'az': 'Nömrə 9 rəqəm olmalıdır',
        'en': 'Phone number must be 9 digits',
        'ru': 'Номер телефона должен состоять из 9 цифр'
      });
  String get phoneLoginPhoneOperator => _get({
        'az': 'Düzgün operator kodu daxil edin',
        'en': 'Enter a valid operator code',
        'ru': 'Введите корректный код оператора'
      });
  String get phoneLoginSendFailed => _get({
        'az': 'Kod göndərilə bilmədi. Yenidən cəhd edin.',
        'en': 'Failed to send the code. Please try again.',
        'ru': 'Не удалось отправить код. Попробуйте снова.'
      });
  String get phoneLoginSendCode =>
      _get({'az': 'Kod göndər', 'en': 'Send code', 'ru': 'Отправить код'});
  String get otpTitle => _get({
        'az': 'Kodu təsdiqləyin',
        'en': 'Verify the code',
        'ru': 'Подтвердите код'
      });
  String get otpSubtitlePrefix => _get({
        'az': 'Kod bu nömrəyə göndərildi: ',
        'en': 'The code was sent to: ',
        'ru': 'Код отправлен на номер: '
      });
  String otpCodeLengthError(int length) => _get({
        'az': 'Kod $length rəqəm olmalıdır',
        'en': 'The code must be $length digits',
        'ru': 'Код должен состоять из $length цифр'
      });
  String get otpVerifyFailed => _get({
        'az': 'Təsdiq alınmadı. Yenidən cəhd edin.',
        'en': 'Verification failed. Please try again.',
        'ru': 'Подтверждение не удалось. Попробуйте снова.'
      });
  String get otpResendFailed => _get({
        'az': 'Kod yenidən göndərilə bilmədi.',
        'en': 'Failed to resend the code.',
        'ru': 'Не удалось отправить код повторно.'
      });
  String get otpConfirmBtn =>
      _get({'az': 'Təsdiqlə', 'en': 'Verify', 'ru': 'Подтвердить'});
  String otpResendCountdown(int seconds) => _get({
        'az': 'Kodu yenidən göndər ($seconds s)',
        'en': 'Resend code ($seconds s)',
        'ru': 'Отправить код повторно ($seconds с)'
      });
  String get otpResendBtn => _get({
        'az': 'Kodu yenidən göndər',
        'en': 'Resend code',
        'ru': 'Отправить код повторно'
      });
  String get otpChangeNumber => _get(
      {'az': 'Nömrəni dəyiş', 'en': 'Change number', 'ru': 'Изменить номер'});
  String get profileSetupTitle => _get({
        'az': 'Profil quraşdırması',
        'en': 'Profile setup',
        'ru': 'Настройка профиля'
      });
  String get profileSetupRequired =>
      _get({'az': 'Tələb olunur', 'en': 'Required', 'ru': 'Обязательно'});
  String get profileSetupSaveError => _get({
        'az': 'Profil yadda saxlanmadı. Yenidən cəhd edin.',
        'en': 'Failed to save the profile. Please try again.',
        'ru': 'Не удалось сохранить профиль. Попробуйте снова.'
      });
  String get profileSetupAvatarHint => _get({
        'az': 'Şəkil əlavə et (istəyə bağlı)',
        'en': 'Add a photo (optional)',
        'ru': 'Добавить фото (необязательно)'
      });
  String get profileSetupFirstName =>
      _get({'az': 'Ad', 'en': 'First name', 'ru': 'Имя'});
  String get profileSetupFirstNameHint =>
      _get({'az': 'Adınız', 'en': 'Your first name', 'ru': 'Ваше имя'});
  String get profileSetupLastName =>
      _get({'az': 'Soyad', 'en': 'Last name', 'ru': 'Фамилия'});
  String get profileSetupLastNameHint =>
      _get({'az': 'Soyadınız', 'en': 'Your last name', 'ru': 'Ваша фамилия'});
  String get profileSetupContinue =>
      _get({'az': 'Davam et', 'en': 'Continue', 'ru': 'Продолжить'});
  String get profileSetupBirthDate => _get(
      {'az': 'Doğum tarixi', 'en': 'Date of birth', 'ru': 'Дата рождения'});
  String get profileSetupBirthDateHint =>
      _get({'az': 'Tarix seçin', 'en': 'Select date', 'ru': 'Выберите дату'});
  String get profileSetupBirthDateRequired => _get({
        'az': 'Doğum tarixi tələb olunur',
        'en': 'Date of birth is required',
        'ru': 'Дата рождения обязательна'
      });
  String get profileSetupTermsAccept => _get({
        'az': 'İstifadə şərtlərini qəbul edirəm',
        'en': 'I accept the Terms & Conditions',
        'ru': 'Принимаю условия использования'
      });
  String get profileSetupPrivacyAccept => _get({
        'az': 'Məxfilik siyasətini qəbul edirəm',
        'en': 'I accept the Privacy Policy',
        'ru': 'Принимаю политику конфиденциальности'
      });
  String get profileSetupTermsRequired => _get({
        'az': 'Davam etmək üçün şərtləri qəbul edin',
        'en': 'Please accept the terms to continue',
        'ru': 'Примите условия, чтобы продолжить'
      });
  String get bookingCreateFailed => _get({
        'az': 'Rezervasiya yaradıla bilmədi. Yenidən cəhd edin.',
        'en': 'Failed to create the booking. Please try again.',
        'ru': 'Не удалось создать резервацию. Попробуйте снова.'
      });
  String get bookingSuccessTitle => _get({
        'az': 'Rezervasiya göndərildi',
        'en': 'Booking sent',
        'ru': 'Резервация отправлена'
      });
  String get bookingSuccessSubtitle => _get({
        'az': 'Sürücünün təsdiqini gözləyin.',
        'en': 'Wait for the driver to confirm.',
        'ru': 'Ожидайте подтверждения от водителя.'
      });
  String get bookingConfirmTitle => _get({
        'az': 'Rezervasiyanı təsdiqlə',
        'en': 'Confirm booking',
        'ru': 'Подтвердить резервацию'
      });
  String get bookingRideNotFound => _get({
        'az': 'Səyahət tapılmadı',
        'en': 'Trip not found',
        'ru': 'Поездка не найдена'
      });
  String get bookingRideUnavailable => _get({
        'az': 'Bu səyahət artıq mövcud deyil.',
        'en': 'This trip is no longer available.',
        'ru': 'Эта поездка больше недоступна.'
      });
  String get bookingCreateLoading => _get({
        'az': 'Rezervasiya yaradılır...',
        'en': 'Creating booking...',
        'ru': 'Создание резервации...'
      });
  String get bookingDriverSection =>
      _get({'az': 'Sürücü', 'en': 'Driver', 'ru': 'Водитель'});
  String get bookingPassengerCount => _get({
        'az': 'Sərnişin sayı',
        'en': 'Passenger count',
        'ru': 'Количество пассажиров'
      });
  String get bookingDetailsSection =>
      _get({'az': 'Detallar', 'en': 'Details', 'ru': 'Детали'});
  String get bookingVehicleLabel =>
      _get({'az': 'Avtomobil', 'en': 'Vehicle', 'ru': 'Автомобиль'});
  String get bookingLuggageLabel =>
      _get({'az': 'Baqaj', 'en': 'Luggage', 'ru': 'Багаж'});
  String get bookingLuggageValue =>
      _get({'az': 'Orta ölçülü', 'en': 'Medium size', 'ru': 'Средний размер'});
  String get bookingPerSeatLabel =>
      _get({'az': 'Bir yer', 'en': 'Per seat', 'ru': 'За место'});
  String get bookingPriceSection =>
      _get({'az': 'Qiymət', 'en': 'Price', 'ru': 'Цена'});
  String bookingPriceBreakdown(String price, int seats, String currency) =>
      _get({
        'az': '$price $currency × $seats yer',
        'en': '$price $currency × $seats seats',
        'ru': '$price $currency × $seats мест'
      });
  String get bookingPlatformFee => _get({
        'az': 'Platforma xidmət haqqı (10%)',
        'en': 'Platform service fee (10%)',
        'ru': 'Сервисный сбор платформы (10%)'
      });
  String get bookingTotalLabel =>
      _get({'az': 'Cəmi', 'en': 'Total', 'ru': 'Итого'});
  String get bookingFreeCancelNote => _get({
        'az': 'Səyahətdən 24 saat əvvələ qədər ödənişsiz ləğv.',
        'en': 'Free cancellation up to 24 hours before the trip.',
        'ru': 'Бесплатная отмена за 24 часа до поездки.'
      });
  String get bookingConfirmBtn =>
      _get({'az': 'Təsdiqlə', 'en': 'Confirm', 'ru': 'Подтвердить'});
  String get supportTitle =>
      _get({'az': 'Kömək', 'en': 'Help', 'ru': 'Помощь'});
  String get supportFaqTitle => _get({
        'az': 'Tez-tez verilən suallar',
        'en': 'Frequently asked questions',
        'ru': 'Часто задаваемые вопросы'
      });
  String get supportFaqBookingQuestion => _get({
        'az': 'Rezervasiyanı necə edə bilərəm?',
        'en': 'How can I make a booking?',
        'ru': 'Как я могу сделать резервацию?'
      });
  String get supportFaqBookingAnswer => _get({
        'az':
            'Səyahət axtarın, uyğun reisi seçin və "Rezerv et" düyməsinə basın. Sürücü təsdiqlədikdən sonra ödəniş edə bilərsiniz.',
        'en':
            'Search for a trip, choose a suitable ride, and tap "Book". Once the driver confirms, you can pay.',
        'ru':
            'Найдите поездку, выберите подходящий рейс и нажмите "Забронировать". После подтверждения водителем вы сможете оплатить.'
      });
  String get supportFaqPaymentQuestion => _get({
        'az': 'Ödənişi necə edirəm?',
        'en': 'How do I pay?',
        'ru': 'Как мне оплатить?'
      });
  String get supportFaqPaymentAnswer => _get({
        'az':
            'Rezervasiya təsdiqləndikdən sonra rezervasiya detallarında ödəniş düyməsi görünəcək. Hazırda ödəniş mock rejimindədir.',
        'en':
            'After the booking is confirmed, a payment button will appear in the booking details. Payments are currently in mock mode.',
        'ru':
            'После подтверждения резервации в деталях появится кнопка оплаты. Сейчас платежи работают в демо-режиме.'
      });
  String get supportFaqCancelQuestion => _get({
        'az': 'Rezervasiyamı ləğv edə bilərəmmi?',
        'en': 'Can I cancel my booking?',
        'ru': 'Могу ли я отменить свою резервацию?'
      });
  String get supportFaqCancelAnswer => _get({
        'az':
            'Bəli. Səyahətdən 24 saat əvvələ qədər ödənişsiz ləğv edə bilərsiniz.',
        'en':
            'Yes. You can cancel free of charge up to 24 hours before the trip.',
        'ru':
            'Да. Вы можете бесплатно отменить резервацию за 24 часа до поездки.'
      });
  String get supportFaqDriverQuestion => _get({
        'az': 'Sürücü necə ola bilərəm?',
        'en': 'How can I become a driver?',
        'ru': 'Как я могу стать водителем?'
      });
  String get supportFaqDriverAnswer => _get({
        'az':
            'Profil → Sürücü rejimi bölməsindən qeydiyyatdan keçin, avtomobil əlavə edin və yoxlamadan keçin.',
        'en':
            'Go to Profile → Driver mode, register, add a vehicle, and complete verification.',
        'ru':
            'Перейдите в Профиль → Режим водителя, зарегистрируйтесь, добавьте автомобиль и пройдите проверку.'
      });
  String get supportContactWrite => _get({
        'az': 'Dəstəyə yaz',
        'en': 'Contact support',
        'ru': 'Написать в поддержку'
      });
  String get supportReportIssue => _get({
        'az': 'Problem bildir',
        'en': 'Report an issue',
        'ru': 'Сообщить о проблеме'
      });
  String get supportReportIssueSubtitle => _get({
        'az': 'Nasazlıq və ya şikayət göndərin',
        'en': 'Send a bug report or complaint',
        'ru': 'Отправить сообщение об ошибке или жалобу'
      });
  String get supportComingSoon => _get({
        'az': 'Tezliklə əlçatan olacaq',
        'en': 'Coming soon',
        'ru': 'Скоро будет доступно'
      });
  String driverVerificationUploadSent(String docType) => _get({
        'az': '$docType təsdiq üçün göndərildi',
        'en': '$docType sent for verification',
        'ru': '$docType отправлен на проверку'
      });
  String driverVerificationError(String error) => _get({
        'az': 'Xəta baş verdi: $error',
        'en': 'An error occurred: $error',
        'ru': 'Произошла ошибка: $error'
      });
  String get driverVerificationMockApproved => _get({
        'az': 'Sürücü statusu təsdiqləndi (MOCK)',
        'en': 'Driver status approved (MOCK)',
        'ru': 'Статус водителя подтвержден (MOCK)'
      });

  String get driverVerificationIdentityTitle => _get({
        'az': 'Şəxsiyyət vəsiqəsi',
        'en': 'Identity card',
        'ru': 'Удостоверение личности'
      });
  String get driverVerificationIdentitySubtitle => _get({
        'az': 'Ön və arxa tərəf',
        'en': 'Front and back side',
        'ru': 'Лицевая и обратная сторона'
      });
  String get driverVerificationSelfieTitle => _get({
        'az': 'Selfi təsdiqi',
        'en': 'Selfie verification',
        'ru': 'Селфи верификация'
      });
  String get driverVerificationSelfieSubtitle => _get({
        'az': 'Üz tanıma üçün',
        'en': 'For face verification',
        'ru': 'Для распознавания лиц'
      });
  String get driverVerificationLicenseTitle => _get({
        'az': 'Sürücülük vəsiqəsi',
        'en': 'Driver license',
        'ru': 'Водительские права'
      });
  String get driverVerificationLicenseSubtitle => _get({
        'az': 'Etibarlı sürücülük vəsiqəsi',
        'en': 'Valid driver license',
        'ru': 'Действительные водительские права'
      });
  String get driverVerificationMockApproveBtn => _get({
        'az': 'Mock Təsdiqlə (Tərtibatçı)',
        'en': 'Mock approve (Developer)',
        'ru': 'Mock Подтвердить (Разработчик)'
      });
  String get driverVerificationApprovedLabel =>
      _get({'az': 'Təsdiqləndi', 'en': 'Approved', 'ru': 'Подтверждено'});
  String get driverVerificationUploadLabel =>
      _get({'az': 'Yüklə', 'en': 'Upload', 'ru': 'Загрузить'});
  String get driverVerificationNote => _get({
        'az':
            'Təsdiq prosesi bir neçə dəqiqə çəkə bilər. Status yeniləndikdə Sürücü Paneli aktivləşəcək.',
        'en':
            'Verification may take a few minutes. The Driver Panel will unlock once the status updates.',
        'ru':
            'Процесс проверки может занять несколько минут. Панель водителя будет активирована при обновлении статуса.'
      });
  String get chatStartConversation => _get({
        'az': 'Söhbətə başlayın',
        'en': 'Start the conversation',
        'ru': 'Начните разговор'
      });
  String get chatPhotoSoon => _get({
        'az': 'Fotoşəkil seçimi tezliklə',
        'en': 'Photo picker coming soon',
        'ru': 'Выбор фото скоро появится'
      });
  String get chatVoiceSoon => _get({
        'az': 'Səs yazısı tezliklə',
        'en': 'Voice messages coming soon',
        'ru': 'Голосовые сообщения скоро появятся'
      });
  String get reviewSuccess => _get({
        'az': 'Rəyiniz uğurla göndərildi. Təşəkkür edirik!',
        'en': 'Your review was sent successfully. Thank you!',
        'ru': 'Ваш отзыв успешно отправлен. Спасибо!'
      });
  String reviewTitle(String name) => _get({
        'az': '$name üçün rəy bildirin',
        'en': 'Leave a review for $name',
        'ru': 'Оставьте отзыв для $name'
      });
  String get reviewRateTrip => _get({
        'az': 'Səyahəti qiymətləndirin:',
        'en': 'Rate the trip:',
        'ru': 'Оцените поездку:'
      });
  String get reviewCommentHint => _get({
        'az': 'Şərhləriniz (istəyə bağlı)...',
        'en': 'Your comments (optional)...',
        'ru': 'Ваши комментарии (необязательно)...'
      });
  String get reviewCancelBtn =>
      _get({'az': 'İmtina', 'en': 'Cancel', 'ru': 'Отмена'});
  String get reviewSendBtn =>
      _get({'az': 'Göndər', 'en': 'Send', 'ru': 'Отправить'});
  String get notificationsWelcomeTitle => _get(
      {'az': 'Xoş gəldiniz!', 'en': 'Welcome!', 'ru': 'Добро пожаловать!'});
  String get notificationsWelcomeBody => _get({
        'az': 'Yolmates-ə qoşulduğunuz üçün təşəkkür edirik.',
        'en': 'Thanks for joining Yolmates.',
        'ru': 'Спасибо, что присоединились к Yolmates.'
      });
  String get notificationsCompleteProfileTitle => _get({
        'az': 'Profilinizi tamamlayın',
        'en': 'Complete your profile',
        'ru': 'Заполните свой профиль'
      });
  String get notificationsCompleteProfileBody => _get({
        'az': 'Daha çox sürücü ilə əlaqə üçün profilinizi doldurun.',
        'en': 'Complete your profile to connect with more drivers.',
        'ru':
            'Заполните свой профиль, чтобы связаться с большим количеством водителей.'
      });
  String get notificationsSafetyTipTitle => _get({
        'az': 'Təhlükəsizlik məsləhəti',
        'en': 'Safety tip',
        'ru': 'Совет по безопасности'
      });
  String get notificationsSafetyTipBody => _get({
        'az': 'Səyahətdən əvvəl sürücünün reytinqini yoxlayın.',
        'en': 'Check the driver rating before the trip.',
        'ru': 'Проверьте рейтинг водителя перед поездкой.'
      });

  // Date Formatting Helpers
  String monthName(int month) {
    final months = {
      'az': [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'İyun',
        'İyul',
        'Avqust',
        'Sentyabr',
        'Oktyabr',
        'Noyabr',
        'Dekabr'
      ],
      'en': [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      'ru': [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь'
      ],
    };
    return months[language.name]![month - 1];
  }

  String weekdayName(int weekday) {
    final weekdays = {
      'az': [
        'Bazar ertəsi',
        'Çərşənbə axşamı',
        'Çərşənbə',
        'Cümə axşamı',
        'Cümə',
        'Şənbə',
        'Bazar'
      ],
      'en': [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      'ru': [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
        'Воскресенье'
      ],
    };
    return weekdays[language.name]![weekday - 1];
  }

  String shortWeekdayName(int weekday) {
    final weekdays = {
      'az': ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'],
      'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      'ru': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    };
    return weekdays[language.name]![weekday - 1];
  }

  // Plural Form Helpers
  String seatsPlural(int count) {
    if (language == AppLanguage.az) {
      return count == 1 ? 'yer' : 'yerlər';
    } else if (language == AppLanguage.en) {
      return count == 1 ? 'seat' : 'seats';
    } else {
      // Russian: 1 место, 2-4 места, 5+ мест
      if (count % 10 == 1 && count % 100 != 11) {
        return 'место';
      }
      if ([2, 3, 4].contains(count % 10) &&
          ![12, 13, 14].contains(count % 100)) {
        return 'места';
      }
      return 'мест';
    }
  }

  String tripsPlural(int count) {
    if (language == AppLanguage.az) {
      return 'səyahət';
    } else if (language == AppLanguage.en) {
      return count == 1 ? 'trip' : 'trips';
    } else {
      // Russian: 1 поездка, 2-4 поездки, 5+ поездок
      if (count % 10 == 1 && count % 100 != 11) {
        return 'поездка';
      }
      if ([2, 3, 4].contains(count % 10) &&
          ![12, 13, 14].contains(count % 100)) {
        return 'поездки';
      }
      return 'поездок';
    }
  }

  String _get(Map<String, String> translations) {
    return translations[language.name] ?? translations['az'] ?? '';
  }

  // Driver Verification
  String get verificationTitle =>
      _get({'az': 'Təsdiqləmə', 'en': 'Verification', 'ru': 'Верификация'});
  String get verificationSent => _get({
        'az': 'təsdiq üçün göndərildi',
        'en': 'sent for verification',
        'ru': 'отправлено на проверку'
      });
  String get verificationMockApproved => _get({
        'az': 'Sürücü statusu təsdiqləndi (MOCK)',
        'en': 'Driver status approved (MOCK)',
        'ru': 'Статус водителя подтвержден (MOCK)'
      });
  String get verificationMockBtn => _get({
        'az': 'Mock Təsdiqlə (Geliştirici)',
        'en': 'Mock Approve (Dev)',
        'ru': 'Mock Подтвердить (Дев)'
      });
  String get verificationApproveBtn =>
      _get({'az': 'Təsdiq', 'en': 'Approved', 'ru': 'Подтверждено'});
  String get verificationUploadBtn =>
      _get({'az': 'Yüklə', 'en': 'Upload', 'ru': 'Загрузить'});

  String get verificationIdCard => _get({
        'az': 'Şəxsiyyət vəsiqəsi',
        'en': 'ID Card',
        'ru': 'Удостоверение личности'
      });
  String get verificationIdCardDesc => _get({
        'az': 'Ön və arxa tərəf',
        'en': 'Front and back side',
        'ru': 'Лицевая и обратная сторона'
      });
  String get verificationSelfie => _get({
        'az': 'Selfi təsdiqi',
        'en': 'Selfie verification',
        'ru': 'Селфи верификация'
      });
  String get verificationSelfieDesc => _get({
        'az': 'Üz tanıma üçün',
        'en': 'For facial recognition',
        'ru': 'Для распознавания лиц'
      });
  String get verificationLicense => _get({
        'az': 'Sürücülük vəsiqəsi',
        'en': 'Driver license',
        'ru': 'Водительские права'
      });
  String get verificationLicenseDesc => _get({
        'az': 'Etibarlı sürücülük vəsiqəsi',
        'en': 'Valid driver license',
        'ru': 'Действительные водительские права'
      });
  String get verificationNote => _get({
        'az':
            'Təsdiq prosesi bir neçə dəqiqə çəkə bilər. Status yeniləndikdə Sürücü Paneli aktivləşəcək.',
        'en':
            'The verification process may take a few minutes. Driver Panel will be activated when the status is updated.',
        'ru':
            'Процесс верификации может занять несколько минут. Панель водителя будет активирована при обновлении статуса.'
      });

  // Common Extras
  String get commonDismiss =>
      _get({'az': 'İmtina', 'en': 'Dismiss', 'ru': 'Отклонить'});
  String get commonReviews =>
      _get({'az': 'Rəylər', 'en': 'Reviews', 'ru': 'Отзывы'});
  String get commonAvailableSeats =>
      _get({'az': 'boş yer', 'en': 'available seats', 'ru': 'свободных мест'});

  String get settingsThemePreparing => _get({
        'az': 'Qaranlıq mövzu hazırlanır',
        'en': 'Dark theme is being prepared',
        'ru': 'Тёмная тема готовится'
      });
  String get settingsThemeNote => _get({
        'az': 'Hazırda tətbiq sabit açıq mövzuda işləyir.',
        'en': 'The app currently uses the stable light theme.',
        'ru': 'Сейчас приложение использует стабильную светлую тему.'
      });
}
