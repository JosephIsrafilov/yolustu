import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../auth/state/auth_controller.dart';
import 'data/chat_controller.dart';

class ChatDetailScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatDetailScreen({required this.conversationId, super.key});

  @override
  ConsumerState<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends ConsumerState<ChatDetailScreen> {
  final TextEditingController _controller = TextEditingController();

  void _sendMessage() {
    if (_controller.text.trim().isEmpty) return;
    
    ref.read(chatMessagesProvider(widget.conversationId).notifier)
       .sendMessage(_controller.text.trim());
       
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(chatMessagesProvider(widget.conversationId));
    final l10n = ref.watch(l10nProvider);
    final userState = ref.watch(authControllerProvider);
    final currentUserId = userState.user?.id ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.chatTitle), // In a real app we'd pass the specific user name here
        actions: [
          IconButton(
            icon: const Icon(Icons.call, color: AppTheme.tealDark),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(l10n.chatCallExternal)),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) {
                  return Center(
                    child: Text('Söhbətə başlayın', style: TextStyle(color: AppTheme.slate500)),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    final isMine = msg.senderId == currentUserId;
                    return Align(
                      alignment:
                          isMine ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.7,
                        ),
                        decoration: BoxDecoration(
                          color: isMine ? AppTheme.teal : AppTheme.slate100,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          msg.content,
                          style: TextStyle(
                            color: isMine ? Colors.white : AppTheme.navy,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, st) => Center(child: Text(l10n.commonError)),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Fotoşəkil seçimi tezliklə')),
                      );
                    },
                    icon: const Icon(Icons.attach_file, color: AppTheme.slate500),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: l10n.chatPlaceholder,
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Səs yazısı tezliklə')),
                      );
                    },
                    icon: const Icon(Icons.mic, color: AppTheme.slate500),
                  ),
                  IconButton(
                    onPressed: _sendMessage,
                    icon: const Icon(Icons.send, color: AppTheme.teal),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
