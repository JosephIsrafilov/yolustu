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
  String get commonAll => _get({'az': 'BГјtГјn', 'en': 'All', 'ru': 'Р’СЃРµ'});
  String get commonSearch =>
      _get({'az': 'Axtar', 'en': 'Search', 'ru': 'РќР°Р№С‚Рё'});
  String get commonFrom =>
      _get({'az': 'Haradan', 'en': 'From', 'ru': 'РћС‚РєСѓРґР°'});
  String get commonTo => _get({'az': 'Haraya', 'en': 'To', 'ru': 'РљСѓРґР°'});
  String get commonDate =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Р”Р°С‚Р°'});
  String get commonPassenger =>
      _get({'az': 'SЙ™rniЕџin', 'en': 'Passenger', 'ru': 'РџР°СЃСЃР°Р¶РёСЂ'});
  String get commonClose =>
      _get({'az': 'BaДџla', 'en': 'Close', 'ru': 'Р—Р°РєСЂС‹С‚СЊ'});
  String get commonBack =>
      _get({'az': 'Geri', 'en': 'Back', 'ru': 'РќР°Р·Р°Рґ'});
  String get commonError => _get({
        'az': 'XЙ™ta baЕџ verdi',
        'en': 'An error occurred',
        'ru': 'РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°'
      });

  // Auth & Onboarding
  String get loginTitle =>
      _get({'az': 'Daxil ol', 'en': 'Log in', 'ru': 'Р’РѕР№С‚Рё'});
  String get loginSubtitle => _get({
        'az': 'HesabД±nД±za daxil olun',
        'en': 'Log in to your account',
        'ru': 'Р’РѕР№РґРёС‚Рµ РІ СЃРІРѕР№ Р°РєРєР°СѓРЅС‚'
      });
  String get phoneLabel => _get({
        'az': 'Mobil NГ¶mrЙ™',
        'en': 'Phone Number',
        'ru': 'РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°'
      });
  String get passwordLabel =>
      _get({'az': 'ЕћifrЙ™', 'en': 'Password', 'ru': 'РџР°СЂРѕР»СЊ'});
  String get loginBtn =>
      _get({'az': 'Daxil ol', 'en': 'Log in', 'ru': 'Р’РѕР№С‚Рё'});
  String get noAccount => _get({
        'az': 'HesabД±nД±z yoxdur?',
        'en': 'Don\'t have an account?',
        'ru': 'РќРµС‚ Р°РєРєР°СѓРЅС‚Р°?'
      });
  String get registerLink => _get({
        'az': 'Qeydiyyatdan keГ§in',
        'en': 'Sign up',
        'ru': 'Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ'
      });
  String get registerTitle => _get(
      {'az': 'Qeydiyyat', 'en': 'Sign up', 'ru': 'Р РµРіРёСЃС‚СЂР°С†РёСЏ'});
  String get fullNameLabel => _get({
        'az': 'Ad vЙ™ Soyad',
        'en': 'Full Name',
        'ru': 'РРјСЏ Рё Р¤Р°РјРёР»РёСЏ'
      });
  String get verifyBtn => _get(
      {'az': 'TЙ™sdiqlЙ™', 'en': 'Verify', 'ru': 'РџРѕРґС‚РІРµСЂРґРёС‚СЊ'});

  String get onboardingSkip =>
      _get({'az': 'Keç', 'en': 'Skip', 'ru': 'РџСЂРѕРїСѓСЃС‚РёС‚СЊ'});
  String get onboardingNext =>
      _get({'az': 'Növbəti', 'en': 'Next', 'ru': 'Р”Р°Р»РµРµ'});
  String get onboardingStart =>
      _get({'az': 'Başla', 'en': 'Start', 'ru': 'РќР°С‡Р°С‚СЊ'});
  String get onboardingSaveMoneyTitle => _get({
        'az': 'Səyahət xərclərini azaldın',
        'en': 'Save on every trip',
        'ru': 'Р­РєРѕРЅРѕРјСЊС‚Рµ РЅР° РєР°Р¶РґРѕР№ РїРѕРµР·РґРєРµ'
      });
  String get onboardingSaveMoneyMessage => _get({
        'az':
            'Şəhərlərarası yolu paylaşın, biletdən daha sərfəli qiymətlə gedin.',
        'en': 'Share intercity rides and pay less than regular tickets.',
        'ru':
            'Р”РµР»РёС‚Рµ РјРµР¶РґСѓРіРѕСЂРѕРґРЅРёРµ РїРѕРµР·РґРєРё Рё РїР»Р°С‚РёС‚Рµ РјРµРЅСЊС€Рµ, С‡РµРј Р·Р° РѕР±С‹С‡РЅС‹Рµ Р±РёР»РµС‚С‹.'
      });
  String get onboardingSafeTitle => _get({
        'az': 'Daha təhlükəsiz seçin',
        'en': 'Travel with confidence',
        'ru': 'РџСѓС‚РµС€РµСЃС‚РІСѓР№С‚Рµ СЃРїРѕРєРѕР№РЅРµРµ'
      });
  String get onboardingSafeMessage => _get({
        'az':
            'Təsdiqlənmiş sürücülər, reytinqlər və dəstək ilə daha güvənli yol gedin.',
        'en': 'Verified drivers, ratings, and support help you ride safer.',
        'ru':
            'РџСЂРѕРІРµСЂРµРЅРЅС‹Рµ РІРѕРґРёС‚РµР»Рё, СЂРµР№С‚РёРЅРіРё Рё РїРѕРґРґРµСЂР¶РєР° РґРµР»Р°СЋС‚ РїРѕРµР·РґРєСѓ Р±РµР·РѕРїР°СЃРЅРµРµ.'
      });
  String get onboardingEasyTitle => _get({
        'az': 'Bir neçə toxunuşla hazırdır',
        'en': 'Easy from search to chat',
        'ru': 'Р›РµРіРєРѕ РѕС‚ РїРѕРёСЃРєР° РґРѕ С‡Р°С‚Р°'
      });
  String get onboardingEasyMessage => _get({
        'az':
            'Axtarın, bron edin və sürücü ilə söhbətə bir neçə toxunuşda başlayın.',
        'en': 'Search, book, and chat with the driver in just a few taps.',
        'ru':
            'РС‰РёС‚Рµ, Р±СЂРѕРЅРёСЂСѓР№С‚Рµ Рё РѕР±С‰Р°Р№С‚РµСЃСЊ СЃ РІРѕРґРёС‚РµР»РµРј РІСЃРµРіРѕ РІ РЅРµСЃРєРѕР»СЊРєРѕ РєР°СЃР°РЅРёР№.'
      });

  // Navigation
  String get navHome =>
      _get({'az': 'Ana sЙ™hifЙ™', 'en': 'Home', 'ru': 'Р“Р»Р°РІРЅР°СЏ'});
  String get navSearch =>
      _get({'az': 'Axtar', 'en': 'Search', 'ru': 'РџРѕРёСЃРє'});
  String get navTrips =>
      _get({'az': 'GediЕџlЙ™r', 'en': 'Trips', 'ru': 'РџРѕРµР·РґРєРё'});
  String get navChat =>
      _get({'az': 'SГ¶hbЙ™tlЙ™r', 'en': 'Chats', 'ru': 'Р§Р°С‚С‹'});
  String get navProfile =>
      _get({'az': 'Profil', 'en': 'Profile', 'ru': 'РџСЂРѕС„РёР»СЊ'});
  String get navDriverPanel => _get({
        'az': 'SГјrГјcГј Paneli',
        'en': 'Driver Panel',
        'ru': 'РџР°РЅРµР»СЊ РІРѕРґРёС‚РµР»СЏ'
      });

  // Chat
  String get chatTitle =>
      _get({'az': 'SГ¶hbЙ™t', 'en': 'Chat', 'ru': 'Р§Р°С‚'});
  String get chatPlaceholder => _get({
        'az': 'MesajД±nД±zД± yazД±n...',
        'en': 'Type a message...',
        'ru': 'Р’РІРµРґРёС‚Рµ СЃРѕРѕР±С‰РµРЅРёРµ...'
      });
  String get chatSend =>
      _get({'az': 'GГ¶ndЙ™r', 'en': 'Send', 'ru': 'РћС‚РїСЂР°РІРёС‚СЊ'});
  String get chatSupport =>
      _get({'az': 'DЙ™stЙ™k', 'en': 'Support', 'ru': 'РџРѕРґРґРµСЂР¶РєР°'});
  String get chatCallInApp => _get({
        'az': 'TЙ™tbiqdaxili zЙ™ng',
        'en': 'In-app call',
        'ru': 'Р—РІРѕРЅРѕРє РІ РїСЂРёР»РѕР¶РµРЅРёРё'
      });
  String get chatCallExternal =>
      _get({'az': 'ZЙ™ng et', 'en': 'Call', 'ru': 'РџРѕР·РІРѕРЅРёС‚СЊ'});
  String get chatEmpty => _get({
        'az': 'Mesaj yoxdur',
        'en': 'No messages',
        'ru': 'РќРµС‚ СЃРѕРѕР±С‰РµРЅРёР№'
      });
  String get chatEmptyMessage => _get({
        'az':
            'Rezerv etdikdЙ™n sonra sГјrГјcГј ilЙ™ burada yazД±Еџa bilЙ™cЙ™ksiniz.',
        'en': 'After booking, you can chat with your driver here.',
        'ru':
            'РџРѕСЃР»Рµ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёСЏ РІС‹ СЃРјРѕР¶РµС‚Рµ РѕР±С‰Р°С‚СЊСЃСЏ СЃ РІРѕРґРёС‚РµР»РµРј Р·РґРµСЃСЊ.'
      });
  String get chatSearchTrips => _get({
        'az': 'SЙ™yahЙ™t axtar',
        'en': 'Search trips',
        'ru': 'РСЃРєР°С‚СЊ РїРѕРµР·РґРєРё'
      });

  // Profile & Settings
  String get profileSettings => _get({
        'az': 'TЙ™nzimlЙ™mЙ™lЙ™r',
        'en': 'Settings',
        'ru': 'РќР°СЃС‚СЂРѕР№РєРё'
      });
  String get profileLanguage =>
      _get({'az': 'Dil', 'en': 'Language', 'ru': 'РЇР·С‹Рє'});
  String get profileSupport => _get({
        'az': 'DЙ™stЙ™k Г§atД±na yaz',
        'en': 'Contact Support',
        'ru': 'РќР°РїРёСЃР°С‚СЊ РІ РїРѕРґРґРµСЂР¶РєСѓ'
      });
  String get profileLogout =>
      _get({'az': 'Г‡Д±xД±Еџ', 'en': 'Log out', 'ru': 'Р’С‹Р№С‚Рё'});

  // Create Ride & AI
  String get aiTitle => _get({
        'az': 'TГ¶vsiyЙ™ edilЙ™n qiymЙ™t',
        'en': 'Recommended price',
        'ru': 'Р РµРєРѕРјРµРЅРґСѓРµРјР°СЏ С†РµРЅР°'
      });
  String get aiSuggestBtn => _get({
        'az': 'SД° tЙ™klifi al',
        'en': 'Get AI suggestion',
        'ru': 'РџРѕР»СѓС‡РёС‚СЊ РїСЂРµРґР»РѕР¶РµРЅРёРµ РР'
      });
  String get applyPrice => _get({
        'az': 'Bu qiymЙ™ti istifadЙ™ et',
        'en': 'Use this price',
        'ru': 'РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ СЌС‚Сѓ С†РµРЅСѓ'
      });

  // Home Screen
  String get homeHeroTitle => _get({
        'az': 'AzЙ™rbaycan daxilindЙ™',
        'en': 'Within Azerbaijan',
        'ru': 'Р’ РїСЂРµРґРµР»Р°С… РђР·РµСЂР±Р°Р№РґР¶Р°РЅР°'
      });
  String get homeHeroSubtitle => _get({
        'az': 'yolu paylaЕџД±n',
        'en': 'share your ride',
        'ru': 'РґРµР»РёС‚РµСЃСЊ РїРѕРµР·РґРєРѕР№'
      });
  String get homeHeroDescription => _get({
        'az': 'Rahat, tЙ™hlГјkЙ™siz vЙ™ ucuz sЙ™yahЙ™t',
        'en': 'Comfortable, safe and affordable travel',
        'ru':
            'РљРѕРјС„РѕСЂС‚РЅР°СЏ, Р±РµР·РѕРїР°СЃРЅР°СЏ Рё РґРѕСЃС‚СѓРїРЅР°СЏ РїРѕРµР·РґРєР°'
      });
  String get homeDriverPanelBtn => _get({
        'az': 'SГјrГјcГј Paneli',
        'en': 'Driver Panel',
        'ru': 'РџР°РЅРµР»СЊ РІРѕРґРёС‚РµР»СЏ'
      });
  String get homeDocumentsPendingBtn => _get({
        'az': 'SЙ™nЙ™dlЙ™r yoxlanД±lД±r',
        'en': 'Documents under review',
        'ru': 'Р”РѕРєСѓРјРµРЅС‚С‹ РЅР° РїСЂРѕРІРµСЂРєРµ'
      });
  String get homeBecomeDriverBtn => _get({
        'az': 'SГјrГјcГј ol',
        'en': 'Become a driver',
        'ru': 'РЎС‚Р°С‚СЊ РІРѕРґРёС‚РµР»РµРј'
      });
  String get homePopularRoutes => _get({
        'az': 'Populyar marЕџrutlar',
        'en': 'Popular routes',
        'ru': 'РџРѕРїСѓР»СЏСЂРЅС‹Рµ РјР°СЂС€СЂСѓС‚С‹'
      });
  String get homeDailyTrips => _get({
        'az': 'GГјndЙ™lik 15+ reis',
        'en': 'Daily 15+ trips',
        'ru': 'Р•Р¶РµРґРЅРµРІРЅРѕ 15+ СЂРµР№СЃРѕРІ'
      });

  // Search Screen
  String get searchTitle => _get({
        'az': 'SЙ™yahЙ™t axtar',
        'en': 'Search trip',
        'ru': 'РќР°Р№С‚Рё РїРѕРµР·РґРєСѓ'
      });
  String get searchFromLabel =>
      _get({'az': 'Haradan', 'en': 'From', 'ru': 'РћС‚РєСѓРґР°'});
  String get searchToLabel =>
      _get({'az': 'Hara', 'en': 'To', 'ru': 'РљСѓРґР°'});
  String get searchSwapTooltip => _get({
        'az': 'ЕћЙ™hЙ™rlЙ™ri dЙ™yiЕџ',
        'en': 'Swap cities',
        'ru': 'РџРѕРјРµРЅСЏС‚СЊ РіРѕСЂРѕРґР°'
      });
  String get searchDateLabel =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Р”Р°С‚Р°'});
  String get searchPassengersLabel => _get({
        'az': 'SЙ™rniЕџin sayД±',
        'en': 'Number of passengers',
        'ru': 'РљРѕР»РёС‡РµСЃС‚РІРѕ РїР°СЃСЃР°Р¶РёСЂРѕРІ'
      });
  String get searchSameLocationError => _get({
        'az': 'Г‡Д±xД±Еџ vЙ™ tЙ™yinat eyni ola bilmЙ™z',
        'en': 'Origin and destination cannot be the same',
        'ru':
            'РќР°С‡Р°Р»Рѕ Рё РїСѓРЅРєС‚ РЅР°Р·РЅР°С‡РµРЅРёСЏ РЅРµ РјРѕРіСѓС‚ СЃРѕРІРїР°РґР°С‚СЊ'
      });
  String get searchRecentSearches => _get({
        'az': 'Son axtarД±Еџlar',
        'en': 'Recent searches',
        'ru': 'РќРµРґР°РІРЅРёРµ РїРѕРёСЃРєРё'
      });

  // Trip List Screen
  String get tripListSearchFailed => _get({
        'az': 'AxtarД±Еџ alД±nmadД±',
        'en': 'Search failed',
        'ru': 'РџРѕРёСЃРє РЅРµ СѓРґР°Р»СЃСЏ'
      });
  String get tripListNoResults => _get({
        'az': 'SЙ™yahЙ™t tapД±lmadД±',
        'en': 'No trips found',
        'ru': 'РџРѕРµР·РґРєРё РЅРµ РЅР°Р№РґРµРЅС‹'
      });
  String get tripListNoResultsMessage => _get({
        'az':
            'Bu marЕџrut ГјГ§Гјn uyДџun reis yoxdur. Filtri dЙ™yiЕџin vЙ™ ya baЕџqa tarix seГ§in.',
        'en':
            'No matching trips for this route. Change filters or try another date.',
        'ru':
            'РќРµС‚ РїРѕРґС…РѕРґСЏС‰РёС… СЂРµР№СЃРѕРІ РґР»СЏ СЌС‚РѕРіРѕ РјР°СЂС€СЂСѓС‚Р°. РР·РјРµРЅРёС‚Рµ С„РёР»СЊС‚СЂС‹ РёР»Рё РІС‹Р±РµСЂРёС‚Рµ РґСЂСѓРіСѓСЋ РґР°С‚Сѓ.'
      });
  String get tripListModifySearch => _get({
        'az': 'AxtarД±ЕџД± dЙ™yiЕџdir',
        'en': 'Modify search',
        'ru': 'РР·РјРµРЅРёС‚СЊ РїРѕРёСЃРє'
      });
  String get tripListSortTime => _get(
      {'az': 'Vaxta gГ¶rЙ™', 'en': 'By time', 'ru': 'РџРѕ РІСЂРµРјРµРЅРё'});
  String get tripListSortPrice =>
      _get({'az': 'QiymЙ™tЙ™ gГ¶rЙ™', 'en': 'By price', 'ru': 'РџРѕ С†РµРЅРµ'});
  String get tripListVerifiedOnly => _get({
        'az': 'YalnД±z tЙ™sdiqlЙ™nmiЕџ',
        'en': 'Verified only',
        'ru': 'РўРѕР»СЊРєРѕ РїСЂРѕРІРµСЂРµРЅРЅС‹Рµ'
      });

  // Bookings Screen
  String get bookingsTitle => _get({
        'az': 'RezervasiyalarД±m',
        'en': 'My Reservations',
        'ru': 'РњРѕРё СЂРµР·РµСЂРІР°С†РёРё'
      });
  String get bookingsLoading => _get(
      {'az': 'YГјklЙ™nir...', 'en': 'Loading...', 'ru': 'Р—Р°РіСЂСѓР·РєР°...'});
  String get bookingsLoadFailed => _get({
        'az': 'YГјklЙ™nmЙ™di',
        'en': 'Failed to load',
        'ru': 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ'
      });
  String get bookingsEmpty => _get({
        'az': 'HЙ™lЙ™ rezervasiya yoxdur',
        'en': 'No reservations yet',
        'ru': 'РџРѕРєР° РЅРµС‚ СЂРµР·РµСЂРІР°С†РёР№'
      });
  String get bookingsEmptyMessage => _get({
        'az': 'SЙ™yahЙ™t axtarД±n vЙ™ ilk rezervasiyanД±zД± edin.',
        'en': 'Search for trips and make your first reservation.',
        'ru':
            'РС‰РёС‚Рµ РїРѕРµР·РґРєРё Рё СЃРґРµР»Р°Р№С‚Рµ СЃРІРѕСЋ РїРµСЂРІСѓСЋ СЂРµР·РµСЂРІР°С†РёСЋ.'
      });
  String get bookingsSearchTrips => _get({
        'az': 'GediЕџ axtar',
        'en': 'Search trips',
        'ru': 'РСЃРєР°С‚СЊ РїРѕРµР·РґРєРё'
      });

  // Settings Screen
  String get settingsGeneral =>
      _get({'az': 'Гњmumi', 'en': 'General', 'ru': 'РћР±С‰РёРµ'});
  String get settingsLanguageTitle =>
      _get({'az': 'Dil', 'en': 'Language', 'ru': 'РЇР·С‹Рє'});
  String get settingsLanguageAz => _get({
        'az': 'AzЙ™rbaycan',
        'en': 'Azerbaijani',
        'ru': 'РђР·РµСЂР±Р°Р№РґР¶Р°РЅСЃРєРёР№'
      });
  String get settingsLanguageEn =>
      _get({'az': 'Д°ngilis', 'en': 'English', 'ru': 'РђРЅРіР»РёР№СЃРєРёР№'});
  String get settingsLanguageRu =>
      _get({'az': 'Rus', 'en': 'Russian', 'ru': 'Р СѓСЃСЃРєРёР№'});
  String get settingsDarkMode => _get({
        'az': 'QaranlД±q rejim',
        'en': 'Dark mode',
        'ru': 'РўС‘РјРЅС‹Р№ СЂРµР¶РёРј'
      });
  String get settingsThemeSystem =>
      _get({'az': 'Sistem', 'en': 'System', 'ru': 'РЎРёСЃС‚РµРјР°'});
  String get settingsThemeLight =>
      _get({'az': 'Д°ЕџД±qlД±', 'en': 'Light', 'ru': 'РЎРІРµС‚Р»Р°СЏ'});
  String get settingsThemeDark =>
      _get({'az': 'QaranlД±q', 'en': 'Dark', 'ru': 'РўС‘РјРЅР°СЏ'});
  String get settingsNotifications => _get({
        'az': 'BildiriЕџlЙ™r',
        'en': 'Notifications',
        'ru': 'РЈРІРµРґРѕРјР»РµРЅРёСЏ'
      });
  String get settingsPushNotifications => _get({
        'az': 'Push bildiriЕџlЙ™ri',
        'en': 'Push notifications',
        'ru': 'Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ'
      });
  String get settingsEmailNotifications => _get({
        'az': 'E-poГ§t bildiriЕџlЙ™ri',
        'en': 'Email notifications',
        'ru': 'Email-СѓРІРµРґРѕРјР»РµРЅРёСЏ'
      });
  String get settingsAccount => _get(
      {'az': 'Hesab', 'en': 'Account', 'ru': 'РЈС‡С‘С‚РЅР°СЏ Р·Р°РїРёСЃСЊ'});
  String get settingsSecurity => _get({
        'az': 'TЙ™hlГјkЙ™sizlik',
        'en': 'Security',
        'ru': 'Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ'
      });
  String get settingsPrivacy => _get({
        'az': 'MЙ™xfilik',
        'en': 'Privacy',
        'ru': 'РљРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚СЊ'
      });
  String get settingsComingSoon =>
      _get({'az': 'TezliklЙ™', 'en': 'Coming soon', 'ru': 'РЎРєРѕСЂРѕ'});

  String get notificationsTitle => _get({
        'az': 'BildiriЕџlЙ™r',
        'en': 'Notifications',
        'ru': 'РЈРІРµРґРѕРјР»РµРЅРёСЏ'
      });
  String get notificationsMarkAllRead => _get({
        'az': 'HamД±sД±nД± oxu',
        'en': 'Mark all read',
        'ru': 'РџСЂРѕС‡РёС‚Р°С‚СЊ РІСЃРµ'
      });
  String get notificationsEmpty => _get({
        'az': 'BildiriЕџ yoxdur',
        'en': 'No notifications',
        'ru': 'РќРµС‚ СѓРІРµРґРѕРјР»РµРЅРёР№'
      });
  String get notificationsEmptyMessage => _get({
        'az': 'Yeni bildiriЕџlЙ™r burada gГ¶rГјnЙ™cЙ™k.',
        'en': 'New notifications will appear here.',
        'ru': 'РќРѕРІС‹Рµ СѓРІРµРґРѕРјР»РµРЅРёСЏ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ.'
      });
  String get notificationsCheckAgain => _get({
        'az': 'YenidЙ™n yoxla',
        'en': 'Check again',
        'ru': 'РџСЂРѕРІРµСЂРёС‚СЊ СЃРЅРѕРІР°'
      });

  // Booking Detail Screen
  String get bookingDetailTitle => _get({
        'az': 'Rezervasiya detallarД±',
        'en': 'Booking details',
        'ru': 'Р”РµС‚Р°Р»Рё СЂРµР·РµСЂРІР°С†РёРё'
      });
  String get bookingDetailNotFound => _get({
        'az': 'Rezervasiya tapД±lmadД±',
        'en': 'Booking not found',
        'ru': 'Р РµР·РµСЂРІР°С†РёСЏ РЅРµ РЅР°Р№РґРµРЅР°'
      });
  String get bookingDetailGoBack =>
      _get({'az': 'Geri qayД±t', 'en': 'Go back', 'ru': 'Р’РµСЂРЅСѓС‚СЊСЃСЏ'});
  String get bookingDetailCancelTitle => _get({
        'az': 'RezervasiyanД± lЙ™Дџv et',
        'en': 'Cancel booking',
        'ru': 'РћС‚РјРµРЅРёС‚СЊ СЂРµР·РµСЂРІР°С†РёСЋ'
      });
  String get bookingDetailCancelMessage => _get({
        'az': 'Bu rezervasiyanД± lЙ™Дџv etmЙ™k istЙ™yirsiniz?',
        'en': 'Do you want to cancel this booking?',
        'ru': 'Р’С‹ С…РѕС‚РёС‚Рµ РѕС‚РјРµРЅРёС‚СЊ СЌС‚Сѓ СЂРµР·РµСЂРІР°С†РёСЋ?'
      });
  String get bookingDetailCancelBtn =>
      _get({'az': 'LЙ™Дџv et', 'en': 'Cancel', 'ru': 'РћС‚РјРµРЅРёС‚СЊ'});
  String get bookingDetailDismiss =>
      _get({'az': 'Д°mtina', 'en': 'Dismiss', 'ru': 'РћС‚РєР»РѕРЅРёС‚СЊ'});
  String get bookingDetailDate =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Р”Р°С‚Р°'});
  String get bookingDetailTime =>
      _get({'az': 'Vaxt', 'en': 'Time', 'ru': 'Р’СЂРµРјСЏ'});
  String get bookingDetailDriver =>
      _get({'az': 'SГјrГјcГј', 'en': 'Driver', 'ru': 'Р’РѕРґРёС‚РµР»СЊ'});
  String get bookingDetailSeats =>
      _get({'az': 'YerlЙ™r', 'en': 'Seats', 'ru': 'РњРµСЃС‚Р°'});
  String get bookingDetailTotal =>
      _get({'az': 'CЙ™mi', 'en': 'Total', 'ru': 'РС‚РѕРіРѕ'});
  String get bookingDetailMessageDriver => _get({
        'az': 'SГјrГјcГјyЙ™ yaz',
        'en': 'Message driver',
        'ru': 'РќР°РїРёСЃР°С‚СЊ РІРѕРґРёС‚РµР»СЋ'
      });
  String get bookingDetailLeaveReview => _get({
        'az': 'RЙ™y yaz',
        'en': 'Leave review',
        'ru': 'РћСЃС‚Р°РІРёС‚СЊ РѕС‚Р·С‹РІ'
      });

  // Trip Detail Screen
  String get tripDetailTitle => _get({
        'az': 'SЙ™yahЙ™t detallarД±',
        'en': 'Trip details',
        'ru': 'Р”РµС‚Р°Р»Рё РїРѕРµР·РґРєРё'
      });
  String get tripDetailNotFound => _get({
        'az': 'SЙ™yahЙ™t tapД±lmadД±',
        'en': 'Trip not found',
        'ru': 'РџРѕРµР·РґРєР° РЅРµ РЅР°Р№РґРµРЅР°'
      });
  String get tripDetailNotFoundMessage => _get({
        'az': 'Bu sЙ™yahЙ™t artД±q mГ¶vcud deyil.',
        'en': 'This trip is no longer available.',
        'ru': 'Р­С‚Р° РїРѕРµР·РґРєР° Р±РѕР»СЊС€Рµ РЅРµРґРѕСЃС‚СѓРїРЅР°.'
      });
  String get tripDetailDuration =>
      _get({'az': '~4 saat', 'en': '~4 hours', 'ru': '~4 С‡Р°СЃР°'});
  String get tripDetailDriverSection =>
      _get({'az': 'SГјrГјcГј', 'en': 'Driver', 'ru': 'Р’РѕРґРёС‚РµР»СЊ'});
  String get tripDetailTripsCount =>
      _get({'az': 'sЙ™yahЙ™t', 'en': 'trips', 'ru': 'РїРѕРµР·РґРѕРє'});
  String get tripDetailInfoSection => _get({
        'az': 'SЙ™yahЙ™t mЙ™lumatlarД±',
        'en': 'Trip information',
        'ru': 'РРЅС„РѕСЂРјР°С†РёСЏ Рѕ РїРѕРµР·РґРєРµ'
      });
  String get tripDetailAvailableSeats => _get({
        'az': 'BoЕџ yerlЙ™r',
        'en': 'Available seats',
        'ru': 'РЎРІРѕР±РѕРґРЅС‹Рµ РјРµСЃС‚Р°'
      });
  String get tripDetailSeatsUnit =>
      _get({'az': 'yer', 'en': 'seats', 'ru': 'РјРµСЃС‚'});
  String get tripDetailCar =>
      _get({'az': 'Avtomobil', 'en': 'Car', 'ru': 'РђРІС‚РѕРјРѕР±РёР»СЊ'});
  String get tripDetailLuggage =>
      _get({'az': 'Baqaj', 'en': 'Luggage', 'ru': 'Р‘Р°РіР°Р¶'});
  String get tripDetailLuggageSize => _get({
        'az': 'Orta Г¶lГ§ГјlГј Г§amadan',
        'en': 'Medium-sized suitcase',
        'ru': 'Р§РµРјРѕРґР°РЅ СЃСЂРµРґРЅРµРіРѕ СЂР°Р·РјРµСЂР°'
      });
  String get tripDetailPreferences => _get({
        'az': 'ГњstГјnlГјklЙ™r',
        'en': 'Preferences',
        'ru': 'РџСЂРµРґРїРѕС‡С‚РµРЅРёСЏ'
      });
  String get tripDetailNoSmoking => _get(
      {'az': 'Siqaret yox', 'en': 'No smoking', 'ru': 'Р‘РµР· РєСѓСЂРµРЅРёСЏ'});
  String get tripDetailMusic => _get({
        'az': 'Musiqi var',
        'en': 'Music available',
        'ru': 'РњСѓР·С‹РєР° РґРѕСЃС‚СѓРїРЅР°'
      });
  String get tripDetailLuggageAllowed => _get({
        'az': 'Baqaj olar',
        'en': 'Luggage allowed',
        'ru': 'Р‘Р°РіР°Р¶ СЂР°Р·СЂРµС€РµРЅ'
      });
  String get tripDetailBookBtn => _get(
      {'az': 'Rezerv et', 'en': 'Book', 'ru': 'Р—Р°Р±СЂРѕРЅРёСЂРѕРІР°С‚СЊ'});
  String get tripDetailNoSeats =>
      _get({'az': 'Yer yoxdur', 'en': 'No seats', 'ru': 'РќРµС‚ РјРµСЃС‚'});
  String get tripDetailPriceLabel =>
      _get({'az': 'QiymЙ™t', 'en': 'Price', 'ru': 'Р¦РµРЅР°'});

  // Wallet Screen
  String get walletTitle =>
      _get({'az': 'Pul kisЙ™si', 'en': 'Wallet', 'ru': 'РљРѕС€РµР»С‘Рє'});
  String get walletMockBanner => _get({
        'az': 'Demo rejimi вЂ” Г¶dЙ™niЕџlЙ™r hЙ™lЙ™ qoЕџulmayД±b.',
        'en': 'Demo mode вЂ” payments not yet connected.',
        'ru':
            'Р”РµРјРѕ-СЂРµР¶РёРј вЂ” РїР»Р°С‚РµР¶Рё РµС‰С‘ РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹.'
      });
  String get walletBalance =>
      _get({'az': 'Balans', 'en': 'Balance', 'ru': 'Р‘Р°Р»Р°РЅСЃ'});
  String get walletPaymentMethod => _get({
        'az': 'Г–dЙ™niЕџ Гјsulu',
        'en': 'Payment method',
        'ru': 'РЎРїРѕСЃРѕР± РѕРїР»Р°С‚С‹'
      });
  String get walletNoCard => _get({
        'az': 'Kart Й™lavЙ™ edilmЙ™yib',
        'en': 'No card added',
        'ru': 'РљР°СЂС‚Р° РЅРµ РґРѕР±Р°РІР»РµРЅР°'
      });
  String get walletAddCard =>
      _get({'az': 'ЖЏlavЙ™ et', 'en': 'Add', 'ru': 'Р”РѕР±Р°РІРёС‚СЊ'});
  String get walletTransactions => _get(
      {'az': 'ЖЏmЙ™liyyatlar', 'en': 'Transactions', 'ru': 'РћРїРµСЂР°С†РёРё'});
  String get walletTopUp => _get({
        'az': 'Balans artД±mД±',
        'en': 'Top up',
        'ru': 'РџРѕРїРѕР»РЅРµРЅРёРµ Р±Р°Р»Р°РЅСЃР°'
      });
  String get walletComingSoon =>
      _get({'az': 'TezliklЙ™', 'en': 'Coming soon', 'ru': 'РЎРєРѕСЂРѕ'});
  String get walletTopUpBtn => _get({
        'az': 'BalansД± artД±r',
        'en': 'Top up balance',
        'ru': 'РџРѕРїРѕР»РЅРёС‚СЊ Р±Р°Р»Р°РЅСЃ'
      });

  String get walletEmpty => _get({
        'az': 'ЖЏmЙ™liyyat yoxdur',
        'en': 'No transactions',
        'ru': 'РќРµС‚ РѕРїРµСЂР°С†РёР№'
      });
  String get walletEmptyMessage => _get({
        'az': 'Pul kisЙ™sindЙ™ hЙ™lЙ™ heГ§ bir hЙ™rЙ™kЙ™t yoxdur.',
        'en': 'Your wallet has no activity yet.',
        'ru': 'Р’ РєРѕС€РµР»СЊРєРµ РїРѕРєР° РЅРµС‚ РѕРїРµСЂР°С†РёР№.'
      });
  String get walletRefresh =>
      _get({'az': 'YenilЙ™', 'en': 'Refresh', 'ru': 'РћР±РЅРѕРІРёС‚СЊ'});

  // Driver Panel Screen
  String get driverPanelTitle => _get({
        'az': 'SГјrГјcГј Paneli',
        'en': 'Driver Panel',
        'ru': 'РџР°РЅРµР»СЊ РІРѕРґРёС‚РµР»СЏ'
      });
  String get driverPanelAccessDenied => _get({
        'az': 'Bu sЙ™hifЙ™yЙ™ giriЕџ qadaДџandД±r.',
        'en': 'Access to this page is forbidden.',
        'ru': 'Р”РѕСЃС‚СѓРї Рє СЌС‚РѕР№ СЃС‚СЂР°РЅРёС†Рµ Р·Р°РїСЂРµС‰С‘РЅ.'
      });
  String get driverPanelGoBack =>
      _get({'az': 'Geri qayД±t', 'en': 'Go back', 'ru': 'Р’РµСЂРЅСѓС‚СЊСЃСЏ'});
  String get driverPanelHello =>
      _get({'az': 'Salam', 'en': 'Hello', 'ru': 'РџСЂРёРІРµС‚'});
  String get driverPanelVerified => _get({
        'az': 'TЙ™sdiqlЙ™nmiЕџ sГјrГјcГј',
        'en': 'Verified driver',
        'ru': 'РџСЂРѕРІРµСЂРµРЅРЅС‹Р№ РІРѕРґРёС‚РµР»СЊ'
      });
  String get driverPanelQuickActions => _get({
        'az': 'Tez Й™mЙ™liyyatlar',
        'en': 'Quick actions',
        'ru': 'Р‘С‹СЃС‚СЂС‹Рµ РґРµР№СЃС‚РІРёСЏ'
      });
  String get driverPanelCreateRide => _get({
        'az': 'Yeni gediЕџ yarat',
        'en': 'Create new ride',
        'ru': 'РЎРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ РїРѕРµР·РґРєСѓ'
      });
  String get driverPanelMyRides => _get(
      {'az': 'GediЕџlЙ™rim', 'en': 'My rides', 'ru': 'РњРѕРё РїРѕРµР·РґРєРё'});
  String get driverPanelRequests =>
      _get({'az': 'SorДџular', 'en': 'Requests', 'ru': 'Р—Р°РїСЂРѕСЃС‹'});
  String get driverPanelActiveRide => _get({
        'az': 'Aktiv gediЕџ',
        'en': 'Active ride',
        'ru': 'РђРєС‚РёРІРЅР°СЏ РїРѕРµР·РґРєР°'
      });
  String get driverPanelEarnings =>
      _get({'az': 'GЙ™lir', 'en': 'Earnings', 'ru': 'Р”РѕС…РѕРґ'});
  String get driverPanelThisMonth => _get(
      {'az': 'Bu ay', 'en': 'This month', 'ru': 'Р’ СЌС‚РѕРј РјРµСЃСЏС†Рµ'});
  String get driverPanelVehicles => _get(
      {'az': 'AvtomobillЙ™r', 'en': 'Vehicles', 'ru': 'РђРІС‚РѕРјРѕР±РёР»Рё'});
  String get driverPanelManageVehicles => _get({
        'az': 'AvtomobillЙ™ri idarЙ™ et',
        'en': 'Manage vehicles',
        'ru': 'РЈРїСЂР°РІР»СЏС‚СЊ Р°РІС‚РѕРјРѕР±РёР»СЏРјРё'
      });

  // Profile Screen
  String get profileTitle =>
      _get({'az': 'Profil', 'en': 'Profile', 'ru': 'РџСЂРѕС„РёР»СЊ'});
  String get profileWallet =>
      _get({'az': 'Pul kisЙ™si', 'en': 'Wallet', 'ru': 'РљРѕС€РµР»С‘Рє'});
  String get profileReservations => _get({
        'az': 'RezervasiyalarД±m',
        'en': 'My Reservations',
        'ru': 'РњРѕРё СЂРµР·РµСЂРІР°С†РёРё'
      });
  String get profileReviews =>
      _get({'az': 'RЙ™ylЙ™r', 'en': 'Reviews', 'ru': 'РћС‚Р·С‹РІС‹'});
  String get profileNotifications => _get({
        'az': 'BildiriЕџlЙ™r',
        'en': 'Notifications',
        'ru': 'РЈРІРµРґРѕРјР»РµРЅРёСЏ'
      });
  String get profileDriverPanel => _get({
        'az': 'SГјrГјcГј Paneli',
        'en': 'Driver Panel',
        'ru': 'РџР°РЅРµР»СЊ РІРѕРґРёС‚РµР»СЏ'
      });
  String get profileDriverPending => _get({
        'az': 'SГјrГјcГј statusu: YoxlanД±lД±r',
        'en': 'Driver status: Under review',
        'ru': 'РЎС‚Р°С‚СѓСЃ РІРѕРґРёС‚РµР»СЏ: РќР° РїСЂРѕРІРµСЂРєРµ'
      });
  String get profileBecomeDriver => _get({
        'az': 'SГјrГјcГј olmaq istЙ™yirsiniz?',
        'en': 'Want to become a driver?',
        'ru': 'РҐРѕС‚РёС‚Рµ СЃС‚Р°С‚СЊ РІРѕРґРёС‚РµР»РµРј?'
      });
  String get profileSettingsMenu => _get(
      {'az': 'ParametrlЙ™r', 'en': 'Settings', 'ru': 'РќР°СЃС‚СЂРѕР№РєРё'});
  String get profileHelp =>
      _get({'az': 'KГ¶mЙ™k', 'en': 'Help', 'ru': 'РџРѕРјРѕС‰СЊ'});
  String get profileLogoutConfirm => _get({
        'az': 'Г‡Д±xД±Еџ etmЙ™k istЙ™diyinizЙ™ Й™minsiniz?',
        'en': 'Are you sure you want to log out?',
        'ru': 'Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ РІС‹Р№С‚Рё?'
      });
  String get profileLogoutBtn =>
      _get({'az': 'Г‡Д±xД±Еџ et', 'en': 'Log out', 'ru': 'Р’С‹Р№С‚Рё'});
  String get profileCancel =>
      _get({'az': 'LЙ™Дџv et', 'en': 'Cancel', 'ru': 'РћС‚РјРµРЅР°'});

  // Trust & Safety
  String get trustVerifiedDriver => _get({
        'az': 'TЙ™sdiqlЙ™nmiЕџ sГјrГјcГј',
        'en': 'Verified driver',
        'ru': 'РџСЂРѕРІРµСЂРµРЅРЅС‹Р№ РІРѕРґРёС‚РµР»СЊ'
      });
  String get trustDocumentsChecked => _get({
        'az': 'SЙ™nЙ™dlЙ™r yoxlanД±lД±b',
        'en': 'Documents verified',
        'ru': 'Р”РѕРєСѓРјРµРЅС‚С‹ РїСЂРѕРІРµСЂРµРЅС‹'
      });
  String get trustSafetyNote => _get({
        'az': 'ЕћЙ™xsiyyЙ™t vЙ™ sГјrГјcГјlГјk vЙ™siqЙ™si tЙ™sdiqlЙ™nib',
        'en': 'Identity and license verified',
        'ru':
            'РЈРґРѕСЃС‚РѕРІРµСЂРµРЅРёРµ Р»РёС‡РЅРѕСЃС‚Рё Рё РїСЂР°РІР° РїСЂРѕРІРµСЂРµРЅС‹'
      });
  String get trustTripsCount =>
      _get({'az': 'sЙ™yahЙ™t', 'en': 'trips', 'ru': 'РїРѕРµР·РґРѕРє'});
  String get trustRating =>
      _get({'az': 'Reytinq', 'en': 'Rating', 'ru': 'Р РµР№С‚РёРЅРі'});

  // Active Ride Safety
  String get safetyTitle => _get({
        'az': 'TЙ™hlГјkЙ™sizlik',
        'en': 'Safety',
        'ru': 'Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ'
      });
  String get safetyShareTrip => _get({
        'az': 'SЙ™fЙ™ri paylaЕџ',
        'en': 'Share trip',
        'ru': 'РџРѕРґРµР»РёС‚СЊСЃСЏ РїРѕРµР·РґРєРѕР№'
      });
  String get safetyShareCopied => _get({
        'az': 'MЙ™lumat kopyalandД±',
        'en': 'Trip details copied',
        'ru': 'РРЅС„РѕСЂРјР°С†РёСЏ СЃРєРѕРїРёСЂРѕРІР°РЅР°'
      });
  String get safetySOS => _get({
        'az': 'TЙ™cili yardД±m (SOS)',
        'en': 'Emergency (SOS)',
        'ru': 'Р­РєСЃС‚СЂРµРЅРЅР°СЏ РїРѕРјРѕС‰СЊ (SOS)'
      });
  String get safetySOSConfirmTitle => _get({
        'az': 'TЙ™cili yardД±m Г§aДџД±rД±n?',
        'en': 'Call emergency services?',
        'ru': 'Р’С‹Р·РІР°С‚СЊ СЌРєСЃС‚СЂРµРЅРЅСѓСЋ РїРѕРјРѕС‰СЊ?'
      });
  String get safetySOSConfirmMessage => _get({
        'az':
            'TЙ™cili yardД±m nГ¶mrЙ™si: 112\n\nSЙ™fЙ™r mЙ™lumatД± buferЙ™ kopyalanacaq.',
        'en':
            'Emergency number: 112\n\nTrip details will be copied to clipboard.',
        'ru':
            'Р­РєСЃС‚СЂРµРЅРЅС‹Р№ РЅРѕРјРµСЂ: 112\n\nРРЅС„РѕСЂРјР°С†РёСЏ Рѕ РїРѕРµР·РґРєРµ Р±СѓРґРµС‚ СЃРєРѕРїРёСЂРѕРІР°РЅР°.'
      });
  String get safetySOSCall => _get({
        'az': '112-yЙ™ zЙ™ng et',
        'en': 'Call 112',
        'ru': 'РџРѕР·РІРѕРЅРёС‚СЊ 112'
      });
  String get safetySOSCopy => _get({
        'az': 'MЙ™lumatД± kopyala',
        'en': 'Copy details',
        'ru': 'РЎРєРѕРїРёСЂРѕРІР°С‚СЊ РґР°РЅРЅС‹Рµ'
      });
  String get safetyCancel =>
      _get({'az': 'LЙ™Дџv et', 'en': 'Cancel', 'ru': 'РћС‚РјРµРЅР°'});

  // Create Ride Screen
  String get createRideTitle => _get({
        'az': 'SЙ™yahЙ™t yarat',
        'en': 'Create trip',
        'ru': 'РЎРѕР·РґР°С‚СЊ РїРѕРµР·РґРєСѓ'
      });
  String get createRideFrom =>
      _get({'az': 'Haradan', 'en': 'From', 'ru': 'РћС‚РєСѓРґР°'});
  String get createRideTo => _get({'az': 'Hara', 'en': 'To', 'ru': 'РљСѓРґР°'});
  String get createRideDate =>
      _get({'az': 'Tarix', 'en': 'Date', 'ru': 'Р”Р°С‚Р°'});
  String get createRideTime =>
      _get({'az': 'Vaxt', 'en': 'Time', 'ru': 'Р’СЂРµРјСЏ'});
  String get createRideSeats => _get({
        'az': 'BoЕџ yerlЙ™r',
        'en': 'Available seats',
        'ru': 'РЎРІРѕР±РѕРґРЅС‹Рµ РјРµСЃС‚Р°'
      });
  String get createRideSeatsLabel => _get({
        'az': 'Yer sayД±',
        'en': 'Number of seats',
        'ru': 'РљРѕР»РёС‡РµСЃС‚РІРѕ РјРµСЃС‚'
      });
  String get createRidePrice => _get({
        'az': 'Bir yer ГјГ§Гјn qiymЙ™t (AZN)',
        'en': 'Price per seat (AZN)',
        'ru': 'Р¦РµРЅР° Р·Р° РјРµСЃС‚Рѕ (AZN)'
      });
  String get createRidePriceHint =>
      _get({'az': 'mЙ™s. 15', 'en': 'e.g. 15', 'ru': 'РЅР°РїСЂ. 15'});
  String get createRidePriceRequired => _get({
        'az': 'QiymЙ™ti daxil edin',
        'en': 'Enter price',
        'ru': 'Р’РІРµРґРёС‚Рµ С†РµРЅСѓ'
      });
  String get createRidePriceInvalid => _get({
        'az': 'DГјzgГјn qiymЙ™t daxil edin',
        'en': 'Enter valid price',
        'ru': 'Р’РІРµРґРёС‚Рµ РєРѕСЂСЂРµРєС‚РЅСѓСЋ С†РµРЅСѓ'
      });
  String get createRideAiTitle => _get({
        'az': 'AI qiymət təklifi',
        'en': 'AI price suggestion',
        'ru': 'РџСЂРµРґР»РѕР¶РµРЅРёРµ С†РµРЅС‹ РѕС‚ РР'
      });
  String get createRideAiGetSuggestion => _get({
        'az': 'Təklif al',
        'en': 'Get suggestion',
        'ru': 'РџРѕР»СѓС‡РёС‚СЊ РїСЂРµРґР»РѕР¶РµРЅРёРµ'
      });
  String get createRideAiRetry => _get({
        'az': 'Yenidən cəhd et',
        'en': 'Retry',
        'ru': 'РџРѕРїСЂРѕР±РѕРІР°С‚СЊ СЃРЅРѕРІР°'
      });
  String get createRideAiSuggestionLabel => _get({
        'az': 'Təklif olunan qiymət:',
        'en': 'Suggested price:',
        'ru': 'РџСЂРµРґР»Р°РіР°РµРјР°СЏ С†РµРЅР°:'
      });
  String get createRideAiUsePrice => _get({
        'az': 'Bu qiyməti istifadə et',
        'en': 'Use this price',
        'ru': 'РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ СЌС‚Сѓ С†РµРЅСѓ'
      });
  String get createRideAiError => _get({
        'az': 'Qiymət təklifi alınmadı',
        'en': 'Failed to get price suggestion',
        'ru':
            'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РїСЂРµРґР»РѕР¶РµРЅРёРµ С†РµРЅС‹'
      });
  String get createRidePreferences => _get({
        'az': 'ГњstГјnlГјklЙ™r',
        'en': 'Preferences',
        'ru': 'РџСЂРµРґРїРѕС‡С‚РµРЅРёСЏ'
      });
  String get createRideLuggage => _get({
        'az': 'Baqaja icazЙ™',
        'en': 'Luggage allowed',
        'ru': 'Р‘Р°РіР°Р¶ СЂР°Р·СЂРµС€РµРЅ'
      });
  String get createRideSmoking =>
      _get({'az': 'Siqaret', 'en': 'Smoking', 'ru': 'РљСѓСЂРµРЅРёРµ'});
  String get createRideMusic =>
      _get({'az': 'Musiqi', 'en': 'Music', 'ru': 'РњСѓР·С‹РєР°'});
  String get createRideNotes => _get({
        'az': 'Qeyd (istЙ™yЙ™ baДџlД±)',
        'en': 'Notes (optional)',
        'ru': 'РџСЂРёРјРµС‡Р°РЅРёСЏ (РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)'
      });
  String get createRideNotesHint => _get({
        'az': 'SЙ™rniЕџinlЙ™r ГјГ§Гјn Й™lavЙ™ mЙ™lumat',
        'en': 'Additional info for passengers',
        'ru':
            'Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ РґР»СЏ РїР°СЃСЃР°Р¶РёСЂРѕРІ'
      });
  String get createRidePublish => _get(
      {'az': 'DЙ™rc et', 'en': 'Publish', 'ru': 'РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ'});
  String get createRideSameLocationError => _get({
        'az': 'Г‡Д±xД±Еџ vЙ™ tЙ™yinat eyni ola bilmЙ™z',
        'en': 'Origin and destination cannot be the same',
        'ru':
            'РќР°С‡Р°Р»Рѕ Рё РїСѓРЅРєС‚ РЅР°Р·РЅР°С‡РµРЅРёСЏ РЅРµ РјРѕРіСѓС‚ СЃРѕРІРїР°РґР°С‚СЊ'
      });
  String get createRidePublishError => _get({
        'az': 'SЙ™yahЙ™t dЙ™rc edilЙ™ bilmЙ™di. YenidЙ™n cЙ™hd edin.',
        'en': 'Failed to publish trip. Please try again.',
        'ru':
            'РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ РїРѕРµР·РґРєСѓ. РџРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.'
      });
  String get createRideSuccessTitle => _get({
        'az': 'SЙ™yahЙ™t dЙ™rc edildi',
        'en': 'Trip published',
        'ru': 'РџРѕРµР·РґРєР° РѕРїСѓР±Р»РёРєРѕРІР°РЅР°'
      });
  String get createRideSuccessMessage => _get({
        'az': 'SЙ™rniЕџinlЙ™r artД±q sizi tapa bilЙ™r.',
        'en': 'Passengers can now find you.',
        'ru': 'РџР°СЃСЃР°Р¶РёСЂС‹ С‚РµРїРµСЂСЊ РјРѕРіСѓС‚ РЅР°Р№С‚Рё РІР°СЃ.'
      });

  // Add Vehicle Screen
  String get addVehicleTitle => _get({
        'az': 'Avtomobil Й™lavЙ™ et',
        'en': 'Add vehicle',
        'ru': 'Р”РѕР±Р°РІРёС‚СЊ Р°РІС‚РѕРјРѕР±РёР»СЊ'
      });
  String get addVehicleBrand =>
      _get({'az': 'Marka', 'en': 'Brand', 'ru': 'РњР°СЂРєР°'});
  String get addVehicleBrandHint =>
      _get({'az': 'Toyota', 'en': 'Toyota', 'ru': 'Toyota'});
  String get addVehicleModel =>
      _get({'az': 'Model', 'en': 'Model', 'ru': 'РњРѕРґРµР»СЊ'});
  String get addVehicleModelHint =>
      _get({'az': 'Camry', 'en': 'Camry', 'ru': 'Camry'});
  String get addVehicleYear =>
      _get({'az': 'Д°l', 'en': 'Year', 'ru': 'Р“РѕРґ'});
  String get addVehicleYearHint =>
      _get({'az': '2020', 'en': '2020', 'ru': '2020'});
  String get addVehicleYearInvalid => _get({
        'az': 'Д°l daxil edin',
        'en': 'Enter year',
        'ru': 'Р’РІРµРґРёС‚Рµ РіРѕРґ'
      });
  String addVehicleYearRange(int startYear, int endYear) => _get({
        'az': '$startYearвЂ“$endYear aralД±ДџД±nda',
        'en': 'Between $startYearвЂ“$endYear',
        'ru': 'Р’ РґРёР°РїР°Р·РѕРЅРµ $startYearвЂ“$endYear'
      });
  String get addVehicleColor =>
      _get({'az': 'RЙ™ng', 'en': 'Color', 'ru': 'Р¦РІРµС‚'});
  String get addVehicleColorHint =>
      _get({'az': 'AДџ', 'en': 'White', 'ru': 'Р‘РµР»С‹Р№'});
  String get addVehiclePlate => _get({
        'az': 'DГ¶vlЙ™t nГ¶mrЙ™si',
        'en': 'License plate',
        'ru': 'Р“РѕСЃРЅРѕРјРµСЂ'
      });
  String get addVehiclePlateHint =>
      _get({'az': '90-AA-123', 'en': '90-AA-123', 'ru': '90-AA-123'});
  String get addVehicleSeatsCount => _get({
        'az': 'Oturacaq sayД±',
        'en': 'Seat count',
        'ru': 'РљРѕР»РёС‡РµСЃС‚РІРѕ РјРµСЃС‚'
      });
  String get addVehicleSeatsAvailable => _get({
        'az': 'BoЕџ oturacaqlar',
        'en': 'Available seats',
        'ru': 'РЎРІРѕР±РѕРґРЅС‹Рµ РјРµСЃС‚Р°'
      });
  String get addVehicleSave =>
      _get({'az': 'Yadda saxla', 'en': 'Save', 'ru': 'РЎРѕС…СЂР°РЅРёС‚СЊ'});
  String get addVehicleRequired => _get({
        'az': 'Bu sahЙ™ tЙ™lЙ™b olunur',
        'en': 'This field is required',
        'ru': 'Р­С‚Рѕ РїРѕР»Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ'
      });
  String get addVehicleSaveError => _get({
        'az': 'Yadda saxlanmadД±. YenidЙ™n cЙ™hd edin.',
        'en': 'Failed to save. Please try again.',
        'ru':
            'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.'
      });
  String get addVehicleSuccessSnackbar => _get({
        'az': 'Avtomobil yadda saxlanД±ldД±',
        'en': 'Vehicle saved',
        'ru': 'РђРІС‚РѕРјРѕР±РёР»СЊ СЃРѕС…СЂР°РЅС‘РЅ'
      });

  // My Rides Screen
  String get myRidesTitle => _get(
      {'az': 'SЙ™fЙ™rlЙ™rim', 'en': 'My rides', 'ru': 'РњРѕРё РїРѕРµР·РґРєРё'});
  String get myRidesNewRide => _get({
        'az': 'Yeni sЙ™fЙ™r',
        'en': 'New ride',
        'ru': 'РќРѕРІР°СЏ РїРѕРµР·РґРєР°'
      });
  String get myRidesLoading => _get(
      {'az': 'YГјklЙ™nir...', 'en': 'Loading...', 'ru': 'Р—Р°РіСЂСѓР·РєР°...'});
  String get myRidesLoadFailed => _get({
        'az': 'YГјklЙ™nmЙ™di',
        'en': 'Failed to load',
        'ru': 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ'
      });
  String get myRidesEmpty => _get({
        'az': 'HЙ™lЙ™ sЙ™fЙ™r yoxdur',
        'en': 'No rides yet',
        'ru': 'РџРѕРєР° РЅРµС‚ РїРѕРµР·РґРѕРє'
      });
  String get myRidesEmptyMessage => _get({
        'az': 'Д°lk sЙ™fЙ™rinizi yaradД±n vЙ™ sЙ™rniЕџin tapД±n.',
        'en': 'Create your first ride and find passengers.',
        'ru':
            'РЎРѕР·РґР°Р№С‚Рµ СЃРІРѕСЋ РїРµСЂРІСѓСЋ РїРѕРµР·РґРєСѓ Рё РЅР°Р№РґРёС‚Рµ РїР°СЃСЃР°Р¶РёСЂРѕРІ.'
      });
  String get myRidesCreateAction => _get({
        'az': 'SЙ™fЙ™r yarat',
        'en': 'Create ride',
        'ru': 'РЎРѕР·РґР°С‚СЊ РїРѕРµР·РґРєСѓ'
      });
  String get myRidesSeatsLabel =>
      _get({'az': 'yer', 'en': 'seats', 'ru': 'РјРµСЃС‚'});
  String get myRidesActionRequests =>
      _get({'az': 'SorДџular', 'en': 'Requests', 'ru': 'Р—Р°РїСЂРѕСЃС‹'});
  String get myRidesActionDuplicate => _get(
      {'az': 'Dublikat', 'en': 'Duplicate', 'ru': 'Р”СѓР±Р»РёСЂРѕРІР°С‚СЊ'});
  String get myRidesActionCancel =>
      _get({'az': 'LЙ™Дџv et', 'en': 'Cancel', 'ru': 'РћС‚РјРµРЅРёС‚СЊ'});
  String get myRidesDuplicateSuccess => _get({
        'az': 'SЙ™fЙ™r dublikat edildi',
        'en': 'Ride duplicated',
        'ru': 'РџРѕРµР·РґРєР° РґСѓР±Р»РёСЂРѕРІР°РЅР°'
      });
  String get myRidesCancelTitle => _get({
        'az': 'SЙ™fЙ™ri lЙ™Дџv et',
        'en': 'Cancel ride',
        'ru': 'РћС‚РјРµРЅРёС‚СЊ РїРѕРµР·РґРєСѓ'
      });
  String get myRidesCancelMessage => _get({
        'az': 'Bu sЙ™fЙ™ri lЙ™Дџv etmЙ™k istЙ™yirsiniz?',
        'en': 'Do you want to cancel this ride?',
        'ru': 'Р’С‹ С…РѕС‚РёС‚Рµ РѕС‚РјРµРЅРёС‚СЊ СЌС‚Сѓ РїРѕРµР·РґРєСѓ?'
      });
  String get myRidesCancelConfirm =>
      _get({'az': 'LЙ™Дџv et', 'en': 'Cancel', 'ru': 'РћС‚РјРµРЅРёС‚СЊ'});
  String get myRidesCancelDismiss =>
      _get({'az': 'Д°mtina', 'en': 'Dismiss', 'ru': 'РћС‚РєР»РѕРЅРёС‚СЊ'});

  // Passenger Requests Screen
  String get passengerRequestsTitle => _get({
        'az': 'SЙ™rniЕџin sorДџularД±',
        'en': 'Passenger requests',
        'ru': 'Р—Р°РїСЂРѕСЃС‹ РїР°СЃСЃР°Р¶РёСЂРѕРІ'
      });
  String get passengerRequestsEmpty => _get({
        'az': 'SorДџu yoxdur',
        'en': 'No requests',
        'ru': 'РќРµС‚ Р·Р°РїСЂРѕСЃРѕРІ'
      });
  String get passengerRequestsEmptyMessage => _get({
        'az': 'Yeni sЙ™rniЕџin sorДџularД± burada gГ¶rГјnЙ™cЙ™k.',
        'en': 'New passenger requests will appear here.',
        'ru':
            'РќРѕРІС‹Рµ Р·Р°РїСЂРѕСЃС‹ РїР°СЃСЃР°Р¶РёСЂРѕРІ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ.'
      });
  String get passengerRequestsSeatsLabel =>
      _get({'az': 'yer', 'en': 'seats', 'ru': 'РјРµСЃС‚'});
  String get passengerRequestsReject =>
      _get({'az': 'RЙ™dd et', 'en': 'Reject', 'ru': 'РћС‚РєР»РѕРЅРёС‚СЊ'});
  String get passengerRequestsAccept =>
      _get({'az': 'QЙ™bul et', 'en': 'Accept', 'ru': 'РџСЂРёРЅСЏС‚СЊ'});

  // Active Ride Screen
  String get activeRideTitle => _get({
        'az': 'SЙ™fЙ™r Д°darЙ™etmЙ™',
        'en': 'Ride Management',
        'ru': 'РЈРїСЂР°РІР»РµРЅРёРµ РїРѕРµР·РґРєРѕР№'
      });
  String get activeRideError => _get({
        'az': 'XЙ™ta baЕџ verdi',
        'en': 'An error occurred',
        'ru': 'РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°'
      });
  String get activeRideCompleted => _get({
        'az': 'SЙ™fЙ™r tamamlandД±!',
        'en': 'Ride completed!',
        'ru': 'РџРѕРµР·РґРєР° Р·Р°РІРµСЂС€РµРЅР°!'
      });
  String get activeRideStartButton => _get({
        'az': 'SЙ™fЙ™rЙ™ baЕџla',
        'en': 'Start ride',
        'ru': 'РќР°С‡Р°С‚СЊ РїРѕРµР·РґРєСѓ'
      });
  String get activeRideCompleteButton => _get({
        'az': 'SЙ™fЙ™ri bitir',
        'en': 'Complete ride',
        'ru': 'Р—Р°РІРµСЂС€РёС‚СЊ РїРѕРµР·РґРєСѓ'
      });
  String get activeRideGoBack =>
      _get({'az': 'Geri qayД±t', 'en': 'Go back', 'ru': 'Р’РµСЂРЅСѓС‚СЊСЃСЏ'});

  // Date Formatting Helpers
  String monthName(int month) {
    final months = {
      'az': [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Д°yun',
        'Д°yul',
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
        'РЇРЅРІР°СЂСЊ',
        'Р¤РµРІСЂР°Р»СЊ',
        'РњР°СЂС‚',
        'РђРїСЂРµР»СЊ',
        'РњР°Р№',
        'РСЋРЅСЊ',
        'РСЋР»СЊ',
        'РђРІРіСѓСЃС‚',
        'РЎРµРЅС‚СЏР±СЂСЊ',
        'РћРєС‚СЏР±СЂСЊ',
        'РќРѕСЏР±СЂСЊ',
        'Р”РµРєР°Р±СЂСЊ'
      ],
    };
    return months[language.name]![month - 1];
  }

  String weekdayName(int weekday) {
    final weekdays = {
      'az': [
        'Bazar ertЙ™si',
        'Г‡Й™rЕџЙ™nbЙ™ axЕџamД±',
        'Г‡Й™rЕџЙ™nbЙ™',
        'CГјmЙ™ axЕџamД±',
        'CГјmЙ™',
        'ЕћЙ™nbЙ™',
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
        'РџРѕРЅРµРґРµР»СЊРЅРёРє',
        'Р’С‚РѕСЂРЅРёРє',
        'РЎСЂРµРґР°',
        'Р§РµС‚РІРµСЂРі',
        'РџСЏС‚РЅРёС†Р°',
        'РЎСѓР±Р±РѕС‚Р°',
        'Р’РѕСЃРєСЂРµСЃРµРЅСЊРµ'
      ],
    };
    return weekdays[language.name]![weekday - 1];
  }

  String shortWeekdayName(int weekday) {
    final weekdays = {
      'az': ['B.e', 'Г‡.a', 'Г‡', 'C.a', 'C', 'Ећ', 'B'],
      'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      'ru': ['РџРЅ', 'Р’С‚', 'РЎСЂ', 'Р§С‚', 'РџС‚', 'РЎР±', 'Р’СЃ'],
    };
    return weekdays[language.name]![weekday - 1];
  }

  // Plural Form Helpers
  String seatsPlural(int count) {
    if (language == AppLanguage.az) {
      return count == 1 ? 'yer' : 'yerlЙ™r';
    } else if (language == AppLanguage.en) {
      return count == 1 ? 'seat' : 'seats';
    } else {
      // Russian: 1 РјРµСЃС‚Рѕ, 2-4 РјРµСЃС‚Р°, 5+ РјРµСЃС‚
      if (count % 10 == 1 && count % 100 != 11) {
        return 'РјРµСЃС‚Рѕ';
      }
      if ([2, 3, 4].contains(count % 10) &&
          ![12, 13, 14].contains(count % 100)) {
        return 'РјРµСЃС‚Р°';
      }
      return 'РјРµСЃС‚';
    }
  }

  String tripsPlural(int count) {
    if (language == AppLanguage.az) {
      return 'sЙ™yahЙ™t';
    } else if (language == AppLanguage.en) {
      return count == 1 ? 'trip' : 'trips';
    } else {
      // Russian: 1 РїРѕРµР·РґРєР°, 2-4 РїРѕРµР·РґРєРё, 5+ РїРѕРµР·РґРѕРє
      if (count % 10 == 1 && count % 100 != 11) {
        return 'РїРѕРµР·РґРєР°';
      }
      if ([2, 3, 4].contains(count % 10) &&
          ![12, 13, 14].contains(count % 100)) {
        return 'РїРѕРµР·РґРєРё';
      }
      return 'РїРѕРµР·РґРѕРє';
    }
  }

  String _get(Map<String, String> translations) {
    return translations[language.name] ?? translations['az'] ?? '';
  }
}
