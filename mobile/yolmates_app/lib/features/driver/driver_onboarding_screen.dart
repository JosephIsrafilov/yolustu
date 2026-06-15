import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';

/// Driver mode entry point.
///
/// Explains benefits/requirements and routes the user to add a vehicle. All
/// content is static; verification and vehicle data come later.
class DriverOnboardingScreen extends ConsumerWidget {
  const DriverOnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    
    return Scaffold(
      appBar: AppBar(title: Text(l10n.driverOnboardingTitle)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppTheme.navy, AppTheme.tealDark],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.directions_car, color: Colors.white, size: 36),
                  SizedBox(height: 16),
                  Text(
                    'Sürücü ol, qazanc əldə et',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Boş yerlərini paylaş, yol xərclərini azalt.',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(l10n.driverOnboardingBenefits, style: _h(context)),
            const SizedBox(height: 12),
            const _Bullet(
              icon: Icons.savings_outlined,
              title: 'Yol xərclərini bölüş',
              subtitle: 'Hər səyahətdə xərclərini geri qaytar.',
            ),
            const _Bullet(
              icon: Icons.schedule,
              title: 'Çevik qrafik',
              subtitle: 'İstədiyin vaxt səyahət elan et.',
            ),
            const _Bullet(
              icon: Icons.verified_user_outlined,
              title: 'Təhlükəsiz icma',
              subtitle: 'Yoxlanılmış sərnişinlərlə səyahət et.',
            ),
            const SizedBox(height: 24),
            Text(l10n.driverOnboardingRequirements, style: _h(context)),
            const SizedBox(height: 12),
            const _Bullet(
              icon: Icons.badge_outlined,
              title: 'Şəxsiyyət təsdiqi',
              subtitle: 'Şəxsiyyət vəsiqəsi və selfie tələb olunur.',
            ),
            const _Bullet(
              icon: Icons.directions_car_outlined,
              title: 'Avtomobil məlumatı',
              subtitle: 'Ən azı bir avtomobil əlavə etməlisən.',
            ),
            const SizedBox(height: 28),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: () => context.push(AppRoutes.addVehicle),
                child: Text(l10n.commonContinue),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: TextButton(
                onPressed: () => context.push(AppRoutes.driverVerification),
                child: Text(l10n.driverOnboardingCheckStatus),
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle _h(BuildContext context) => const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppTheme.navy,
      );
}

class _Bullet extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _Bullet({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.teal.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.tealDark, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: AppTheme.navy,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 13, color: AppTheme.slate500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
