import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants.dart';
import '../../../core/theme.dart';
import '../data/app_user.dart';
import '../data/auth_repository.dart';
import '../state/auth_controller.dart';

/// First-time profile setup (required after first OTP success).
///
/// Collects name, language and role, then calls
/// [AuthController.completeProfile]. The router redirect carries the user into
/// the main app once auth state becomes [AuthStatus.authenticated].
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
  UserRole _role = UserRole.passenger;

  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Prefill from any partial user the mock session already holds.
    final user = ref.read(authControllerProvider).user;
    if (user != null) {
      _firstName.text = user.firstName ?? '';
      _lastName.text = user.lastName ?? '';
      _language = user.language;
      _role = user.role;
    }
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    super.dispose();
  }

  String? _required(String? v) {
    if ((v ?? '').trim().isEmpty) return 'Bu sahə tələb olunur';
    if ((v ?? '').trim().length < 2) return 'Ən azı 2 hərf';
    return null;
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
            role: _role,
            language: _language,
          );
      // Router redirect handles navigation to the main app.
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Profil yadda saxlanmadı. Yenidən cəhd edin.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil quraşdırması')),
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
                    'Şəkil əlavə et (istəyə bağlı)',
                    style: TextStyle(color: AppTheme.slate500, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 28),
                Text('Ad', style: _labelStyle(context)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _firstName,
                  enabled: !_saving,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  validator: _required,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(hintText: 'Adınız'),
                ),
                const SizedBox(height: 20),
                Text('Soyad', style: _labelStyle(context)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _lastName,
                  enabled: !_saving,
                  textInputAction: TextInputAction.done,
                  textCapitalization: TextCapitalization.words,
                  validator: _required,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(hintText: 'Soyadınız'),
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 24),
                Text('Dil', style: _labelStyle(context)),
                const SizedBox(height: 8),
                _LanguageSelector(
                  value: _language,
                  enabled: !_saving,
                  onChanged: (l) => setState(() => _language = l),
                ),
                const SizedBox(height: 24),
                Text('Rol', style: _labelStyle(context)),
                const SizedBox(height: 8),
                _RoleSelector(
                  value: _role,
                  enabled: !_saving,
                  onChanged: (r) => setState(() => _role = r),
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
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : const Text('Davam et'),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _previewInitials() {
    final f = _firstName.text.trim();
    final l = _lastName.text.trim();
    final a = f.isNotEmpty ? f[0] : '';
    final b = l.isNotEmpty ? l[0] : '';
    final out = (a + b).toUpperCase();
    return out.isEmpty ? '?' : out;
  }

  TextStyle _labelStyle(BuildContext context) => const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppTheme.navy,
      );
}

class _AvatarPlaceholder extends StatelessWidget {
  final String initials;

  const _AvatarPlaceholder({required this.initials});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CircleAvatar(
          radius: 44,
          backgroundColor: AppTheme.teal.withValues(alpha: 0.15),
          child: Text(
            initials,
            style: const TextStyle(
              color: AppTheme.tealDark,
              fontWeight: FontWeight.bold,
              fontSize: 30,
            ),
          ),
        ),
        Positioned(
          right: 0,
          bottom: 0,
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: const BoxDecoration(
              color: AppTheme.teal,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
          ),
        ),
      ],
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

  static const _labels = {
    AppLanguage.az: 'AZ',
    AppLanguage.ru: 'RU',
    AppLanguage.en: 'EN',
  };

  @override
  Widget build(BuildContext context) {
    return Row(
      children: AppLanguage.values.map((lang) {
        final selected = lang == value;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _ChoiceChipBox(
              label: _labels[lang]!,
              selected: selected,
              onTap: enabled ? () => onChanged(lang) : null,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _RoleSelector extends StatelessWidget {
  final UserRole value;
  final bool enabled;
  final ValueChanged<UserRole> onChanged;

  const _RoleSelector({
    required this.value,
    required this.enabled,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ChoiceChipBox(
            label: 'Sərnişin',
            icon: Icons.person_outline,
            selected: value == UserRole.passenger,
            onTap: enabled ? () => onChanged(UserRole.passenger) : null,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _ChoiceChipBox(
            label: 'Sürücü',
            icon: Icons.directions_car_outlined,
            selected: value == UserRole.driver,
            onTap: enabled ? () => onChanged(UserRole.driver) : null,
          ),
        ),
      ],
    );
  }
}

class _ChoiceChipBox extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final VoidCallback? onTap;

  const _ChoiceChipBox({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
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
            if (icon != null) ...[
              Icon(
                icon,
                size: 18,
                color: selected ? AppTheme.tealDark : AppTheme.slate500,
              ),
              const SizedBox(width: 6),
            ],
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
