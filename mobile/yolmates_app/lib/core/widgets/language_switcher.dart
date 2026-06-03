import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/settings/presentation/settings_controller.dart';

class LanguageSwitcher extends ConsumerWidget {
  const LanguageSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsControllerProvider);
    final controller = ref.read(settingsControllerProvider.notifier);

    return DropdownButtonFormField<Locale>(
      initialValue: settings.locale,
      decoration: const InputDecoration(labelText: 'Language'),
      items: const <DropdownMenuItem<Locale>>[
        DropdownMenuItem<Locale>(
          value: Locale('az'),
          child: Text('Azərbaycan'),
        ),
        DropdownMenuItem<Locale>(value: Locale('ru'), child: Text('Русский')),
        DropdownMenuItem<Locale>(value: Locale('en'), child: Text('English')),
      ],
      onChanged: (Locale? value) {
        if (value != null) {
          controller.setLocale(value);
        }
      },
    );
  }
}
