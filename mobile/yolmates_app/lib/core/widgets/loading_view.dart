import 'package:flutter/material.dart';

class LoadingView extends StatelessWidget {
  const LoadingView({
    this.label,
    this.compact = false,
    super.key,
  });

  final String? label;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            SizedBox(
              width: compact ? 24 : 34,
              height: compact ? 24 : 34,
              child: const CircularProgressIndicator(strokeWidth: 3),
            ),
            if (label != null) ...<Widget>[
              const SizedBox(height: 14),
              Text(
                label!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
