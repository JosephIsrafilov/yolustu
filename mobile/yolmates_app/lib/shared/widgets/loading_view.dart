import 'package:flutter/material.dart';

import '../../core/theme.dart';
import 'tire_loader.dart';

/// Centered loading indicator with an optional message.
///
/// Drop into any screen body while async work is in flight.
class LoadingView extends StatelessWidget {
  final String? message;

  const LoadingView({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const TireLoader(size: 116),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.slate500, fontSize: 14),
            ),
          ],
        ],
      ),
    );
  }
}
