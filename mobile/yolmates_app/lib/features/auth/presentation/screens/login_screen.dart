import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final result = await ref
        .read(authControllerProvider.notifier)
        .sendOtp(_phoneController.text.trim());
    if (!mounted) {
      return;
    }

    if (result is ApiSuccess<void>) {
      context.go('/auth/otp?phone=${Uri.encodeComponent(_phoneController.text.trim())}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.login)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          children: <Widget>[
            AppSectionTitle(
              l10n.login,
              subtitle: 'Mock OTP flow is active until the backend contract is wired.',
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
                  const SizedBox(height: 12),
                  const Text('Example: +994501234567'),
                  if (authState.errorMessage != null) ...<Widget>[
                    const SizedBox(height: 12),
                    Text(
                      authState.errorMessage!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ],
                  const SizedBox(height: 18),
                  AppButton(
                    label: l10n.continueLabel,
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
