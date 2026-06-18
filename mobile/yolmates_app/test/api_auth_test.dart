import 'package:flutter_test/flutter_test.dart';

import 'package:yolmates_app/features/auth/data/app_user.dart';
import 'package:yolmates_app/features/auth/data/auth_mode.dart';

void main() {
  group('AuthMode', () {
    test('defaults to mock', () {
      // No --dart-define means mode should stay local/demo friendly.
      expect(AuthMode.isApi, isFalse);
      expect(AuthMode.isMock, isTrue);
    });
  });

  group('User mapping logic', () {
    test('maps backend snake_case to AppUser camelCase', () {
      final backendJson = {
        'id': '550e8400-e29b-41d4-a716-446655440000',
        'phone': '+994501234567',
        'first_name': 'Murad',
        'last_name': 'Qasımov',
        'avatar_url': 'https://example.com/avatar.jpg',
        'language': 'az',
        'role': 'passenger',
      };

      final user = AppUser(
        id: backendJson['id'].toString(),
        phone: backendJson['phone'] as String,
        firstName: backendJson['first_name'],
        lastName: backendJson['last_name'],
        avatarUrl: backendJson['avatar_url'],
        role: UserRole.passenger,
        language: AppLanguage.az,
      );

      expect(user.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(user.phone, '+994501234567');
      expect(user.firstName, 'Murad');
      expect(user.lastName, 'Qasımov');
      expect(user.avatarUrl, 'https://example.com/avatar.jpg');
      expect(user.role, UserRole.passenger);
      expect(user.language, AppLanguage.az);
      expect(user.isProfileComplete, isTrue);
    });

    test('handles null optional fields safely', () {
      final backendJson = {
        'id': '123',
        'phone': '+994501234567',
        'first_name': null,
        'last_name': null,
        'avatar_url': null,
      };

      final user = AppUser(
        id: backendJson['id'].toString(),
        phone: backendJson['phone'] as String,
        firstName: backendJson['first_name'],
        lastName: backendJson['last_name'],
        avatarUrl: backendJson['avatar_url'],
        role: UserRole.passenger,
        language: AppLanguage.az,
      );

      expect(user.firstName, isNull);
      expect(user.lastName, isNull);
      expect(user.avatarUrl, isNull);
      expect(user.isProfileComplete, isFalse);
    });

    test('parses role enum from string', () {
      expect(
        UserRole.values.firstWhere((r) => r.name == 'passenger'),
        UserRole.passenger,
      );
      expect(
        UserRole.values.firstWhere((r) => r.name == 'driver'),
        UserRole.driver,
      );
    });

    test('parses language enum from string', () {
      expect(
        AppLanguage.values.firstWhere((l) => l.name == 'az'),
        AppLanguage.az,
      );
      expect(
        AppLanguage.values.firstWhere((l) => l.name == 'ru'),
        AppLanguage.ru,
      );
      expect(
        AppLanguage.values.firstWhere((l) => l.name == 'en'),
        AppLanguage.en,
      );
    });

    test('role fallback logic defaults to passenger', () {
      UserRole parseRole(String? role) {
        if (role == null) return UserRole.passenger;
        try {
          return UserRole.values.firstWhere((r) => r.name == role);
        } catch (_) {
          return UserRole.passenger;
        }
      }

      expect(parseRole('unknown'), UserRole.passenger);
      expect(parseRole(null), UserRole.passenger);
      expect(parseRole('passenger'), UserRole.passenger);
      expect(parseRole('driver'), UserRole.driver);
    });

    test('language fallback logic defaults to az', () {
      AppLanguage parseLanguage(String? language) {
        if (language == null) return AppLanguage.az;
        try {
          return AppLanguage.values.firstWhere((l) => l.name == language);
        } catch (_) {
          return AppLanguage.az;
        }
      }

      expect(parseLanguage('unknown'), AppLanguage.az);
      expect(parseLanguage(null), AppLanguage.az);
      expect(parseLanguage('az'), AppLanguage.az);
      expect(parseLanguage('ru'), AppLanguage.ru);
      expect(parseLanguage('en'), AppLanguage.en);
    });
  });
}
