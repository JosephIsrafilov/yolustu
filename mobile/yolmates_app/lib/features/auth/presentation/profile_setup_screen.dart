import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme.dart';
import '../data/app_user.dart';
import '../data/auth_repository.dart';
import '../state/auth_controller.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();

  AppLanguage _language = AppLanguage.az;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    if (user != null) {
      _firstName.text = user.firstName ?? '';
      _lastName.text = user.lastName ?? '';
      _language = user.language;
    }
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    super.dispose();
  }

  String? _required(String? value) {
    return value == null || value.trim().isEmpty
        ? ref.read(l10nProvider).profileSetupRequired
        : null;
  }

  String _previewInitials() {
    final first = _firstName.text.trim();
    final last = _lastName.text.trim();
    if (first.isEmpty && last.isEmpty) return '?';
    return '${first.isNotEmpty ? first[0] : ''}${last.isNotEmpty ? last[0] : ''}'
        .toUpperCase();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await ref.read(authControllerProvider.notifier).completeProfile(
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            role: UserRole.passenger,
            language: _language,
          );
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = ref.read(l10nProvider).profileSetupSaveError);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileSetupTitle)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(child: _AvatarPlaceholder(initials: _previewInitials())),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    l10n.profileSetupAvatarHint,
                    style: TextStyle(color: AppTheme.slate500, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 28),
                Text(l10n.profileSetupFirstName, style: _labelStyle()),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _firstName,
                  enabled: !_saving,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  validator: _required,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: l10n.profileSetupFirstNameHint,
                  ),
                ),
                const SizedBox(height: 16),
                Text(l10n.profileSetupLastName, style: _labelStyle()),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _lastName,
                  enabled: !_saving,
                  textInputAction: TextInputAction.done,
                  textCapitalization: TextCapitalization.words,
                  validator: _required,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: l10n.profileSetupLastNameHint,
                  ),
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 24),
                Text(l10n.profileLanguage, style: _labelStyle()),
                const SizedBox(height: 8),
                _LanguageSelector(
                  value: _language,
                  enabled: !_saving,
                  onChanged: (language) => setState(() => _language = language),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 18,
                        color: Colors.red.shade600,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(color: Colors.red.shade600),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _submit,
                    child: _saving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(l10n.profileSetupContinue),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  TextStyle _labelStyle() {
    return const TextStyle(fontSize: 15, fontWeight: FontWeight.w600);
  }
}

class _AvatarPlaceholder extends StatelessWidget {
  final String initials;

  const _AvatarPlaceholder({required this.initials});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 88,
      height: 88,
      decoration: BoxDecoration(
        color: AppTheme.slate50,
        shape: BoxShape.circle,
        border: Border.all(color: AppTheme.slate200, width: 2),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: AppTheme.slate500,
          ),
        ),
      ),
    );
  }
}

class _LanguageSelector extends StatelessWidget {
  final AppLanguage value;
  final bool enabled;
  final ValueChanged<AppLanguage> onChanged;

  const _LanguageSelector({
    required this.value,
    required this.enabled,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: AppLanguage.values.map((language) {
        final selected = value == language;
        final label = switch (language) {
          AppLanguage.az => 'AZ',
          AppLanguage.ru => 'RU',
          AppLanguage.en => 'EN',
        };

        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: language != AppLanguage.values.last ? 8 : 0,
            ),
            child: _ChoiceChipBox(
              label: label,
              selected: selected,
              onTap: enabled ? () => onChanged(language) : null,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _ChoiceChipBox extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;

  const _ChoiceChipBox({
    required this.label,
    required this.selected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppTheme.teal.withValues(alpha: 0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.teal : AppTheme.slate200,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: selected ? AppTheme.tealDark : AppTheme.slate700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
