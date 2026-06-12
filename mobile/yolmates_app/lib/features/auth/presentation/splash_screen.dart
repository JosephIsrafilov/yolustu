import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../../shared/widgets/error_state.dart';
import '../state/auth_controller.dart';

/// Startup session gate.
///
/// Shows the brand while [AuthController] bootstraps the session, and a
/// retryable error if the session load fails. Redirection to login / profile
/// setup / main app is handled by the router's [redirect]; this screen only
/// covers the [AuthStatus.unknown] and [AuthStatus.error] states.
class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: state.status == AuthStatus.error
            ? ErrorStateView(
                title: 'Sessiya yüklənmədi',
                message: state.errorMessage,
                onRetry: () =>
                    ref.read(authControllerProvider.notifier).retry(),
              )
            : const _SplashBranding(),
      ),
    );
  }
}

class _SplashBranding extends StatelessWidget {
  const _SplashBranding();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppLogo(size: 96),
          const SizedBox(height: 40),
          SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation(AppTheme.teal),
            ),
          ),
        ],
      ),
    );
  }
}
