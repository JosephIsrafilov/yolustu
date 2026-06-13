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

  String get tr {
    // Basic translation getter example, will be expanded with actual maps
    return 'Translated';
  }

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

  String _get(Map<String, String> translations) {
    return translations[language.name] ?? translations['az'] ?? '';
  }
}
