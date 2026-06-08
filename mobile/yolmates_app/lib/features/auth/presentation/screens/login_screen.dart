import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController(
    text: '+994',
  );
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final authController = ref.read(authControllerProvider.notifier);
    final result = AppConfig.isMockMode
        ? await authController.sendOtp(_phoneController.text.trim())
        : await authController.login(
            phoneNumber: _phoneController.text.trim(),
            password: _passwordController.text,
          );
    if (!mounted) {
      return;
    }

    if (result is ApiSuccess<void>) {
      if (AppConfig.isMockMode) {
        context.go(
          '/auth/otp?phone=${Uri.encodeComponent(_phoneController.text.trim())}',
        );
      } else {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authControllerProvider);
    final locale = Localizations.localeOf(context).languageCode;
    final passwordLabel = switch (locale) {
      'az' => 'Şifrə',
      'ru' => 'Пароль',
      _ => 'Password',
    };
    final subtitle = AppConfig.isMockMode
        ? switch (locale) {
            'az' => 'Mock OTP axını foundation mərhələsi üçün aktivdir.',
            'ru' => 'Mock OTP-поток активен для foundation-этапа.',
            _ => 'Mock OTP flow is active for the current foundation stage.',
          }
        : switch (locale) {
            'az' =>
              'Real rejim backend `/auth/login` kontraktından istifadə edir.',
            'ru' =>
              'В real-режиме используется backend-контракт `/auth/login`.',
            _ => 'Real mode uses the backend `/auth/login` contract.',
          };
    final submitLabel = AppConfig.isMockMode
        ? l10n.continueLabel
        : switch (locale) {
            'az' => 'Daxil ol',
            'ru' => 'Войти',
            _ => 'Sign in',
          };
    final helperText = AppConfig.isMockMode
        ? 'Example: +994501234567'
        : switch (locale) {
            'az' =>
              'Demo login üçün backend seed istifadəçi telefonu və şifrəsi tələb olunur.',
            'ru' =>
              'Для demo login нужны телефон и пароль seed-пользователя backend.',
            _ => 'Demo login requires a seeded backend user phone and password.',
          };

    return Scaffold(
      appBar: AppBar(title: Text(l10n.login)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          children: <Widget>[
            AppSectionTitle(
              l10n.login,
              subtitle: subtitle,
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  AppTextField(
                    controller: _phoneController,
                    label: l10n.phoneNumber,
                    keyboardType: TextInputType.phone,
                  ),
                  if (!AppConfig.isMockMode) ...<Widget>[
                    const SizedBox(height: 12),
                    AppTextField(
                      controller: _passwordController,
                      label: passwordLabel,
                      obscureText: true,
                    ),
                  ],
                  const SizedBox(height: 12),
                  Text(helperText),
                  if (authState.errorMessage != null) ...<Widget>[
                    const SizedBox(height: 12),
                    Text(
                      authState.errorMessage!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ],
                  const SizedBox(height: 18),
                  AppButton(
                    label: submitLabel,
                    onPressed: _submit,
                    isLoading: authState.isBusy,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
