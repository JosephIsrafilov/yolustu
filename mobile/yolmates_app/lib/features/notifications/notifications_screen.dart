import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import 'data/notifications_controller.dart';

/// Notifications list with read/unread distinction.
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(notificationsProvider);
    await Future<void>.delayed(Duration.zero);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(notificationsProvider);
    final controller = ref.read(notificationsProvider.notifier);
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        actions: [
          if (items.any((n) => !n.read))
            TextButton(
              onPressed: controller.markAllRead,
              child: Text(l10n.notificationsMarkAllRead),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _refresh(ref),
        child: items.isEmpty
            ? EmptyState(
                icon: Icons.notifications_none,
                title: l10n.notificationsEmpty,
                message: l10n.notificationsEmptyMessage,
                actionLabel: l10n.notificationsCheckAgain,
                onAction: () => ref.invalidate(notificationsProvider),
                scrollable: true,
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: items.length,
                separatorBuilder: (_, __) =>
                    Divider(height: 1, color: AppTheme.slate100),
                itemBuilder: (context, i) {
                  final n = items[i];
                  return ListTile(
                    onTap: () {
                      controller.markRead(n.id);
                      context.push('/notifications/${n.id}');
                    },
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: n.read
                            ? AppTheme.slate100
                            : AppTheme.teal.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.notifications,
                        color: n.read ? AppTheme.slate500 : AppTheme.tealDark,
                        size: 22,
                      ),
                    ),
                    title: Text(
                      n.title,
                      style: TextStyle(
                        fontWeight: n.read ? FontWeight.w500 : FontWeight.w700,
                        color: AppTheme.navy,
                      ),
                    ),
                    subtitle: Text(
                      n.body,
                      style: const TextStyle(color: AppTheme.slate500),
                    ),
                    trailing: n.read
                        ? null
                        : Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: AppTheme.teal,
                              shape: BoxShape.circle,
                            ),
                          ),
                  );
                },
              ),
      ),
    );
  }
}
