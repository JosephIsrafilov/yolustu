import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../auth/data/app_user.dart';
import '../auth/state/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.profileTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push(AppRoutes.settings),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          _Header(user: user),
          const SizedBox(height: 20),
          _MenuCard(
            items: [
              _MenuItem(
                icon: Icons.account_balance_wallet_outlined,
                label: l10n.profileWallet,
                onTap: () => context.push(AppRoutes.wallet),
              ),
              _MenuItem(
                icon: Icons.confirmation_number_outlined,
                label: l10n.profileReservations,
                onTap: () => context.go(AppRoutes.bookings),
              ),
              _MenuItem(
                icon: Icons.star_outline,
                label: l10n.profileReviews,
                onTap: () => context.push(AppRoutes.reviews),
              ),
              _MenuItem(
                icon: Icons.notifications_outlined,
                label: l10n.profileNotifications,
                onTap: () => context.push(AppRoutes.notifications),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _MenuCard(
            items: [
              if (user?.verificationStatus == 'approved') ...[
                _MenuItem(
                  icon: Icons.dashboard_outlined,
                  label: l10n.profileDriverPanel,
                  onTap: () => context.push(AppRoutes.driverPanel),
                ),
              ] else if (user?.verificationStatus == 'pending') ...[
                _MenuItem(
                  icon: Icons.hourglass_empty,
                  label: l10n.profileDriverPending,
                  onTap: () => context.push(AppRoutes.driverVerification),
                ),
              ] else ...[
                _MenuItem(
                  icon: Icons.directions_car_outlined,
                  label: l10n.profileBecomeDriver,
                  onTap: () => context.push(AppRoutes.driverOnboarding),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          _MenuCard(
            items: [
              _MenuItem(
                icon: Icons.settings_outlined,
                label: l10n.profileSettingsMenu,
                onTap: () => context.push(AppRoutes.settings),
              ),
              _MenuItem(
                icon: Icons.help_outline,
                label: l10n.profileHelp,
                onTap: () => context.push(AppRoutes.support),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _MenuCard(
            items: [
              _MenuItem(
                icon: Icons.logout,
                label: l10n.profileLogoutBtn,
                danger: true,
                onTap: () => _confirmLogout(context, ref),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final l10n = ref.read(l10nProvider);
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l10n.profileLogoutConfirm,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text(
                'You will be signed out from this device.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.slate500),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade600,
                  ),
                  child: Text(l10n.profileLogoutBtn),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 52,
                child: TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: Text(l10n.commonDismiss),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true) {
      await ref.read(authControllerProvider.notifier).logout();
    }
  }
}

class _Header extends StatelessWidget {
  final AppUser? user;

  const _Header({required this.user});

  @override
  Widget build(BuildContext context) {
    final name = (user?.fullName.trim().isNotEmpty ?? false)
        ? user!.fullName
        : 'User';
    final phone = user?.phone ?? '';
    final roleLabel = user?.role == UserRole.driver ? 'Driver' : 'Passenger';
    final avatarUrl = user?.avatarUrl;
    final hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;
    final avatarImage = hasAvatar
        ? (avatarUrl.startsWith('http')
            ? NetworkImage(avatarUrl) as ImageProvider
            : FileImage(File(avatarUrl)))
        : null;

    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing24),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppTheme.teal.withValues(alpha: 0.25),
            backgroundImage: avatarImage,
            child: hasAvatar
                ? null
                : Text(
                    user?.initials ?? '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 24,
                    ),
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (phone.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    phone,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
                  ),
                ],
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.teal.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    roleLabel,
                    style: const TextStyle(
                      color: AppTheme.tealLight,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });
}

class _MenuCard extends StatelessWidget {
  final List<_MenuItem> items;

  const _MenuCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) Divider(height: 1, color: AppTheme.slate100),
            ListTile(
              leading: Icon(
                items[i].icon,
                color: items[i].danger ? Colors.red.shade600 : AppTheme.navy,
              ),
              title: Text(
                items[i].label,
                style: TextStyle(
                  color: items[i].danger ? Colors.red.shade600 : AppTheme.navy,
                  fontWeight: FontWeight.w500,
                ),
              ),
              trailing: items[i].danger
                  ? null
                  : Icon(Icons.chevron_right, color: AppTheme.slate500),
              onTap: items[i].onTap,
            ),
          ],
        ],
      ),
    );
  }
}
