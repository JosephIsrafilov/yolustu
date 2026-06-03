import 'package:flutter/material.dart';

enum AppApiMode { mock, real }

class AppConfig {
  static const String appName = 'Yolmates';
  static const String appEnv = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'dev',
  );
  static const String _apiMode = String.fromEnvironment(
    'API_MODE',
    defaultValue: 'mock',
  );
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );
  static const Locale defaultLocale = Locale('az');

  static AppApiMode get apiMode =>
      _apiMode.toLowerCase() == 'real' ? AppApiMode.real : AppApiMode.mock;

  static bool get isMockMode => apiMode == AppApiMode.mock;
}
