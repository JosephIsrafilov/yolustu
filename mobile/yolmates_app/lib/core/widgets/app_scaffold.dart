import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
                destinations: const <NavigationDestination>[
                  NavigationDestination(
                    icon: Icon(Icons.home_outlined),
                    selectedIcon: Icon(Icons.home_rounded),
                    label: 'Home',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.search_outlined),
                    selectedIcon: Icon(Icons.search),
                    label: 'Rides',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.confirmation_num_outlined),
                    selectedIcon: Icon(Icons.confirmation_num),
                    label: 'Bookings',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.drive_eta_outlined),
                    selectedIcon: Icon(Icons.drive_eta),
                    label: 'Driver',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.settings_outlined),
                    selectedIcon: Icon(Icons.settings),
                    label: 'Settings',
                  ),
                ],
              ),
            ),
    );
  }
}
