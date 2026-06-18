import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants.dart';
import '../../../core/routes.dart';
import '../../../core/theme.dart';
import '../data/auth_repository.dart';
import '../state/auth_controller.dart';

class PasswordResetScreen extends ConsumerStatefulWidget {
  final bool isChangePassword;

  const PasswordResetScreen({
    this.isChangePassword = false,
    super.key,
  });

  @override
  ConsumerState<PasswordResetScreen> createState() =>
      _PasswordResetScreenState();
}

class _PasswordResetScreenState extends ConsumerState<PasswordResetScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _requesting = false;
  bool _submitting = false;
  bool _otpSent = false;
  String? _error;

  static const _dialCode = '+994';

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    if (widget.isChangePassword && user != null) {
      final phone = user.phone.replaceFirst(_dialCode, '');
      _phoneController.text = phone;
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String get _fullPhone => '$_dialCode${_phoneController.text.trim()}';

  String? _validatePhone(String? value) {
    final digits = (value ?? '').trim();
    if (digits.isEmpty) return 'Phone is required';
    if (digits.length != 9) return 'Enter 9 digits';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  Future<void> _requestOtp() async {
    if ((_formKey.currentState?.validate() ?? false) == false) return;
    setState(() {
      _requesting = true;
      _error = null;
    });
    try {
      await ref
          .read(authControllerProvider.notifier)
          .requestPhonePasswordReset(_fullPhone);
      if (!mounted) return;
      setState(() => _otpSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('SMS OTP is mocked as 123456')),
      );
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  Future<void> _submit() async {
    if ((_formKey.currentState?.validate() ?? false) == false) return;
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).resetPasswordWithPhone(
            phone: _fullPhone,
            code: _codeController.text.trim(),
            newPassword: _passwordController.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully')),
      );
      if (widget.isChangePassword) {
        context.pop();
      } else {
        context.go(AppRoutes.login);
      }
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = _requesting || _submitting;
    return Scaffold(
      appBar: AppBar(
        title: Text(
            widget.isChangePassword ? 'Change Password' : 'Forgot Password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  widget.isChangePassword
                      ? 'We will send a mock SMS OTP to your phone.'
                      : 'Enter your phone number to reset the password.',
                  style: const TextStyle(color: AppTheme.slate500),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _phoneController,
                  enabled: !busy && !widget.isChangePassword,
                  keyboardType: TextInputType.phone,
                  validator: _validatePhone,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(9),
                  ],
                  decoration: const InputDecoration(
                    labelText: 'Phone',
                  ).copyWith(prefixText: '$_dialCode '),
                ),
                const SizedBox(height: 16),
                if (!_otpSent)
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: busy ? null : _requestOtp,
                      child: _requesting
                          ? const CircularProgressIndicator(strokeWidth: 2)
                          : const Text('Send OTP'),
                    ),
                  ),
                if (_otpSent) ...[
                  TextFormField(
                    controller: _codeController,
                    enabled: !busy,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    validator: (value) => (value ?? '').trim().length == 6
                        ? null
                        : 'Enter 6-digit OTP',
                    decoration: const InputDecoration(
                      labelText: 'OTP',
                      helperText: 'Mock SMS code: 123456',
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    enabled: !busy,
                    obscureText: true,
                    validator: _validatePassword,
                    decoration:
                        const InputDecoration(labelText: 'New Password'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _confirmPasswordController,
                    enabled: !busy,
                    obscureText: true,
                    validator: _validatePassword,
                    decoration:
                        const InputDecoration(labelText: 'Confirm Password'),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: busy ? null : _submit,
                      child: _submitting
                          ? const CircularProgressIndicator(strokeWidth: 2)
                          : Text(
                              widget.isChangePassword
                                  ? 'Change Password'
                                  : 'Reset Password',
                            ),
                    ),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    style: TextStyle(color: Colors.red.shade600),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
