import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants.dart';
import '../../../core/routes.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/app_logo.dart';
import '../data/auth_repository.dart';
import '../state/auth_controller.dart';

/// Azerbaijani-first phone login.
///
/// Country code +994 is fixed; the user enters the 9 national digits. On
/// success navigates to OTP verification with the full E.164 number.
class PhoneLoginScreen extends ConsumerStatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  ConsumerState<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends ConsumerState<PhoneLoginScreen> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _sending = false;
  String? _error;

  static const _dialCode = '+994';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// 9 national digits → full E.164, e.g. 501234567 → +994501234567.
  String get _fullPhone => '$_dialCode${_controller.text.trim()}';

  String? _validate(String? value) {
    final digits = (value ?? '').trim();
    if (digits.isEmpty) return 'Nömrəni daxil edin';
    if (digits.length != 9) return 'Nömrə 9 rəqəm olmalıdır';
    // AZ mobile prefixes start 4/5/7/9 (50/51/55/70/77/99/...).
    if (!RegExp(r'^[4579]\d{8}$').hasMatch(digits)) {
      return 'Düzgün operator kodu daxil edin';
    }
    return null;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _sending = true;
      _error = null;
    });

    final phone = _fullPhone;
    try {
      await ref.read(authControllerProvider.notifier).sendOtp(phone);
      if (!mounted) return;
      context.push('${AppRoutes.otp}?phone=${Uri.encodeComponent(phone)}');
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Kod göndərilə bilmədi. Yenidən cəhd edin.');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                const Center(child: AppLogo(size: 80)),
                const SizedBox(height: 40),
                Text(
                  'Daxil ol',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Telefon nömrənizi daxil edin, sizə təsdiq kodu göndərək.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 28),
                _PhoneField(
                  controller: _controller,
                  dialCode: _dialCode,
                  validator: _validate,
                  enabled: !_sending,
                  onSubmitted: (_) => _submit(),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
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
                const SizedBox(height: 28),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _sending ? null : _submit,
                    child: _sending
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : const Text('Kod göndər'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PhoneField extends StatelessWidget {
  final TextEditingController controller;
  final String dialCode;
  final String? Function(String?) validator;
  final bool enabled;
  final ValueChanged<String> onSubmitted;

  const _PhoneField({
    required this.controller,
    required this.dialCode,
    required this.validator,
    required this.enabled,
    required this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: TextInputType.phone,
      textInputAction: TextInputAction.done,
      autofillHints: const [AutofillHints.telephoneNumberNational],
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(9),
      ],
      onFieldSubmitted: onSubmitted,
      validator: validator,
      decoration: InputDecoration(
        labelText: 'Telefon nömrəsi',
        hintText: '50 123 45 67',
        prefixIcon: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '🇦🇿  $dialCode',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.navy,
                ),
              ),
              const SizedBox(width: 8),
              Container(width: 1, height: 24, color: AppTheme.slate200),
            ],
          ),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0),
      ),
    );
  }
}
