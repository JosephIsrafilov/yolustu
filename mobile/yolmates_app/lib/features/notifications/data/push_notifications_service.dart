import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/firebase_options.dart';
import '../../../core/network/providers.dart';
import '../../auth/state/auth_controller.dart' hide sessionStorageProvider;
import '../../chat/data/chat_controller.dart';
import '../../notifications/data/notifications_controller.dart';

const _lastRegisteredTokenKey = 'push:last_registered_fcm_token';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  final options = DefaultFirebaseOptions.currentPlatform;
  if (options == null) return;
  await Firebase.initializeApp(options: options);
}

final pushNotificationsServiceProvider = Provider<PushNotificationsService>(
  (ref) => PushNotificationsService(),
);

Future<void> initializePushNotifications() async {
  final options = DefaultFirebaseOptions.currentPlatform;
  if (options == null) return;

  await Firebase.initializeApp(options: options);
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
}

class PushNotificationsService {
  bool _attached = false;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _openedAppSubscription;
  StreamSubscription<String>? _tokenRefreshSubscription;

  bool get isConfigured => DefaultFirebaseOptions.currentPlatform != null;

  Future<void> attach(BuildContext context, WidgetRef ref) async {
    if (!Platform.isAndroid && !Platform.isIOS) return;
    if (!isConfigured || _attached) return;
    _attached = true;

    await _requestPermissions();

    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (!context.mounted) return;
    final router = GoRouter.of(context);
    if (initialMessage != null) {
      _handleNotification(ref, initialMessage);
      _navigateFromMessage(router, initialMessage);
    }

    _foregroundSubscription ??= FirebaseMessaging.onMessage.listen((message) {
      _handleNotification(ref, message);
    });

    _openedAppSubscription ??= FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleNotification(ref, message);
      _navigateFromMessage(router, message);
    });

    _tokenRefreshSubscription ??= FirebaseMessaging.instance.onTokenRefresh.listen((nextToken) {
      unawaited(_registerTokenIfNeeded(ref, nextToken));
    });
  }

  Future<void> syncDeviceToken(WidgetRef ref) async {
    if (!Platform.isAndroid && !Platform.isIOS) return;
    if (!isConfigured) return;
    if (ref.read(authControllerProvider).status != AuthStatus.authenticated) return;

    final messaging = FirebaseMessaging.instance;
    final token = await messaging.getToken();
    if (token == null || token.isEmpty) return;

    await _registerTokenIfNeeded(ref, token);
  }

  Future<void> _requestPermissions() async {
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
  }

  Future<void> _registerTokenIfNeeded(WidgetRef ref, String token) async {
    if (ref.read(authControllerProvider).status != AuthStatus.authenticated) return;
    final storage = ref.read(sessionStorageProvider);
    final lastToken = await storage.read(_lastRegisteredTokenKey);
    if (lastToken == token) return;

    await ref.read(apiClientProvider).dio.post(
      '/users/me/device-token',
      data: {'token': token},
    );
    await storage.write(_lastRegisteredTokenKey, token);
  }

  void _handleNotification(WidgetRef ref, RemoteMessage message) {
    final notification = message.notification;
    final title = notification?.title ?? message.data['title']?.toString() ?? 'Yolmates';
    final body = notification?.body ?? message.data['body']?.toString() ?? '';
    ref.read(notificationsProvider.notifier).addNotification(
          id: message.messageId ?? DateTime.now().microsecondsSinceEpoch.toString(),
          title: title,
          body: body,
        );
    ref.invalidate(unreadNotificationCountProvider);
  }

  void _navigateFromMessage(GoRouter router, RemoteMessage message) {
    final conversationId = message.data['conversation_id']?.toString();
    if (conversationId != null && conversationId.isNotEmpty) {
      router.push('/messages/$conversationId');
      return;
    }
    router.push('/notifications');
  }
}
