import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import 'data/chat_controller.dart';

/// Messages tab: conversation list, or an empty state when there are none.
class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversations = ref.watch(conversationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mesajlar')),
      body: conversations.isEmpty
          ? const EmptyState(
              icon: Icons.chat_bubble_outline,
              title: 'Mesaj yoxdur',
              message:
                  'Rezerv etdikdən sonra sürücü ilə burada yazışa biləcəksiniz.',
            )
          : ListView.separated(
              itemCount: conversations.length,
              separatorBuilder: (_, __) =>
                  Divider(height: 1, color: AppTheme.slate100),
              itemBuilder: (context, index) {
                final c = conversations[index];
                final hasUnread = c.unread > 0;
                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  onTap: () => context.push('/messages/${c.id}'),
                  leading: CircleAvatar(
                    radius: 24,
                    backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                    child: Text(
                      c.name[0],
                      style: const TextStyle(
                        color: AppTheme.tealDark,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    c.name,
                    style: TextStyle(
                      fontWeight: hasUnread ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    c.lastMessage,
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
                        c.time,
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
                            '${c.unread}',
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
            ),
    );
  }
}
