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

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({
    this.phoneNumber,
    super.key,
  });

  final String? phoneNumber;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final TextEditingController _otpController = TextEditingController(text: '123456');

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final result = await ref.read(authControllerProvider.notifier).verifyOtp(
      phoneNumber: widget.phoneNumber ?? '+994',
      otpCode: _otpController.text.trim(),
    );
    if (!mounted) {
      return;
    }
    if (result is ApiSuccess<void>) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.otpTitle)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          children: <Widget>[
            AppSectionTitle(
              l10n.otpTitle,
              subtitle: 'Using mock code 123456 for the current foundation stage.',
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(widget.phoneNumber ?? '', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _otpController,
                    label: 'OTP code',
                    keyboardType: TextInputType.number,
                  ),
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
                    onPressed: _verify,
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
