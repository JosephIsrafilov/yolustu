import 'package:flutter/material.dart';

/// Generic status badge for enums.
///
/// Displays a colored pill with label. Use with status enum extensions that
/// provide `.label` and `.colors` (bg, fg).
class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  const StatusBadge({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foregroundColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
