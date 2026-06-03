import 'package:flutter/material.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = <Locale>[
    Locale('az'),
    Locale('ru'),
    Locale('en'),
  ];

  static AppLocalizations of(BuildContext context) {
    final localizations = Localizations.of<AppLocalizations>(
      context,
      AppLocalizations,
    );
    assert(localizations != null, 'AppLocalizations not found in widget tree.');
    return localizations!;
  }

  static const Map<String, Map<String, String>> _values =
      <String, Map<String, String>>{
        'az': <String, String>{
          'appName': 'Yolmates',
          'welcomeTitle': 'Azərbaycan üzrə rahat yol yoldaşı tapın',
          'welcomeBody':
              'Flutter foundation artıq onboarding, auth, rides və driver flow üçün hazırdır.',
          'login': 'Daxil ol',
          'phoneNumber': 'Telefon nömrəsi',
          'continue': 'Davam et',
          'searchRides': 'Gediş axtar',
          'createRide': 'Gediş yarat',
          'bookings': 'Rezervasiyalar',
          'profile': 'Profil',
          'settings': 'Ayarlar',
          'logout': 'Çıxış et',
          'commonError': 'Nəsə səhv getdi. Yenidən cəhd edin.',
          'otpTitle': 'OTP təsdiqi',
          'popularRoutes': 'Populyar marşrutlar',
          'driverPanel': 'Sürücü paneli',
          'language': 'Dil',
          'theme': 'Tema',
          'home': 'Ana səhifə',
          'results': 'Nəticələr',
          'rideDetails': 'Gediş detalları',
          'emptyState': 'Hələ məlumat yoxdur.',
          'bookNow': 'Rezerv et',
        },
        'ru': <String, String>{
          'appName': 'Yolmates',
          'welcomeTitle': 'Находите попутчиков по Азербайджану',
          'welcomeBody':
              'Flutter foundation уже готова для onboarding, auth, rides и driver flow.',
          'login': 'Войти',
          'phoneNumber': 'Номер телефона',
          'continue': 'Продолжить',
          'searchRides': 'Искать поездки',
          'createRide': 'Создать поездку',
          'bookings': 'Бронирования',
          'profile': 'Профиль',
          'settings': 'Настройки',
          'logout': 'Выйти',
          'commonError': 'Что-то пошло не так. Попробуйте снова.',
          'otpTitle': 'Подтверждение OTP',
          'popularRoutes': 'Популярные маршруты',
          'driverPanel': 'Панель водителя',
          'language': 'Язык',
          'theme': 'Тема',
          'home': 'Главная',
          'results': 'Результаты',
          'rideDetails': 'Детали поездки',
          'emptyState': 'Пока данных нет.',
          'bookNow': 'Забронировать',
        },
        'en': <String, String>{
          'appName': 'Yolmates',
          'welcomeTitle': 'Find trusted rides across Azerbaijan',
          'welcomeBody':
              'This Flutter foundation already covers onboarding, auth, rides, and driver flows.',
          'login': 'Login',
          'phoneNumber': 'Phone number',
          'continue': 'Continue',
          'searchRides': 'Search rides',
          'createRide': 'Create ride',
          'bookings': 'Bookings',
          'profile': 'Profile',
          'settings': 'Settings',
          'logout': 'Logout',
          'commonError': 'Something went wrong. Please try again.',
          'otpTitle': 'OTP verification',
          'popularRoutes': 'Popular routes',
          'driverPanel': 'Driver panel',
          'language': 'Language',
          'theme': 'Theme',
          'home': 'Home',
          'results': 'Results',
          'rideDetails': 'Ride details',
          'emptyState': 'Nothing here yet.',
          'bookNow': 'Book now',
        },
      };

  String _text(String key) =>
      _values[locale.languageCode]?[key] ?? _values['en']![key]!;

  String get appName => _text('appName');
  String get welcomeTitle => _text('welcomeTitle');
  String get welcomeBody => _text('welcomeBody');
  String get login => _text('login');
  String get phoneNumber => _text('phoneNumber');
  String get continueLabel => _text('continue');
  String get searchRides => _text('searchRides');
  String get createRide => _text('createRide');
  String get bookings => _text('bookings');
  String get profile => _text('profile');
  String get settings => _text('settings');
  String get logout => _text('logout');
  String get commonError => _text('commonError');
  String get otpTitle => _text('otpTitle');
  String get popularRoutes => _text('popularRoutes');
  String get driverPanel => _text('driverPanel');
  String get language => _text('language');
  String get theme => _text('theme');
  String get home => _text('home');
  String get results => _text('results');
  String get rideDetails => _text('rideDetails');
  String get emptyState => _text('emptyState');
  String get bookNow => _text('bookNow');
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.supportedLocales.any(
    (Locale item) => item.languageCode == locale.languageCode,
  );

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
