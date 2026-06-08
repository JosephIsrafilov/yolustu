import 'package:flutter/material.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    required this.label,
    required this.onPressed,
    this.icon,
    this.isSecondary = false,
    this.isLoading = false,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isSecondary;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final disabled = isLoading || onPressed == null;
    final child = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (isLoading) ...<Widget>[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2.2,
              valueColor: AlwaysStoppedAnimation<Color>(
                isSecondary
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.onPrimary,
              ),
            ),
          ),
          const SizedBox(width: 10),
        ] else if (icon != null) ...<Widget>[
          Icon(icon, size: 20),
          const SizedBox(width: 8),
        ],
        Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
      ],
    );

    if (isSecondary) {
      return OutlinedButton(
        onPressed: disabled ? null : onPressed,
        child: child,
      );
    }

    return ElevatedButton(onPressed: disabled ? null : onPressed, child: child);
  }
}
