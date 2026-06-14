import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Standard card container used across the app.
///
/// Encapsulates common card styling: white background (dark: slate-800),
/// 16px border radius, slate200 border, no elevation.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const AppCard({
    required this.child,
    this.padding,
    this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF334155) : AppTheme.slate200;

    final container = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: child,
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: container,
      );
    }

    return container;
  }
}
