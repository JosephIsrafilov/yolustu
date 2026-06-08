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
        Container(
          width: badgeSize,
          height: badgeSize,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(compact ? 18 : 24),
            gradient: LinearGradient(
              colors: <Color>[
                colorScheme.primary,
                const Color(0xFF54D3B2),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: colorScheme.primary.withValues(alpha: 0.22),
                blurRadius: compact ? 18 : 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: <Widget>[
              Icon(
                Icons.route_rounded,
                size: compact ? 24 : 34,
                color: Colors.white,
              ),
              Positioned(
                right: compact ? 8 : 10,
                bottom: compact ? 8 : 10,
                child: Container(
                  width: compact ? 12 : 14,
                  height: compact ? 12 : 14,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
            ],
          ),
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
