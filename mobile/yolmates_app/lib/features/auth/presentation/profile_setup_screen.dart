import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

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
  final _imagePicker = ImagePicker();

  AppLanguage _language = AppLanguage.az;
  bool _saving = false;
  String? _error;
  String? _avatarPath;
  DateTime? _birthDate;
  bool _termsAccepted = false;
  bool _privacyAccepted = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    if (user != null) {
      _firstName.text = user.firstName ?? '';
      _lastName.text = user.lastName ?? '';
      _language = user.language;
      _avatarPath = user.avatarUrl;
      _birthDate = user.birthDate;
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

  Future<void> _pickAvatar() async {
    final image = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      imageQuality: 82,
    );
    if (image == null || !mounted) return;
    setState(() => _avatarPath = image.path);
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(now.year - 25),
      firstDate: DateTime(1920),
      lastDate: DateTime(now.year - 18, now.month, now.day),
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final l10n = ref.read(l10nProvider);
    if (_birthDate == null) {
      setState(() => _error = l10n.profileSetupBirthDateRequired);
      return;
    }
    if (!_termsAccepted || !_privacyAccepted) {
      setState(() => _error = l10n.profileSetupTermsRequired);
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await ref.read(languageProvider.notifier).setLanguage(_language);
      await ref.read(authControllerProvider.notifier).completeProfile(
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            avatarUrl: _avatarPath,
            role: UserRole.passenger,
            language: _language,
            birthDate: _birthDate,
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
                Center(
                  child: GestureDetector(
                    onTap: _saving ? null : _pickAvatar,
                    child: _AvatarPlaceholder(
                      initials: _previewInitials(),
                      imagePath: _avatarPath,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: TextButton.icon(
                    onPressed: _saving ? null : _pickAvatar,
                    icon: const Icon(Icons.add_a_photo_outlined, size: 18),
                    label: Text(l10n.profileSetupAvatarHint),
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
                  decoration:
                      InputDecoration(hintText: l10n.profileSetupFirstNameHint),
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
                  decoration:
                      InputDecoration(hintText: l10n.profileSetupLastNameHint),
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 16),
                Text(l10n.profileSetupBirthDate, style: _labelStyle()),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _saving ? null : _pickBirthDate,
                  child: AbsorbPointer(
                    child: TextFormField(
                      readOnly: true,
                      enabled: !_saving,
                      decoration: InputDecoration(
                        hintText: l10n.profileSetupBirthDateHint,
                        suffixIcon:
                            const Icon(Icons.calendar_today_outlined, size: 20),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                      ),
                      controller: TextEditingController(
                        text: _birthDate != null
                            ? '${_birthDate!.day.toString().padLeft(2, '0')}.${_birthDate!.month.toString().padLeft(2, '0')}.${_birthDate!.year}'
                            : '',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(l10n.profileLanguage, style: _labelStyle()),
                const SizedBox(height: 8),
                _LanguageSelector(
                  value: _language,
                  enabled: !_saving,
                  onChanged: (language) async {
                    setState(() => _language = language);
                    await ref
                        .read(languageProvider.notifier)
                        .setLanguage(language);
                  },
                ),
                const SizedBox(height: 24),
                _TermsCheckbox(
                  value: _termsAccepted,
                  label: l10n.profileSetupTermsAccept,
                  onChanged: _saving
                      ? null
                      : (v) => setState(() => _termsAccepted = v ?? false),
                ),
                const SizedBox(height: 8),
                _TermsCheckbox(
                  value: _privacyAccepted,
                  label: l10n.profileSetupPrivacyAccept,
                  onChanged: _saving
                      ? null
                      : (v) => setState(() => _privacyAccepted = v ?? false),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.error_outline,
                          size: 18, color: Colors.red.shade600),
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

class _TermsCheckbox extends StatelessWidget {
  final bool value;
  final String label;
  final ValueChanged<bool?>? onChanged;

  const _TermsCheckbox({
    required this.value,
    required this.label,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Checkbox(
          value: value,
          onChanged: onChanged,
          activeColor: AppTheme.teal,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        const SizedBox(width: 4),
        Expanded(
          child: GestureDetector(
            onTap: onChanged != null ? () => onChanged!(!value) : null,
            child: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                label,
                style: const TextStyle(fontSize: 14, color: AppTheme.slate700),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AvatarPlaceholder extends StatelessWidget {
  final String initials;
  final String? imagePath;

  const _AvatarPlaceholder({required this.initials, this.imagePath});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 88,
      height: 88,
      decoration: BoxDecoration(
        color: AppTheme.slate50,
        shape: BoxShape.circle,
        border: Border.all(color: AppTheme.slate200, width: 2),
        image: imagePath != null && imagePath!.isNotEmpty
            ? DecorationImage(
                image: FileImage(File(imagePath!)), fit: BoxFit.cover)
            : null,
      ),
      child: imagePath == null || imagePath!.isEmpty
          ? Center(
              child: Text(
                initials,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.slate500,
                ),
              ),
            )
          : null,
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

  const _ChoiceChipBox(
      {required this.label, required this.selected, this.onTap});

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
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: selected ? AppTheme.tealDark : AppTheme.slate700,
            ),
          ),
        ),
      ),
    );
  }
}
