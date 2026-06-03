import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../shared/widgets/app_list_tile.dart';
import '../../../../shared/widgets/app_section_title.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    const routes = <String>[
      'Bakı -> Gəncə',
      'Bakı -> Lənkəran',
      'Bakı -> Şəki',
      'Bakı -> Quba',
      'Bakı -> Şamaxı',
    ];

    return ListView(
      padding: const EdgeInsets.all(AppConstants.screenPadding),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              colors: <Color>[Color(0xFF0F8B8D), Color(0xFF5ED3C4)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                l10n.welcomeTitle,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Search, bookings, driver, and settings are already linked through a mobile shell.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 18),
              AppButton(
                label: l10n.searchRides,
                onPressed: () => context.go('/rides/search'),
                icon: Icons.search,
                isSecondary: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppConstants.sectionSpacing),
        const AppSectionTitle(
          'Foundation status',
          subtitle: 'Mock-first mobile base aligned to the current Yolmates web logic.',
        ),
        const SizedBox(height: 12),
        const AppCard(
          child: Column(
            children: <Widget>[
              AppListTile(title: 'Auth guard', subtitle: 'Protected routes already redirect'),
              Divider(),
              AppListTile(title: 'API mode', subtitle: 'Switch between mock and real via dart-define'),
              Divider(),
              AppListTile(title: 'Localization', subtitle: 'Azerbaijani, Russian, English prepared'),
            ],
          ),
        ),
        const SizedBox(height: AppConstants.sectionSpacing),
        AppSectionTitle(l10n.popularRoutes),
        const SizedBox(height: 12),
        ...routes.map(
          (String route) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: AppCard(
              child: AppListTile(
                title: route,
                subtitle: 'Popular mock route placeholder',
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                onTap: () => context.go('/rides/search'),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
