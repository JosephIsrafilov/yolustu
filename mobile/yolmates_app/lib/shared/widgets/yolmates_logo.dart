import 'package:flutter/material.dart';

class YolmatesLogo extends StatelessWidget {
  const YolmatesLogo({
    this.title = 'Yolmates',
    this.subtitle,
    this.compact = false,
    this.showWordmark = true,
    super.key,
  });

  final String title;
  final String? subtitle;
  final bool compact;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final badgeSize = compact ? 52.0 : 72.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: <Widget>[
        Image.asset(
          'assets/logo.png',
          width: badgeSize,
          height: badgeSize,
          fit: BoxFit.contain,
        ),
        if (showWordmark) ...<Widget>[
          const SizedBox(width: 14),
          Flexible(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                ),
                if (subtitle != null) ...<Widget>[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}
