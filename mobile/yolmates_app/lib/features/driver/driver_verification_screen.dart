import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../shared/widgets/status_badge.dart';
import '../auth/data/auth_mode.dart';
import '../auth/state/auth_controller.dart';
import 'data/vehicle.dart';

class DriverVerificationScreen extends ConsumerStatefulWidget {
  const DriverVerificationScreen({super.key});

  @override
  ConsumerState<DriverVerificationScreen> createState() => _DriverVerificationScreenState();
}

class _DriverVerificationScreenState extends ConsumerState<DriverVerificationScreen> {
  bool _submitting = false;

  VerificationStatus _mapStatus(String statusStr) {
    switch (statusStr.toLowerCase()) {
      case 'pending':
        return VerificationStatus.pending;
      case 'approved':
        return VerificationStatus.approved;
      case 'rejected':
        return VerificationStatus.rejected;
      default:
        return VerificationStatus.notSubmitted;
    }
  }

  Future<void> _submit(String docType) async {
    setState(() => _submitting = true);
    try {
      await ref.read(authControllerProvider.notifier).submitVerification('mock_path/$docType');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$docType təsdiq üçün göndərildi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xəta baş verdi: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _mockApprove() async {
    setState(() => _submitting = true);
    try {
      await ref.read(authControllerProvider.notifier).mockApproveDriver();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sürücü statusu təsdiqləndi (MOCK)')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xəta baş verdi: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final userStatus = user?.verificationStatus ?? 'none';
    final status = _mapStatus(userStatus);

    return Scaffold(
      appBar: AppBar(title: const Text('Təsdiqləmə')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.spacing16),
          children: [
            if (_submitting)
              const LinearProgressIndicator(color: AppTheme.teal),
            const SizedBox(height: 12),
            _VerifyTile(
              icon: Icons.badge_outlined,
              title: 'Şəxsiyyət vəsiqəsi',
              subtitle: 'Ön və arxa tərəf',
              status: status,
              onUpload: () => _submit('Şəxsiyyət vəsiqəsi'),
            ),
            const SizedBox(height: 12),
            _VerifyTile(
              icon: Icons.face_outlined,
              title: 'Selfi təsdiqi',
              subtitle: 'Üz tanıma üçün',
              status: status,
              onUpload: () => _submit('Selfi təsdiqi'),
            ),
            const SizedBox(height: 12),
            _VerifyTile(
              icon: Icons.directions_car_outlined,
              title: 'Sürücülük vəsiqəsi',
              subtitle: 'Etibarlı sürücülük vəsiqəsi',
              status: status,
              onUpload: () => _submit('Sürücülük vəsiqəsi'),
            ),
            const SizedBox(height: 20),
            if (AuthMode.isMock && userStatus != 'approved') ...[
              ElevatedButton.icon(
                onPressed: _submitting ? null : _mockApprove,
                icon: const Icon(Icons.verified),
                label: const Text('Mock Təsdiqlə (Geliştirici)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.tealDark,
                ),
              ),
              const SizedBox(height: 20),
            ],
            const _Note(),
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
  final VoidCallback onUpload;

  const _VerifyTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.status,
    required this.onUpload,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = status == VerificationStatus.pending;
    final isApproved = status == VerificationStatus.approved;

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
                StatusBadge(
                  label: status.label,
                  backgroundColor: status.colors.$1,
                  foregroundColor: status.colors.$2,
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: (isPending || isApproved) ? null : onUpload,
            child: Text(isApproved ? 'Təsdiq' : 'Yüklə'),
          ),
        ],
      ),
    );
  }
}

class _Note extends ConsumerWidget {
  const _Note();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
              'Təsdiq prosesi bir neçə dəqiqə çəkə bilər. Status yeniləndikdə Sürücü Paneli aktivləşəcək.',
              style: TextStyle(fontSize: 13, color: AppTheme.slate700),
            ),
          ),
        ],
      ),
    );
  }
}
