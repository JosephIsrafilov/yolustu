import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants.dart';
import '../../../core/theme.dart';
import '../data/auth_repository.dart';
import '../state/auth_controller.dart';

/// OTP verification.
///
/// Verifies the 6-digit code for [phone]. The router redirect carries the user
/// to profile setup or the main app once [AuthController] state advances; this
/// screen only owns the loading/error of the verify call plus the resend timer.
class OtpVerifyScreen extends ConsumerStatefulWidget {
  final String phone;

  const OtpVerifyScreen({required this.phone, super.key});

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  bool _verifying = false;
  bool _resending = false;
  String? _error;

  static const _codeLength = 6;
  static const _resendSeconds = 30;
  int _secondsLeft = _resendSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = _resendSeconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 1) {
        t.cancel();
        if (mounted) setState(() => _secondsLeft = 0);
      } else {
        if (mounted) setState(() => _secondsLeft--);
      }
    });
  }

  Future<void> _verify() async {
    FocusScope.of(context).unfocus();
    final code = _controller.text.trim();
    if (code.length != _codeLength) {
      setState(() => _error = 'Kod $_codeLength rəqəm olmalıdır');
      return;
    }

    setState(() {
      _verifying = true;
      _error = null;
    });

    try {
      // On success the controller advances auth state; the router redirect
      // moves us to profile setup or the main app automatically.
      await ref
          .read(authControllerProvider.notifier)
          .verifyOtp(widget.phone, code);
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Təsdiq alınmadı. Yenidən cəhd edin.');
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    if (_secondsLeft > 0 || _resending) return;
    setState(() {
      _resending = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).sendOtp(widget.phone);
      _startTimer();
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Kod yenidən göndərilə bilmədi.');
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              Text(
                'Kodu təsdiqləyin',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text.rich(
                TextSpan(
                  style: Theme.of(context).textTheme.bodyMedium,
                  children: [
                    const TextSpan(text: 'Kod bu nömrəyə göndərildi: '),
                    TextSpan(
                      text: widget.phone,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.navy,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              _OtpField(
                controller: _controller,
                focusNode: _focusNode,
                length: _codeLength,
                enabled: !_verifying,
                onCompleted: (_) => _verify(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.error_outline,
                        size: 18, color: Colors.red.shade600),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(color: Colors.red.shade600),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 28),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _verifying ? null : _verify,
                  child: _verifying
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        )
                      : const Text('Təsdiqlə'),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: _secondsLeft > 0
                    ? Text(
                        'Kodu yenidən göndər ($_secondsLeft s)',
                        style: TextStyle(color: AppTheme.slate500),
                      )
                    : TextButton(
                        onPressed: _resending ? null : _resend,
                        child: _resending
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Kodu yenidən göndər'),
                      ),
              ),
              Center(
                child: TextButton(
                  onPressed: _verifying ? null : () => context.pop(),
                  child: const Text('Nömrəni dəyiş'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OtpField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final int length;
  final bool enabled;
  final ValueChanged<String> onCompleted;

  const _OtpField({
    required this.controller,
    required this.focusNode,
    required this.length,
    required this.enabled,
    required this.onCompleted,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      enabled: enabled,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.center,
      maxLength: length,
      autofillHints: const [AutofillHints.oneTimeCode],
      style: const TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        letterSpacing: 12,
        color: AppTheme.navy,
      ),
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(length),
      ],
      onChanged: (v) {
        if (v.length == length) onCompleted(v);
      },
      decoration: const InputDecoration(
        counterText: '',
        hintText: '••••••',
        hintStyle: TextStyle(letterSpacing: 12, color: AppTheme.slate200),
      ),
    );
  }
}
