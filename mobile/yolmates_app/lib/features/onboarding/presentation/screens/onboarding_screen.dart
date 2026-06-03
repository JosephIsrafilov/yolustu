import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.sizeOf(context).height - 40,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: 24),
                Container(
                  height: 220,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    gradient: const LinearGradient(
                      colors: <Color>[Color(0xFFB5F3EC), Color(0xFF0F8B8D)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Center(
                    child: Icon(Icons.route_rounded, size: 86, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 28),
                Text(l10n.welcomeTitle, style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 12),
                Text(l10n.welcomeBody, style: Theme.of(context).textTheme.bodyLarge),
                const SizedBox(height: 32),
                AppButton(
                  label: l10n.login,
                  onPressed: () => context.go('/auth/login'),
                ),
                const SizedBox(height: 12),
                AppButton(
                  label: l10n.continueLabel,
                  isSecondary: true,
                  onPressed: () => context.go('/home'),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
