import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter_android/google_maps_flutter_android.dart';
import 'package:google_maps_flutter_platform_interface/google_maps_flutter_platform_interface.dart';

import 'core/localization/app_localizations.dart';
import 'core/routes.dart';
import 'core/theme.dart';

import 'features/auth/state/auth_controller.dart';
import 'features/notifications/data/push_notifications_service.dart';
import 'shared/widgets/notification_overlay.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Use the latest (TLHC) renderer on Android for correct tile display.
  if (Platform.isAndroid) {
    final mapsImpl = GoogleMapsFlutterPlatform.instance;
    if (mapsImpl is GoogleMapsFlutterAndroid) {
      mapsImpl.initializeWithRenderer(AndroidMapRenderer.latest);
    }
  }

  await initializePushNotifications();
  runApp(const ProviderScope(child: YolmatesApp()));
}

class YolmatesApp extends ConsumerStatefulWidget {
  const YolmatesApp({super.key});

  @override
  ConsumerState<YolmatesApp> createState() => _YolmatesAppState();
}

class _YolmatesAppState extends ConsumerState<YolmatesApp> {
  ProviderSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _authSubscription = ref.listenManual<AuthState>(
      authControllerProvider,
      (_, next) {
        if (next.status == AuthStatus.authenticated) {
          unawaited(
              ref.read(pushNotificationsServiceProvider).syncDeviceToken(ref));
        }
      },
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(
          ref.read(pushNotificationsServiceProvider).attach(context, ref));
    });
  }

  @override
  void dispose() {
    _authSubscription?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appLanguage = ref.watch(languageProvider);

    return MaterialApp.router(
      title: 'Yolmates',
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      locale: Locale(appLanguage.name),
      supportedLocales: const [
        Locale('az'),
        Locale('en'),
        Locale('ru'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: ref.watch(routerProvider),
      debugShowCheckedModeBanner: false,
      builder: (context, child) =>
          NotificationOverlay(child: child ?? const SizedBox.shrink()),
    );
  }
}
