import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../features/auth/state/auth_controller.dart';
import '../../features/bookings/data/bookings_controller.dart';
import '../../features/chat/data/chat_controller.dart';
import '../../features/notifications/data/notifications_controller.dart';

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

  void _onDriverTap(BuildContext context, int index) {
    if (index == 0) {
      context.go(AppRoutes.home);
    } else if (index == 1) {
      context.go(AppRoutes.createRide);
    } else if (index == 2) {
      context.go(AppRoutes.messages);
    } else if (index == 3) {
      context.go(AppRoutes.wallet);
    } else if (index == 4) {
      context.go(AppRoutes.profile);
    }
  }

  int _getDriverIndex(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    if (path == AppRoutes.createRide) return 1;
    if (path.startsWith(AppRoutes.messages)) return 2;
    if (path == AppRoutes.wallet) return 3;
    if (path.startsWith(AppRoutes.profile)) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final unreadChatCount = ref.watch(unreadChatCountProvider);
    final unreadNotificationCount = ref.watch(unreadNotificationCountProvider);
    final activeBookingsCount = ref.watch(activeBookingsCountProvider);
    final isDriverMode = ref.watch(driverModeProvider);

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: isDriverMode
          ? BottomNavigationBar(
              currentIndex: _getDriverIndex(context),
              onTap: (index) => _onDriverTap(context, index),
              selectedItemColor: AppTheme.teal,
              unselectedItemColor: AppTheme.slate500,
              type: BottomNavigationBarType.fixed,
              backgroundColor: Colors.white,
              selectedFontSize: 12,
              unselectedFontSize: 12,
              items: [
                BottomNavigationBarItem(
                  icon: const Icon(Icons.dashboard_outlined),
                  activeIcon: const Icon(Icons.dashboard),
                  label: l10n.navDriverPanel,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.add_circle_outline),
                  activeIcon: const Icon(Icons.add_circle),
                  label: l10n.driverPanelCreateRide,
                ),
                BottomNavigationBarItem(
                  icon: _NavBadgeIcon(
                    icon: Icons.chat_bubble_outline,
                    count: unreadChatCount,
                  ),
                  activeIcon: _NavBadgeIcon(
                    icon: Icons.chat_bubble,
                    count: unreadChatCount,
                  ),
                  label: l10n.navChat,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.account_balance_wallet_outlined),
                  activeIcon: const Icon(Icons.account_balance_wallet),
                  label: l10n.driverWalletTitle,
                ),
                BottomNavigationBarItem(
                  icon: _NavBadgeIcon(
                    icon: Icons.person_outline,
                    count: unreadNotificationCount,
                  ),
                  activeIcon: _NavBadgeIcon(
                    icon: Icons.person,
                    count: unreadNotificationCount,
                  ),
                  label: l10n.navProfile,
                ),
              ],
            )
          : BottomNavigationBar(
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
                  label: l10n.navHome,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.search_outlined),
                  activeIcon: const Icon(Icons.search),
                  label: l10n.navSearch,
                ),
                BottomNavigationBarItem(
                  icon: _NavBadgeIcon(
                    icon: Icons.confirmation_number_outlined,
                    count: activeBookingsCount,
                  ),
                  activeIcon: _NavBadgeIcon(
                    icon: Icons.confirmation_number,
                    count: activeBookingsCount,
                  ),
                  label: l10n.navTrips,
                ),
                BottomNavigationBarItem(
                  icon: _NavBadgeIcon(
                    icon: Icons.chat_bubble_outline,
                    count: unreadChatCount,
                  ),
                  activeIcon: _NavBadgeIcon(
                    icon: Icons.chat_bubble,
                    count: unreadChatCount,
                  ),
                  label: l10n.navChat,
                ),
                BottomNavigationBarItem(
                  icon: _NavBadgeIcon(
                    icon: Icons.person_outline,
                    count: unreadNotificationCount,
                  ),
                  activeIcon: _NavBadgeIcon(
                    icon: Icons.person,
                    count: unreadNotificationCount,
                  ),
                  label: l10n.navProfile,
                ),
              ],
            ),
    );
  }
}

class _NavBadgeIcon extends StatelessWidget {
  final IconData icon;
  final int count;

  const _NavBadgeIcon({required this.icon, required this.count});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (count > 0)
          Positioned(
            right: -8,
            top: -6,
            child: Container(
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              padding: const EdgeInsets.symmetric(horizontal: 4),
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
