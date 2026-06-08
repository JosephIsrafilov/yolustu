import 'package:flutter/material.dart';

import '../models/user.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({
    required this.user,
    this.radius = 24,
    super.key,
  });

  final User user;
  final double radius;

  @override
  Widget build(BuildContext context) {
    if (user.avatarUrl != null && user.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(user.avatarUrl!),
      );
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
      child: Text(
        user.firstName.isEmpty ? '?' : user.firstName.substring(0, 1).toUpperCase(),
        style: TextStyle(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
