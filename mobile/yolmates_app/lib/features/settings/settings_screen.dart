import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../auth/data/app_user.dart';
import '../auth/state/auth_controller.dart';

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

  static const _languageLabels = {
    AppLanguage.az: 'Azərbaycan',
    AppLanguage.ru: 'Rus',
    AppLanguage.en: 'İngilis',
  };

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final language = user?.language ?? AppLanguage.az;

    return Scaffold(
      appBar: AppBar(title: const Text('Parametrlər')),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          _SectionLabel('Ümumi'),
          _Card(
            children: [
              ListTile(
                leading: const Icon(Icons.language),
                title: const Text('Dil'),
                subtitle: Text(_languageLabels[language]!),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _pickLanguage(context, language),
              ),
              const _Sep(),
              SwitchListTile.adaptive(
                secondary: const Icon(Icons.dark_mode_outlined),
                title: const Text('Qaranlıq rejim'),
                subtitle: const Text('Tezliklə'),
                value: false,
                activeThumbColor: AppTheme.teal,
                onChanged: null,
              ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionLabel('Bildirişlər'),
          _Card(
            children: [
              SwitchListTile.adaptive(
                secondary: const Icon(Icons.notifications_outlined),
                title: const Text('Push bildirişləri'),
                value: _pushNotifications,
                activeThumbColor: AppTheme.teal,
                onChanged: (v) => setState(() => _pushNotifications = v),
              ),
              const _Sep(),
              SwitchListTile.adaptive(
                secondary: const Icon(Icons.email_outlined),
                title: const Text('E-poçt bildirişləri'),
                value: _emailNotifications,
                activeThumbColor: AppTheme.teal,
                onChanged: (v) => setState(() => _emailNotifications = v),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _SectionLabel('Hesab'),
          _Card(
            children: [
              ListTile(
                leading: const Icon(Icons.lock_outline),
                title: const Text('Təhlükəsizlik'),
                subtitle: const Text('Tezliklə'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _comingSoon(context),
              ),
              const _Sep(),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined),
                title: const Text('Məxfilik'),
                subtitle: const Text('Tezliklə'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _comingSoon(context),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _pickLanguage(BuildContext context, AppLanguage current) async {
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
                  title: Text(_languageLabels[lang]!),
                ),
            ],
          ),
        ),
      ),
    );
    if (picked != null && picked != current) {
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
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Bu bölmə tezliklə əlçatan olacaq')),
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
