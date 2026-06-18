import 'package:flutter/material.dart';
import '../../core/theme.dart';

/// Brand mark used across auth + splash screens.
///
/// Uses the shared `assets/logo.png` (identical to the web brand asset).
class AppLogo extends StatelessWidget {
  final double size;
  final bool showText;

  const AppLogo({super.key, this.size = 72, this.showText = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/logo.png',
          height: size,
          width: size,
          fit: BoxFit.contain,
        ),
        if (showText) ...[
          const SizedBox(height: 12),
          Text(
            'YOLMATES',
            style: TextStyle(
              color: AppTheme.tealDark,
              fontSize: size * 0.26,
              fontWeight: FontWeight.w700,
              letterSpacing: 4,
            ),
          ),
        ],
      ],
    );
  }
}
