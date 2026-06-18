import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../models/user.dart';

/// Reusable driver trust card showing verification status, rating, and trip count.
class DriverTrustCard extends ConsumerWidget {
  final User driver;
  final bool showVerificationBadge;
  final bool showMessageButton;
  final VoidCallback? onMessageTap;
  final bool compact;

  const DriverTrustCard({
    required this.driver,
    this.showVerificationBadge = true,
    this.showMessageButton = false,
    this.onMessageTap,
    this.compact = false,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);

    return Container(
      padding: EdgeInsets.all(
          compact ? AppConstants.spacing12 : AppConstants.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppConstants.borderRadius16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildAvatar(),
              SizedBox(width: compact ? 12 : 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            driver.name,
                            style: TextStyle(
                              fontSize: compact ? 15 : 16,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.navy,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (showVerificationBadge) ...[
                          const SizedBox(width: 6),
                          Icon(
                            Icons.verified,
                            size: compact ? 16 : 18,
                            color: AppTheme.teal,
                          ),
                        ],
                      ],
                    ),
                    SizedBox(height: compact ? 2 : 4),
                    Row(
                      children: [
                        Icon(
                          Icons.star,
                          size: compact ? 14 : 16,
                          color: Colors.amber,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${driver.rating.toStringAsFixed(1)} · ${driver.tripCount} ${l10n.trustTripsCount}',
                          style: TextStyle(
                            fontSize: compact ? 13 : 14,
                            color: AppTheme.slate700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (showMessageButton && onMessageTap != null)
                IconButton(
                  onPressed: onMessageTap,
                  icon: const Icon(Icons.message_outlined),
                  iconSize: compact ? 20 : 24,
                  padding: const EdgeInsets.all(8),
                  constraints:
                      const BoxConstraints(minWidth: 40, minHeight: 40),
                ),
            ],
          ),
          if (showVerificationBadge && !compact) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppConstants.spacing12,
                vertical: AppConstants.spacing8,
              ),
              decoration: BoxDecoration(
                color: AppTheme.teal.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppConstants.borderRadius8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.verified_user,
                    size: 16,
                    color: AppTheme.tealDark,
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      l10n.trustDocumentsChecked,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.tealDark,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    final size = compact ? 44.0 : 56.0;
    final fontSize = compact ? 18.0 : 22.0;

    if (driver.avatarUrl != null && driver.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: size / 2,
        backgroundImage: NetworkImage(driver.avatarUrl!),
        backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
      );
    }

    return CircleAvatar(
      radius: size / 2,
      backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
      child: Text(
        driver.name.isNotEmpty ? driver.name[0].toUpperCase() : '?',
        style: TextStyle(
          color: AppTheme.tealDark,
          fontWeight: FontWeight.bold,
          fontSize: fontSize,
        ),
      ),
    );
  }
}

/// Prominent trust/safety block for trip detail screen.
class TripTrustBlock extends ConsumerWidget {
  const TripTrustBlock({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);

    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.teal.withValues(alpha: 0.1),
            AppTheme.tealLight.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(AppConstants.borderRadius16),
        border: Border.all(color: AppTheme.teal.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.teal,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.verified_user,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.trustVerifiedDriver,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.navy,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  l10n.trustSafetyNote,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.slate700,
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
