import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/constants.dart';
import '../../core/theme.dart';
import '../auth/data/app_user.dart';
import '../auth/state/auth_controller.dart';
import 'package:go_router/go_router.dart';

/// App settings (mostly mock toggles).
///
/// Language reflects the persisted profile language; notification/theme rows
/// are local-only placeholders until backend preferences land.
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _pushNotifications = true;
  bool _emailNotifications = false;

  @override
  Widget build(BuildContext context) {
    final language = ref.watch(languageProvider);
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileSettings)),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          _SectionLabel(l10n.settingsGeneral),
          _Card(
            children: [
              ListTile(
                leading: const Icon(Icons.language),
                title: Text(l10n.settingsLanguageTitle),
                subtitle: Text(_getLanguageLabel(language, l10n)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _pickLanguage(context, language),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionLabel(l10n.settingsAccount),
          _Card(
            children: [
              Consumer(
                builder: (context, ref, child) {
                  final user = ref.watch(authControllerProvider).user;
                  final isDriverMode = user?.role == UserRole.driver;
                  final canBeDriver = user?.verificationStatus == 'approved';

                  return SwitchListTile.adaptive(
                    secondary: const Icon(Icons.swap_horiz),
                    title: const Text(
                        'Sürücü rejimi'), // TODO: use l10n.modeDriver later if needed
                    subtitle: canBeDriver
                        ? null
                        : const Text('Sürücü olmaq üçün təsdiqlənməlisiniz',
                            style: TextStyle(fontSize: 12)),
                    value: isDriverMode,
                    activeThumbColor: AppTheme.teal,
                    onChanged: canBeDriver
                        ? (v) async {
                            final newRole =
                                v ? UserRole.driver : UserRole.passenger;
                            // Push transition screen, let it handle the delay and update.
                            // But for now let's just do it directly if we don't have the transition screen yet.
                            // I will implement the transition screen next.
                            context.push('/mode_transition', extra: newRole);
                          }
                        : null,
                  );
                },
              ),
              const _Sep(),
              ListTile(
                leading: const Icon(Icons.lock_outline),
                title: Text(l10n.settingsSecurity),
                subtitle: Text(l10n.settingsComingSoon),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _comingSoon(context),
              ),
              const _Sep(),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined),
                title: Text(l10n.settingsPrivacy),
                subtitle: Text(l10n.settingsComingSoon),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _comingSoon(context),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionLabel(l10n.settingsNotifications),
          _Card(
            children: [
              SwitchListTile.adaptive(
                secondary: const Icon(Icons.notifications_outlined),
                title: Text(l10n.settingsPushNotifications),
                value: _pushNotifications,
                activeThumbColor: AppTheme.teal,
                onChanged: (v) => setState(() => _pushNotifications = v),
              ),
              const _Sep(),
              SwitchListTile.adaptive(
                secondary: const Icon(Icons.email_outlined),
                title: Text(l10n.settingsEmailNotifications),
                value: _emailNotifications,
                activeThumbColor: AppTheme.teal,
                onChanged: (v) => setState(() => _emailNotifications = v),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getLanguageLabel(AppLanguage lang, AppLocalizations l10n) {
    return switch (lang) {
      AppLanguage.az => l10n.settingsLanguageAz,
      AppLanguage.en => l10n.settingsLanguageEn,
      AppLanguage.ru => l10n.settingsLanguageRu,
    };
  }

  Future<void> _pickLanguage(BuildContext context, AppLanguage current) async {
    final l10n = ref.read(l10nProvider);
    final picked = await showModalBottomSheet<AppLanguage>(
      context: context,
      builder: (ctx) => SafeArea(
        child: RadioGroup<AppLanguage>(
          groupValue: current,
          onChanged: (v) => Navigator.of(ctx).pop(v),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              for (final lang in AppLanguage.values)
                RadioListTile<AppLanguage>(
                  value: lang,
                  title: Text(_getLanguageLabel(lang, l10n)),
                ),
            ],
          ),
        ),
      ),
    );
    if (picked != null && picked != current) {
      ref.read(languageProvider.notifier).setLanguage(picked);

      final user = ref.read(authControllerProvider).user;
      if (user != null) {
        await ref.read(authControllerProvider.notifier).completeProfile(
              firstName: user.firstName ?? '',
              lastName: user.lastName ?? '',
              avatarUrl: user.avatarUrl,
              role: user.role,
              language: picked,
            );
      }
    }
  }

  void _comingSoon(BuildContext context) {
    final l10n = ref.read(l10nProvider);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${l10n.settingsComingSoon}...')),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppTheme.slate500,
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }
}

class _Sep extends StatelessWidget {
  const _Sep();

  @override
  Widget build(BuildContext context) =>
      Divider(height: 1, color: AppTheme.slate100);
}
