import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../localization/app_localizations.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({
    required this.child,
    this.currentIndex,
    this.title,
    super.key,
  });

  final Widget child;
  final int? currentIndex;
  final String? title;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: title == null
          ? null
          : AppBar(
              title: Text(title!),
              scrolledUnderElevation: 0,
            ),
      body: SafeArea(
        bottom: false,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: child,
        ),
      ),
      bottomNavigationBar: currentIndex == null
          ? null
          : SafeArea(
              top: false,
              child: NavigationBar(
                selectedIndex: currentIndex!,
                onDestinationSelected: (int index) {
                  const locations = <String>[
                    '/home',
                    '/rides/search',
                    '/bookings',
                    '/driver',
                    '/settings',
                  ];
                  context.go(locations[index]);
                },
                destinations: <NavigationDestination>[
                  NavigationDestination(
                    icon: const Icon(Icons.home_outlined),
                    selectedIcon: const Icon(Icons.home_rounded),
                    label: l10n.home,
                  ),
                  NavigationDestination(
                    icon: const Icon(Icons.search_outlined),
                    selectedIcon: const Icon(Icons.search),
                    label: l10n.searchRides,
                  ),
                  NavigationDestination(
                    icon: const Icon(Icons.confirmation_num_outlined),
                    selectedIcon: const Icon(Icons.confirmation_num),
                    label: l10n.bookings,
                  ),
                  NavigationDestination(
                    icon: const Icon(Icons.drive_eta_outlined),
                    selectedIcon: const Icon(Icons.drive_eta),
                    label: l10n.driverPanel,
                  ),
                  NavigationDestination(
                    icon: const Icon(Icons.settings_outlined),
                    selectedIcon: const Icon(Icons.settings),
                    label: l10n.settings,
                  ),
                ],
              ),
            ),
    );
  }
}
