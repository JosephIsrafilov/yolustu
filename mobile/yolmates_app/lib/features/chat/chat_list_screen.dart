import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:cached_network_image/cached_network_image.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/skeleton_cards.dart';
import '../../core/network/api_exception.dart';
import '../auth/state/auth_controller.dart';
import 'data/chat_controller.dart';

/// Messages tab: conversation list.
class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _buildPreviewLabel({
    required String currentUserId,
    required String conversationName,
    required String senderId,
    required String senderName,
  }) {
    if (senderId == currentUserId) return 'You';
    if (senderName.trim().isNotEmpty) return senderName.trim();
    return conversationName;
  }

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(conversationsProvider);
    await ref.read(conversationsProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider);
    final l10n = ref.watch(l10nProvider);
    final authState = ref.watch(authControllerProvider);
    final currentUserId = authState.user?.id ?? '';
    final isDriver = ref.watch(driverModeProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.chatTitle)),
      body: conversationsAsync.when(
        loading: () => ListView.separated(
          itemCount: 5,
          separatorBuilder: (_, __) =>
              Divider(height: 1, color: AppTheme.slate100),
          itemBuilder: (_, __) => const ChatCardSkeleton(),
        ),
        error: (e, _) => ErrorStateView(
          title: l10n.commonError,
          message: e is ApiException
              ? l10n.apiErrorMessage(e.code, e.message)
              : l10n.commonError,
          onRetry: () => ref.invalidate(conversationsProvider),
        ),
        data: (conversations) {
          final body = conversations.isEmpty
              ? EmptyState(
                  icon: Icons.chat_bubble_outline,
                  title: l10n.chatEmpty,
                  message: l10n.chatEmptyMessage,
                  actionLabel: isDriver ? null : l10n.chatSearchTrips,
                  onAction:
                      isDriver ? null : () => context.go(AppRoutes.search),
                  scrollable: true,
                )
              : ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  itemCount: conversations.length,
                  separatorBuilder: (_, __) =>
                      Divider(height: 1, color: AppTheme.slate100),
                  itemBuilder: (context, index) {
                    final c = conversations[index];
                    final hasUnread = c.unreadCount > 0;
                    final otherName = c.getOtherParticipantName(currentUserId);
                    final name = c.type == 'support'
                        ? l10n.chatSupport
                        : (otherName.isNotEmpty ? otherName : l10n.chatTitle);
                    final initial =
                        name.isNotEmpty ? name[0].toUpperCase() : '?';
                    final lastMessage = c.lastMessage;
                    final lastMsg = lastMessage?.content.trim() ?? '';
                    final timeStr = _formatTime(lastMessage?.createdAt);
                    final isLastMessageMine =
                        lastMessage?.senderId == currentUserId;
                    final senderLabel = lastMessage == null
                        ? ''
                        : _buildPreviewLabel(
                            currentUserId: currentUserId,
                            conversationName: name,
                            senderId: lastMessage.senderId,
                            senderName: lastMessage.senderName,
                          );
                    final messagePreview = lastMsg.isEmpty
                        ? l10n.chatStartConversation
                        : '$senderLabel: $lastMsg';

                    final avatarUrl =
                        c.getOtherParticipantAvatar(currentUserId);

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      onTap: () => context.push('/messages/${c.id}'),
                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                        backgroundImage:
                            avatarUrl != null && avatarUrl.isNotEmpty
                                ? CachedNetworkImageProvider(avatarUrl)
                                : null,
                        child: avatarUrl == null || avatarUrl.isEmpty
                            ? Text(
                                initial,
                                style: const TextStyle(
                                  color: AppTheme.tealDark,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : null,
                      ),
                      title: Text(
                        name,
                        style: TextStyle(
                          fontWeight:
                              hasUnread ? FontWeight.bold : FontWeight.w500,
                        ),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            if (lastMessage != null && isLastMessageMine) ...[
                              Icon(
                                lastMessage.readAt != null
                                    ? Icons.done_all
                                    : Icons.check,
                                size: 15,
                                color: lastMessage.readAt != null
                                    ? AppTheme.teal
                                    : AppTheme.slate500,
                              ),
                              const SizedBox(width: 4),
                            ],
                            Expanded(
                              child: Text(
                                messagePreview,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontWeight: hasUnread && !isLastMessageMine
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                  color: hasUnread && !isLastMessageMine
                                      ? AppTheme.navy
                                      : AppTheme.slate500,
                                ),
                              ),
                            ),
                          ],
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
                              color:
                                  hasUnread ? AppTheme.teal : AppTheme.slate500,
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

          return RefreshIndicator(
            onRefresh: () => _refresh(ref),
            child: body,
          );
        },
      ),
    );
  }
}
