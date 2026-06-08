import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/language_switcher.dart';
import '../../../../shared/widgets/app_list_tile.dart';
import '../../../../shared/widgets/yolmates_logo.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../settings_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final settings = ref.watch(settingsControllerProvider);

    return ListView(
      padding: const EdgeInsets.all(AppConstants.screenPadding),
      children: <Widget>[
        const YolmatesLogo(
          title: 'Yolmates',
          subtitle: 'App preferences',
          compact: true,
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                l10n.language,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              const LanguageSwitcher(),
            ],
          ),
        ),
        const SizedBox(height: 12),
        AppCard(
          child: Column(
            children: <Widget>[
              AppListTile(
                title: 'Environment',
                subtitle: '${AppConfig.appEnv} - ${AppConfig.apiMode.name}',
              ),
              const Divider(),
              AppListTile(
                title: l10n.theme,
                subtitle:
                    settings.themeMode == ThemeMode.dark ? 'Dark' : 'Light',
                trailing: Switch(
                  value: settings.themeMode == ThemeMode.dark,
                  onChanged: (_) =>
                      ref.read(settingsControllerProvider.notifier).toggleTheme(),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        AppCard(
          child: Column(
            children: <Widget>[
              AppButton(
                label: l10n.profile,
                isSecondary: true,
                onPressed: () => context.push('/profile'),
              ),
              const SizedBox(height: 12),
              AppButton(
                label: l10n.logout,
                onPressed: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/onboarding');
                  }
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
