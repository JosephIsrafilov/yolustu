import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/routes.dart';
import '../../../core/theme.dart';
import '../data/auth_repository.dart';
import '../state/auth_controller.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _sending = false;
  String? _error;
  bool _obscurePassword = true;
  String? _selectedAvatarPath;
  final _picker = ImagePicker();

  static const _dialCode = '+994';

  Future<void> _pickAvatar() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _selectedAvatarPath = pickedFile.path);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String get _fullPhone => '$_dialCode${_phoneController.text.trim()}';

  String? _validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      final l10n = ref.read(l10nProvider);
      return l10n.registerNameRequired;
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      final l10n = ref.read(l10nProvider);
      return l10n.registerEmailRequired;
    }
    if (!RegExp(r'^[\w\.-]+@[\w\.-]+\.\w+$').hasMatch(value)) {
      final l10n = ref.read(l10nProvider);
      return l10n.registerEmailInvalid;
    }
    return null;
  }

  String? _validatePhone(String? value) {
    final l10n = ref.read(l10nProvider);
    final digits = (value ?? '').trim();
    if (digits.isEmpty) return l10n.phoneLoginPhoneRequired;
    if (digits.length != 9) return l10n.phoneLoginPhoneLength;
    if (!RegExp(r'^[4579]\d{8}$').hasMatch(digits)) {
      return l10n.phoneLoginPhoneOperator;
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      final l10n = ref.read(l10nProvider);
      return l10n.registerPasswordRequired;
    }
    if (value.length < 8) {
      final l10n = ref.read(l10nProvider);
      return l10n.registerPasswordLength;
    }
    return null;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _sending = true;
      _error = null;
    });

    final phone = _fullPhone;
    final password = _passwordController.text;
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();

    final emailText = _emailController.text.trim();
    final email = emailText;

    try {
      await ref.read(authControllerProvider.notifier).registerWithPassword(
            phone: phone,
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
          );

      if (!mounted) return;
      await ref.read(authControllerProvider.notifier).sendOtp(phone);
      if (!mounted) return;
      var route =
          '${AppRoutes.otp}?channel=sms&target=${Uri.encodeComponent(phone)}';
      if (_selectedAvatarPath != null) {
        route += '&avatar=${Uri.encodeComponent(_selectedAvatarPath!)}';
      }
      context.push(route);
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = ref.read(l10nProvider).phoneLoginSendFailed);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.registerTitle),
        elevation: 0,
        backgroundColor: AppTheme.slate50,
      ),
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
                    onTap: _sending ? null : _pickAvatar,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: AppTheme.slate200,
                          backgroundImage: _selectedAvatarPath != null
                              ? FileImage(File(_selectedAvatarPath!))
                              : null,
                          child: _selectedAvatarPath == null
                              ? const Icon(Icons.person,
                                  size: 50, color: AppTheme.slate500)
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: AppTheme.teal,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt,
                                color: Colors.white, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // First Name
                TextFormField(
                  controller: _firstNameController,
                  enabled: !_sending,
                  textInputAction: TextInputAction.next,
                  validator: _validateName,
                  decoration: InputDecoration(
                    labelText: 'Ad',
                    hintText: 'Adınız',
                  ),
                ),
                const SizedBox(height: 16),

                // Last Name
                TextFormField(
                  controller: _lastNameController,
                  enabled: !_sending,
                  textInputAction: TextInputAction.next,
                  validator: _validateName,
                  decoration: InputDecoration(
                    labelText: 'Soyad',
                    hintText: 'Soyadınız',
                  ),
                ),
                const SizedBox(height: 16),

                // Phone
                _PhoneField(
                  controller: _phoneController,
                  dialCode: _dialCode,
                  validator: _validatePhone,
                  enabled: !_sending,
                  labelText: l10n.phoneLabel,
                ),
                const SizedBox(height: 16),

                // Email
                TextFormField(
                  controller: _emailController,
                  enabled: !_sending,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: _validateEmail,
                  decoration: InputDecoration(
                    labelText: l10n.emailLabel,
                    hintText: 'yolmates@example.com',
                  ),
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  enabled: !_sending,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  validator: _validatePassword,
                  decoration: InputDecoration(
                    labelText: l10n.passwordLabel,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                        color: AppTheme.slate500,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  enabled: !_sending,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  validator: _validatePassword,
                  decoration: const InputDecoration(
                    labelText: 'Confirm password',
                  ),
                ),

                if (_error != null) ...[
                  const SizedBox(height: 12),
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
                        : Text(l10n.registerLink),
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
  final String labelText;
  final String? Function(String?) validator;
  final bool enabled;

  const _PhoneField({
    required this.controller,
    required this.dialCode,
    required this.labelText,
    required this.validator,
    required this.enabled,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: TextInputType.phone,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.telephoneNumberNational],
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(9),
      ],
      validator: validator,
      decoration: InputDecoration(
        labelText: labelText,
        hintText: '50 123 45 67',
        prefixIcon: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                dialCode,
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
