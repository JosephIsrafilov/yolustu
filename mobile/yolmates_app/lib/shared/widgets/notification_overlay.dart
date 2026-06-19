import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../features/notifications/notification_provider.dart';

class NotificationOverlay extends ConsumerWidget {
  final Widget child;

  const NotificationOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationProvider);

    return Stack(
      children: [
        child,
        if (notifications.isNotEmpty)
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: notifications.map((n) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Material(
                    color: Colors.transparent,
                    child: _NotificationBanner(
                      notification: n,
                      onDismiss: () =>
                          ref.read(notificationProvider.notifier).remove(n.id),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }
}

class _NotificationBanner extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onDismiss;

  const _NotificationBanner({
    required this.notification,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final isError = notification.type == AppNotificationType.error;
    final isSuccess = notification.type == AppNotificationType.success;

    final bgColor = isError
        ? Colors.red.shade50
        : (isSuccess
            ? AppTheme.tealLight.withValues(alpha: 0.1)
            : Colors.blue.shade50);
    final borderColor = isError
        ? Colors.red.shade200
        : (isSuccess ? AppTheme.teal : Colors.blue.shade200);
    final iconColor = isError
        ? Colors.red.shade700
        : (isSuccess ? AppTheme.tealDark : Colors.blue.shade700);
    final icon = isError
        ? Icons.error_outline
        : (isSuccess ? Icons.check_circle_outline : Icons.info_outline);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                notification.message,
                style: TextStyle(
                  color: AppTheme.navy,
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onDismiss,
            child: Icon(Icons.close, size: 20, color: AppTheme.slate500),
          ),
        ],
      ),
    );
  }
}
