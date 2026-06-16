import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/localization/app_localizations.dart';
import 'core/routes.dart';
import 'core/theme.dart';
import 'core/theme_provider.dart';
import 'features/auth/state/auth_controller.dart';
import 'features/notifications/data/push_notifications_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
          unawaited(ref.read(pushNotificationsServiceProvider).syncDeviceToken(ref));
        }
      },
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(ref.read(pushNotificationsServiceProvider).attach(context, ref));
    });
  }

  @override
  void dispose() {
    _authSubscription?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final appLanguage = ref.watch(languageProvider);

    return MaterialApp.router(
      title: 'Yolmates',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode == ThemeMode.system ? ThemeMode.light : themeMode,
      locale: Locale(appLanguage.name),
      supportedLocales: const [
        Locale('az'),
        Locale('en'),
        Locale('ru'),
      ],
      routerConfig: ref.watch(routerProvider),
      debugShowCheckedModeBanner: false,
    );
  }
}
