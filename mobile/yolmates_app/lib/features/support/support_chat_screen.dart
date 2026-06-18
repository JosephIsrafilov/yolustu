import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';

class SupportChatScreen extends ConsumerStatefulWidget {
  const SupportChatScreen({super.key});

  @override
  ConsumerState<SupportChatScreen> createState() => _SupportChatScreenState();
}

class _SupportChatScreenState extends ConsumerState<SupportChatScreen> {
  final _controller = TextEditingController();
  final List<Map<String, dynamic>> _messages = [
    {
      'isMe': false,
      'text':
          'Salam! Mən Yolmates AI dəstək botuyam. Sizə necə kömək edə bilərəm?',
      'time': DateTime.now().subtract(const Duration(minutes: 1)),
    }
  ];

  final List<String> _suggestedQuestions = [
    'Sürücü necə ola bilərəm?',
    'Ödəniş üsulları hansılardır?',
    'Səyahətimi necə ləğv edim?',
    'Əşyamı avtomobildə unutmuşam',
  ];

  final Map<String, String> _suggestedAnswers = {
    'Sürücü necə ola bilərəm?': 'Sürücü olmaq üçün profilinizdən "Sürücü Rejimi"nə keçid edə bilərsiniz.',
    'Ödəniş üsulları hansılardır?': 'Ödənişlər hazırda nağd şəkildə və ya kartla qəbul edilir.',
    'Səyahətimi necə ləğv edim?': 'Səyahəti ləğv etmək üçün "Sifarişlər" bölməsinə daxil olun.',
    'Əşyamı avtomobildə unutmuşam': 'Narahat olmayın. Zəhmət olmasa operatorla əlaqə saxlayın, sürücü ilə əlaqə qurarıq.',
  };

  bool _operatorCalled = false;

  void _sendSuggested(String text) {
    _controller.text = text;
    _sendMessage();
  }

  void _callOperator() {
    setState(() {
      _operatorCalled = true;
      _messages.insert(0, {
        'isMe': true,
        'text': 'Operatorla əlaqə saxlanılsın',
        'time': DateTime.now(),
      });
    });
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        _messages.insert(0, {
          'isMe': false,
          'text':
              'Operator tezliklə sizinlə əlaqə saxlayacaq. Gözlədiyiniz üçün təşəkkür edirik.',
          'time': DateTime.now(),
        });
      });
    });
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.insert(0, {
        'isMe': true,
        'text': text,
        'time': DateTime.now(),
      });
      _controller.clear();
    });

    final answer = _suggestedAnswers[text] ?? 'Sualınızı başa düşmədim, lakin operator tezliklə sizinlə əlaqə saxlayacaq.';

    // Mock AI response
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        _messages.insert(0, {
          'isMe': false,
          'text': answer,
          'time': DateTime.now(),
        });
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dəstək Çatı (AI)'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              padding: const EdgeInsets.all(AppConstants.spacing16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isMe = msg['isMe'] as bool;
                final text = msg['text'] as String;

                return Align(
                  alignment:
                      isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isMe ? AppTheme.teal : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: Radius.circular(isMe ? 16 : 4),
                        bottomRight: Radius.circular(isMe ? 4 : 16),
                      ),
                      border:
                          isMe ? null : Border.all(color: AppTheme.slate200),
                    ),
                    child: Text(
                      text,
                      style: TextStyle(
                        color: isMe ? Colors.white : AppTheme.navy,
                        fontSize: 15,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (!_operatorCalled)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: AppTheme.slate50,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    ..._suggestedQuestions.map((q) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ActionChip(
                            label: Text(q,
                                style: const TextStyle(
                                    fontSize: 13, color: AppTheme.tealDark)),
                            backgroundColor: AppTheme.teal.withValues(alpha: 0.1),
                            side: BorderSide.none,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            onPressed: () => _sendSuggested(q),
                          ),
                        )),
                    ActionChip(
                      label: const Row(
                        children: [
                          Icon(Icons.headset_mic, size: 14, color: AppTheme.navy),
                          SizedBox(width: 4),
                          Text('Operator çağır',
                              style: TextStyle(
                                  fontSize: 13, color: AppTheme.navy)),
                        ],
                      ),
                      backgroundColor: AppTheme.slate200,
                      side: BorderSide.none,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      onPressed: _callOperator,
                    ),
                  ],
                ),
              ),
            ),
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: 12 + MediaQuery.of(context).padding.bottom,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppTheme.slate200)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                    decoration: InputDecoration(
                      hintText: 'Mesajınızı yazın...',
                      hintStyle: TextStyle(color: AppTheme.slate500),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: AppTheme.slate100,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: const BoxDecoration(
                    color: AppTheme.teal,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white, size: 20),
                    onPressed: _sendMessage,
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
