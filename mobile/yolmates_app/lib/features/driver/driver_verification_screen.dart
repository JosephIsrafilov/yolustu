import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import 'data/vehicle.dart';

/// Driver document verification placeholder.
///
/// No real upload; shows per-document status and a disabled-style upload CTA.
class DriverVerificationScreen extends StatelessWidget {
  const DriverVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Təsdiqləmə')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.spacing16),
          children: const [
            _VerifyTile(
              icon: Icons.badge_outlined,
              title: 'Şəxsiyyət vəsiqəsi',
              subtitle: 'Ön və arxa tərəf',
              status: VerificationStatus.pending,
            ),
            SizedBox(height: 12),
            _VerifyTile(
              icon: Icons.face_outlined,
              title: 'Selfi təsdiqi',
              subtitle: 'Üz tanıma üçün',
              status: VerificationStatus.notSubmitted,
            ),
            SizedBox(height: 12),
            _VerifyTile(
              icon: Icons.directions_car_outlined,
              title: 'Sürücülük vəsiqəsi',
              subtitle: 'Etibarlı sürücülük vəsiqəsi',
              status: VerificationStatus.notSubmitted,
            ),
            SizedBox(height: 20),
            _Note(),
          ],
        ),
      ),
    );
  }
}

class _VerifyTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VerificationStatus status;

  const _VerifyTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.teal.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.tealDark),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(color: AppTheme.slate500, fontSize: 13)),
                const SizedBox(height: 8),
                _StatusChip(status: status),
              ],
            ),
          ),
          TextButton(
            onPressed: status == VerificationStatus.pending ? null : () {},
            child: const Text('Yüklə'),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final VerificationStatus status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (status) {
      VerificationStatus.approved => (
          Colors.green.shade50,
          Colors.green.shade700
        ),
      VerificationStatus.pending => (
          Colors.orange.shade50,
          Colors.orange.shade700
        ),
      VerificationStatus.rejected => (Colors.red.shade50, Colors.red.shade700),
      VerificationStatus.notSubmitted => (AppTheme.slate100, AppTheme.slate700),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(status.label,
          style:
              TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class _Note extends StatelessWidget {
  const _Note();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.slate100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 18, color: AppTheme.slate500),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Sənəd yükləmə hələ qoşulmayıb. Bu mərhələ backend inteqrasiyasından sonra aktivləşəcək.',
              style: TextStyle(fontSize: 13, color: AppTheme.slate700),
            ),
          ),
        ],
      ),
    );
  }
}
