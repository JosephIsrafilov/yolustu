import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets/app_logo.dart';
import '../state/auth_controller.dart';

class ModeTransitionScreen extends ConsumerStatefulWidget {
  final bool isDriver;

  const ModeTransitionScreen({
    super.key,
    required this.isDriver,
  });

  @override
  ConsumerState<ModeTransitionScreen> createState() =>
      _ModeTransitionScreenState();
}

class _ModeTransitionScreenState extends ConsumerState<ModeTransitionScreen> {
  @override
  void initState() {
    super.initState();
    _playAnimationAndSwitch();
  }

  Future<void> _playAnimationAndSwitch() async {
    // Artificial delay for splash effect
    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    ref.read(driverModeProvider.notifier).toggle(widget.isDriver);

    if (mounted) {
      // Return to home
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final isDriver = widget.isDriver;
    final roleText = isDriver ? l10n.modeDriver : l10n.modePassenger;

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const AppLogo(size: 100, showText: false),
            const SizedBox(height: 32),
            Text(
              roleText,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppTheme.navy,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 16),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation(AppTheme.teal),
            ),
          ],
        ),
      ),
    );
  }
}
