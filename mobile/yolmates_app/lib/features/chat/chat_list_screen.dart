import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import 'data/chat_controller.dart';

/// Messages tab: conversation list.
class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider);
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.chatTitle)),
      body: conversationsAsync.when(
        data: (conversations) {
          if (conversations.isEmpty) {
            return const EmptyState(
              icon: Icons.chat_bubble_outline,
              title: 'Mesaj yoxdur', // Will translate later
              message: 'Rezerv etdikdən sonra sürücü ilə burada yazışa biləcəksiniz.',
            );
          }
          return ListView.separated(
            itemCount: conversations.length,
            separatorBuilder: (_, __) =>
                Divider(height: 1, color: AppTheme.slate100),
            itemBuilder: (context, index) {
              final c = conversations[index];
              final hasUnread = c.unreadCount > 0;
              final name = c.type == 'support' ? l10n.chatSupport : 'Chat'; // Needs better naming
              final initial = name.isNotEmpty ? name[0] : '?';
              final lastMsg = c.lastMessage?.content ?? '';
              final timeStr = c.lastMessage != null 
                  ? '${c.lastMessage!.createdAt.hour.toString().padLeft(2, '0')}:${c.lastMessage!.createdAt.minute.toString().padLeft(2, '0')}'
                  : '';
                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  onTap: () => context.push('/messages/${c.id}'),
                  leading: CircleAvatar(
                    radius: 24,
                    backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: AppTheme.tealDark,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    name,
                    style: TextStyle(
                      fontWeight: hasUnread ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    lastMsg,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight:
                          hasUnread ? FontWeight.w600 : FontWeight.normal,
                      color: hasUnread ? AppTheme.navy : AppTheme.slate500,
                    ),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        timeStr,
                        style: TextStyle(
                          fontSize: 12,
                          color: hasUnread ? AppTheme.teal : AppTheme.slate500,
                        ),
                      ),
                      if (hasUnread) ...[
                        const SizedBox(height: 4),
                        Container(
                          width: 20,
                          height: 20,
                          alignment: Alignment.center,
                          decoration: const BoxDecoration(
                            color: AppTheme.teal,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '${c.unreadCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text(l10n.commonError)),
      ),
    );
  }
}
