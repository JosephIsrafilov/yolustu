import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/localization/app_localizations.dart';
import 'package:yolmates_app/features/auth/data/app_user.dart';
import 'dart:convert';
import 'dart:io';

void main() {
  test('az/en/ru strings are available for common labels', () {
    final az = AppLocalizations(AppLanguage.az);
    final en = AppLocalizations(AppLanguage.en);
    final ru = AppLocalizations(AppLanguage.ru);

    expect(az.commonAll, 'Bütün');
    expect(en.commonAll, 'All');
    expect(ru.commonAll, 'Все');
    expect(az.walletMockBanner, 'Demo rejimi — ödənişlər hələ qoşulmayıb.');
    expect(en.walletMockBanner, 'Demo mode — payments not yet connected.');
    expect(ru.walletMockBanner, 'Демо-режим — платежи ещё не подключены.');
  });

  test('localization source has no recoverable mojibake left', () {
    final file = File('lib/core/localization/app_localizations.dart');
    final text = file.readAsStringSync(encoding: utf8);
    final regex = RegExp(r"'([^'\\]*(?:\\.[^'\\]*)*)'", dotAll: true);

    for (final match in regex.allMatches(text)) {
      final value = match.group(1)!;
      expect(value.runes.any((r) => r >= 0x80 && r <= 0x9F), isFalse);
    }

    expect(text.contains('Гј'), isFalse);
    expect(text.contains('Р’С'), isFalse);
    expect(text.contains('вЂ”'), isFalse);
    expect(AppLocalizations(AppLanguage.en).addVehicleYearRange(2000, 2020),
        'Between 2000-2020');
  });
}
