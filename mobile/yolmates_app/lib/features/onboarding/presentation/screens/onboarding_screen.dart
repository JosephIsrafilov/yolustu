import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../shared/widgets/yolmates_logo.dart';

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
                const AppCard(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: YolmatesLogo(
                      title: 'Yolmates',
                      subtitle: 'Yol yoldasi tap',
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  l10n.welcomeTitle,
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: 12),
                Text(
                  l10n.welcomeBody,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 20),
                const AppCard(
                  child: Column(
                    children: <Widget>[
                      _ValueRow(
                        icon: Icons.route_outlined,
                        title: 'Real rides',
                        subtitle: 'Search routes, dates, seats, and live backend results.',
                      ),
                      Divider(),
                      _ValueRow(
                        icon: Icons.verified_user_outlined,
                        title: 'Saved session',
                        subtitle: 'Login state restores safely after app restart.',
                      ),
                      Divider(),
                      _ValueRow(
                        icon: Icons.directions_car_outlined,
                        title: 'Driver tools',
                        subtitle: 'Create rides and manage trip activity from mobile.',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                AppButton(
                  label: l10n.login,
                  onPressed: () => context.go('/auth/login'),
                  icon: Icons.login_rounded,
                ),
                const SizedBox(height: 12),
                AppButton(
                  label: l10n.continueLabel,
                  isSecondary: true,
                  onPressed: () => context.go('/home'),
                  icon: Icons.arrow_forward_rounded,
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

class _ValueRow extends StatelessWidget {
  const _ValueRow({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: Theme.of(context).colorScheme.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(subtitle),
            ],
          ),
        ),
      ],
    );
  }
}
