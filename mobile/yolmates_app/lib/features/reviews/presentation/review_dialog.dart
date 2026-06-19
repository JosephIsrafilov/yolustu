import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme.dart';
import '../../notifications/notification_provider.dart';
import '../data/reviews_repository.dart';

class ReviewDialog extends ConsumerStatefulWidget {
  final String targetId;
  final String rideId;
  final String targetName;

  const ReviewDialog({
    required this.targetId,
    required this.rideId,
    required this.targetName,
    super.key,
  });

  static Future<void> show(
    BuildContext context, {
    required String targetId,
    required String rideId,
    required String targetName,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => ReviewDialog(
        targetId: targetId,
        rideId: rideId,
        targetName: targetName,
      ),
    );
  }

  @override
  ConsumerState<ReviewDialog> createState() => _ReviewDialogState();
}

class _ReviewDialogState extends ConsumerState<ReviewDialog> {
  int _rating = 5;
  final _commentController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await ref.read(reviewsRepositoryProvider).submitReview(
            targetId: widget.targetId,
            rideId: widget.rideId,
            rating: _rating,
            comment: _commentController.text.trim().isNotEmpty
                ? _commentController.text.trim()
                : null,
          );
      if (mounted) {
        Navigator.of(context).pop();
        ref
            .read(notificationProvider.notifier)
            .showSuccess('Review submitted successfully. Thank you!');
      }
    } catch (e) {
      if (mounted) {
        setState(
            () => _error = e.toString().replaceAll('Exception:', '').trim());
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        'Leave a review for ${widget.targetName}',
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppTheme.navy,
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Rate the trip:',
              style: TextStyle(fontSize: 14, color: AppTheme.slate700),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starValue = index + 1;
                return IconButton(
                  icon: Icon(
                    starValue <= _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 36,
                  ),
                  onPressed: _submitting
                      ? null
                      : () => setState(() => _rating = starValue),
                );
              }),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _commentController,
              enabled: !_submitting,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Optional comment',
                border: OutlineInputBorder(),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(color: Colors.red.shade600, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.teal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(Colors.white),
                  ),
                )
              : const Text('Submit'),
        ),
      ],
    );
  }
}
