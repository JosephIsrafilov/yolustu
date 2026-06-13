import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../../features/auth/data/app_user.dart';
import '../../features/auth/state/auth_controller.dart';

/// Bottom-navigation shell for the authenticated main app.
///
/// Wraps the five primary branches (home / search / bookings / messages /
/// profile) of a [StatefulShellRoute]. Auth screens render outside this shell
/// so they never show the bottom bar.
class MainShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({required this.navigationShell, super.key});

  void _onTap(WidgetRef ref, int index) {
    navigationShell.goBranch(
      index,
      // Re-tapping the active tab pops to that branch's root.
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userState = ref.watch(authControllerProvider);
    final user = userState.user;
    final isDriver = user?.role == UserRole.driver;
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => _onTap(ref, index),
        selectedItemColor: AppTheme.teal,
        unselectedItemColor: AppTheme.slate500,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            label: l10n.navSearch, // Assuming Home translates to something or we can use a hardcoded 'Ana səhifə' if missing, let's use 'Ana səhifə' 
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.search_outlined),
            activeIcon: const Icon(Icons.search),
            label: l10n.navSearch,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.confirmation_number_outlined),
            activeIcon: const Icon(Icons.confirmation_number),
            label: l10n.navTrips,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.chat_bubble_outline),
            activeIcon: const Icon(Icons.chat_bubble),
            label: l10n.navChat,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: l10n.navProfile,
          ),
        ],
      ),
    );
  }
}
