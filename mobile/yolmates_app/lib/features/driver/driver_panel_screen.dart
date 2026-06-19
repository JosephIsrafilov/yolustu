import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../auth/state/auth_controller.dart';
import '../wallet/data/wallet_controller.dart';
import 'data/driver_controller.dart';

class DriverPanelScreen extends ConsumerWidget {
  const DriverPanelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final user = ref.watch(authControllerProvider).user;

    // Safety fallback (should be guarded by routes.dart anyway)
    if (user?.verificationStatus != 'approved') {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.driverPanelTitle)),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline,
                  size: 64, color: AppTheme.slate500),
              const SizedBox(height: 16),
              Text(l10n.driverPanelAccessDenied),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.pop(),
                child: Text(l10n.driverPanelGoBack),
              ),
            ],
          ),
        ),
      );
    }

    final name = (user?.fullName.trim().isNotEmpty ?? false)
        ? user!.fullName
        : l10n.commonPassenger;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.driverPanelTitle),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.navy,
        elevation: 0,
      ),
      backgroundColor: AppTheme.slate50,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Card
            Container(
              padding: const EdgeInsets.all(AppConstants.spacing24),
              decoration: BoxDecoration(
                color: AppTheme.navy,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppTheme.teal.withValues(alpha: 0.25),
                    child: Text(
                      user?.initials ?? '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${l10n.driverPanelHello}, $name',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l10n.driverPanelVerified,
                          style: const TextStyle(
                            color: AppTheme.tealLight,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Consumer(builder: (context, ref, _) {
              final walletAsync = ref.watch(walletControllerProvider);
              final requestsAsync = ref.watch(passengerRequestsProvider);

              final balance =
                  walletAsync.valueOrNull?.balance.passengerBalance ?? 0.0;
              final pendingRequests = requestsAsync.valueOrNull
                      ?.where((r) => r.status.name == 'pending')
                      .length ??
                  0;

              return Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      title: 'Cari Balans',
                      value: '${balance.toStringAsFixed(2)} AZN',
                      icon: Icons.account_balance_wallet_outlined,
                      color: AppTheme.teal,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _StatCard(
                      title: 'Aktiv sorğular',
                      value: pendingRequests.toString(),
                      icon: Icons.group_add_outlined,
                      color: pendingRequests > 0 ? Colors.red : Colors.orange,
                    ),
                  ),
                ],
              );
            }),
            const SizedBox(height: 32),

            Text(
              l10n.driverPanelQuickActions,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.navy,
              ),
            ),
            const SizedBox(height: 16),

            // Grid Actions
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.1,
              children: [
                _ActionCard(
                  title: 'Gediş yarat',
                  icon: Icons.add_circle_outline,
                  color: AppTheme.navy,
                  onTap: () => context.push(AppRoutes.createRide),
                ),
                _ActionCard(
                  title: 'Gedişlərim',
                  icon: Icons.format_list_bulleted_outlined,
                  color: AppTheme.navy,
                  onTap: () => context.push(AppRoutes.myRides),
                ),
                _ActionCard(
                  title: 'Rezerv sorğuları',
                  icon: Icons.how_to_reg_outlined,
                  color: AppTheme.navy,
                  onTap: () => context.push(AppRoutes.passengerRequests),
                ),
                _ActionCard(
                  title: 'Aktiv gediş',
                  icon: Icons.directions_car_outlined,
                  color: AppTheme.tealDark,
                  // Tapping Active Ride redirects to My Rides for now,
                  // since a specific ID is required to open Active Ride screen.
                  onTap: () => context.push(AppRoutes.myRides),
                ),
                _ActionCard(
                  title: 'Mesajlar',
                  icon: Icons.chat_bubble_outline,
                  color: AppTheme.slate500,
                  onTap: () => context.push(AppRoutes.messages),
                ),
                _ActionCard(
                  title: 'Avtomobillərim',
                  icon: Icons.directions_car,
                  color: AppTheme.slate500,
                  onTap: () => context.push('/driver/vehicles'),
                ),
                _ActionCard(
                  title: 'Reytinqlər',
                  icon: Icons.star_outline,
                  color: AppTheme.slate500,
                  onTap: () => context.push(AppRoutes.reviews),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTheme.navy,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.slate500,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.slate200),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.navy,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
