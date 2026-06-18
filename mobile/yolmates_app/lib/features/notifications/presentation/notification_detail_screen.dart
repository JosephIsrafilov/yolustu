import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants.dart';
import '../../../core/theme.dart';
import '../data/notifications_controller.dart';

class NotificationDetailScreen extends ConsumerWidget {
  final String notificationId;

  const NotificationDetailScreen({super.key, required this.notificationId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final notification = notifications.firstWhere(
      (n) => n.id == notificationId,
      orElse: () => AppNotification(
        id: '',
        title: 'Tapılmadı',
        body: 'Bu bildiriş artıq mövcud deyil.',
        time: DateTime.now(),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildiriş Detalı'), // Could use l10n
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                notification.title,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.navy,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _formatTime(notification.time),
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.slate500,
                ),
              ),
              const SizedBox(height: 24),
              const Divider(color: AppTheme.slate200),
              const SizedBox(height: 24),
              Text(
                notification.body,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppTheme.navy,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.day.toString().padLeft(2, '0')}.${time.month.toString().padLeft(2, '0')}.${time.year} ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
