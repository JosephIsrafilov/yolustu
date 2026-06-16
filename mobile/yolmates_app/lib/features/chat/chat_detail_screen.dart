import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../auth/state/auth_controller.dart';
import 'data/chat_controller.dart';
import 'data/chat_models.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ChatDetailScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatDetailScreen({required this.conversationId, super.key});

  @override
  ConsumerState<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends ConsumerState<ChatDetailScreen> {
  final TextEditingController _controller = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  void _sendMessage() {
    if (_controller.text.trim().isEmpty) return;

    ref
        .read(chatMessagesProvider(widget.conversationId).notifier)
        .sendMessage(_controller.text.trim());

    _controller.clear();
  }

  Future<void> _pickAndUploadImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    setState(() {
      _isUploading = true;
    });
    try {
      final notifier =
          ref.read(chatMessagesProvider(widget.conversationId).notifier);
      await notifier.sendImageMessage(image.path);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Xəta: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync =
        ref.watch(chatMessagesProvider(widget.conversationId));
    final l10n = ref.watch(l10nProvider);
    final userState = ref.watch(authControllerProvider);
    final currentUserId = userState.user?.id ?? '';

    final conversations = ref.watch(conversationsProvider).valueOrNull ?? [];
    final conv = conversations.firstWhere(
      (c) => c.id == widget.conversationId,
      orElse: () => Conversation(
          id: '',
          type: 'support',
          status: 'open',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          participants: []),
    );
    final otherName =
        conv.id.isNotEmpty ? conv.getOtherParticipantName(currentUserId) : '';
    final title = conv.type == 'support'
        ? l10n.chatSupport
        : (otherName.isNotEmpty ? otherName : l10n.chatTitle);

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
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
                    child: Text('Söhbətə başlayın',
                        style: TextStyle(color: AppTheme.slate500)),
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
                        child: Column(
                          crossAxisAlignment: isMine
                              ? CrossAxisAlignment.end
                              : CrossAxisAlignment.start,
                          children: [
                            if (msg.messageType == 'photo' &&
                                msg.attachments.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: CachedNetworkImage(
                                    imageUrl: msg.attachments.first,
                                    width: 200,
                                    fit: BoxFit.cover,
                                    placeholder: (context, url) =>
                                        const SizedBox(
                                      width: 200,
                                      height: 150,
                                      child: Center(
                                          child: CircularProgressIndicator()),
                                    ),
                                    errorWidget: (context, url, error) =>
                                        const Icon(Icons.error),
                                  ),
                                ),
                              ),
                            if (msg.content.isNotEmpty)
                              Text(
                                msg.content,
                                style: TextStyle(
                                  color: isMine ? Colors.white : AppTheme.navy,
                                  fontSize: 15,
                                ),
                              ),
                          ],
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
                  _isUploading
                      ? const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : IconButton(
                          onPressed: _pickAndUploadImage,
                          icon: const Icon(Icons.attach_file,
                              color: AppTheme.slate500),
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
