import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mesajlar'),
      ),
      body: ListView.separated(
        itemCount: 5,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final hasUnread = index < 2;
          return ListTile(
            onTap: () => context.push('/chat/conv-$index'),
            leading: CircleAvatar(
              backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
              child: Text(
                'U${index + 1}',
                style: const TextStyle(
                  color: AppTheme.tealDark,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(
              'İstifadəçi ${index + 1}',
              style: TextStyle(
                fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            subtitle: Text(
              'Son mesaj məzmunu...',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                color: hasUnread ? AppTheme.navy : AppTheme.slate500,
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${index + 8}:30',
                  style: TextStyle(
                    fontSize: 12,
                    color: hasUnread ? AppTheme.teal : AppTheme.slate500,
                  ),
                ),
                if (hasUnread) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: AppTheme.teal,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
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
