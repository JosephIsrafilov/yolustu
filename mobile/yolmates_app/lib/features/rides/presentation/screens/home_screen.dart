import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../shared/widgets/app_list_tile.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../../../../shared/widgets/yolmates_logo.dart';

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
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const YolmatesLogo(
                title: 'Yolmates',
                subtitle: 'Yol yoldasi tap',
                compact: true,
              ),
              const SizedBox(height: 20),
              Text(
                l10n.welcomeTitle,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 10),
              Text(
                'Search rides, manage bookings, and publish trips from one clean mobile flow.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 18),
              AppButton(
                label: l10n.searchRides,
                onPressed: () => context.go('/rides/search'),
                icon: Icons.search,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppConstants.sectionSpacing),
        const AppSectionTitle(
          'What is ready',
          subtitle: 'Core mobile MVP pieces already work across auth, rides, and driver flow.',
        ),
        const SizedBox(height: 12),
        const AppCard(
          child: Column(
            children: <Widget>[
              AppListTile(title: 'Auth guard', subtitle: 'Protected routes redirect unauthenticated users safely'),
              Divider(),
              AppListTile(title: 'API mode', subtitle: 'Switch between mock and real via dart-define'),
              Divider(),
              AppListTile(title: 'Session restore', subtitle: 'Saved auth state returns on app restart'),
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
                subtitle: 'Fast entry to seeded intercity routes',
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
