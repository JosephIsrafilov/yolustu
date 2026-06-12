import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Reusable error / offline state with a retry action.
///
/// Set [isOffline] for server-unavailable / connectivity styling.
class ErrorStateView extends StatelessWidget {
  final String title;
  final String? message;
  final VoidCallback? onRetry;
  final String retryLabel;
  final bool isOffline;

  const ErrorStateView({
    super.key,
    required this.title,
    this.message,
    this.onRetry,
    this.retryLabel = 'Yenidən cəhd et',
    this.isOffline = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isOffline ? AppTheme.slate500 : Colors.red.shade600;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isOffline ? Icons.cloud_off_outlined : Icons.error_outline,
                size: 36,
                color: color,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.navy,
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppTheme.slate500),
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 20),
                label: Text(retryLabel),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
