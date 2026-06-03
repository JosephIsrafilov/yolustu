import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../domain/settings_state.dart';

class SettingsController extends Notifier<SettingsState> {
  @override
  SettingsState build() {
    return const SettingsState(
      locale: AppConfig.defaultLocale,
      themeMode: ThemeMode.light,
    );
  }

  void setLocale(Locale locale) {
    state = state.copyWith(locale: locale);
  }

  void toggleTheme() {
    state = state.copyWith(
      themeMode: state.themeMode == ThemeMode.light
          ? ThemeMode.dark
          : ThemeMode.light,
    );
  }
}

final settingsControllerProvider =
    NotifierProvider<SettingsController, SettingsState>(SettingsController.new);
