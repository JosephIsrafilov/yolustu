import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/data/session_storage.dart';
import '../features/auth/state/auth_controller.dart';

/// Manages app theme mode (light/dark/system) with persistence.
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) {
    final storage = ref.watch(sessionStorageProvider);
    return ThemeModeNotifier(storage);
  },
);

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final SessionStorage _storage;
  static const _key = 'theme_mode';

  ThemeModeNotifier(this._storage) : super(ThemeMode.system) {
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    final modeStr = await _storage.read(_key);
    if (modeStr != null) {
      final mode = ThemeMode.values.firstWhere(
        (e) => e.name == modeStr,
        orElse: () => ThemeMode.system,
      );
      state = mode;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _storage.write(_key, mode.name);
  }
}
