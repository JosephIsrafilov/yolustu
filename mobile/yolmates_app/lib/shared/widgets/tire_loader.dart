import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme.dart';

class TireLoader extends StatefulWidget {
  final double size;

  const TireLoader({super.key, this.size = 120});

  @override
  State<TireLoader> createState() => _TireLoaderState();
}

class _TireLoaderState extends State<TireLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final width = widget.size;
    final height = widget.size * 0.6;

    return SizedBox(
      width: width,
      height: height,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final t = _controller.value;
          final bounce = math.sin(t * math.pi * 2) * 2;
          return CustomPaint(
            painter: _TireLoaderPainter(
              rotation: t * math.pi * 2,
              bounce: bounce,
            ),
          );
        },
      ),
    );
  }
}

class _TireLoaderPainter extends CustomPainter {
  final double rotation;
  final double bounce;

  const _TireLoaderPainter({
    required this.rotation,
    required this.bounce,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.56 + bounce);
    final tireRadius = size.width * 0.16;

    final shadowPaint = Paint()..color = AppTheme.navy.withValues(alpha: 0.15);
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width / 2, size.height * 0.84),
        width: tireRadius * 1.8,
        height: tireRadius * 0.28,
      ),
      shadowPaint,
    );

    final roadPaint = Paint()
      ..color = AppTheme.slate200
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    final dashWidth = size.width * 0.05;
    final gap = dashWidth * 0.7;
    var start = -((rotation * 18) % (dashWidth + gap));
    while (start < size.width) {
      canvas.drawLine(
        Offset(start, size.height * 0.84),
        Offset(start + dashWidth, size.height * 0.84),
        roadPaint,
      );
      start += dashWidth + gap;
    }

    final smoke = [
      (tireRadius * 1.0, 0.30, AppTheme.tealLight),
      (tireRadius * 1.25, 0.22, AppTheme.teal),
      (tireRadius * 1.5, 0.16, Colors.white),
    ];
    for (var i = 0; i < smoke.length; i++) {
      final (radius, alpha, color) = smoke[i];
      final drift = ((rotation / (math.pi * 2)) + i * 0.2) % 1;
      canvas.drawCircle(
        Offset(
          center.dx - tireRadius * 1.5 - drift * tireRadius,
          center.dy + tireRadius * 0.8 - drift * tireRadius * 0.7,
        ),
        radius * (0.22 + drift * 0.1),
        Paint()..color = color.withValues(alpha: alpha),
      );
    }

    final tirePaint = Paint()..color = AppTheme.navy;
    canvas.drawCircle(center, tireRadius, tirePaint);

    final treadPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    canvas.drawCircle(center, tireRadius - 1.5, treadPaint);
    canvas.drawCircle(center, tireRadius - 4.5, treadPaint);

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(rotation);

    final hubOuterPaint = Paint()..color = AppTheme.tealDark;
    final hubInnerPaint = Paint()..color = AppTheme.teal;
    canvas.drawCircle(Offset.zero, tireRadius * 0.6, hubOuterPaint);
    canvas.drawCircle(Offset.zero, tireRadius * 0.48, hubInnerPaint);

    final spokePaint = Paint()
      ..color = AppTheme.tealLight
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 5; i++) {
      final angle = i * (math.pi * 2 / 5);
      canvas.drawLine(
        Offset.zero,
        Offset(math.cos(angle), math.sin(angle)) * tireRadius * 0.48,
        spokePaint,
      );
    }

    canvas.drawCircle(
        Offset.zero, tireRadius * 0.12, Paint()..color = AppTheme.navy);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _TireLoaderPainter oldDelegate) {
    return oldDelegate.rotation != rotation || oldDelegate.bounce != bounce;
  }
}
