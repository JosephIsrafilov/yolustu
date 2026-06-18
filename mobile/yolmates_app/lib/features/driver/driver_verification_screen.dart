import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../auth/state/auth_controller.dart';
import 'package:image_picker/image_picker.dart';

class DriverVerificationScreen extends ConsumerStatefulWidget {
  const DriverVerificationScreen({super.key});

  @override
  ConsumerState<DriverVerificationScreen> createState() =>
      _DriverVerificationScreenState();
}

class _DriverVerificationScreenState
    extends ConsumerState<DriverVerificationScreen> {
  bool _submitting = false;
  String? _selectedDocumentPath;
  final _picker = ImagePicker();

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _selectedDocumentPath = pickedFile.path);
    }
  }

  Future<void> _submit() async {
    if (_selectedDocumentPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Zəhmət olmasa sənəd seçin')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await ref
          .read(authControllerProvider.notifier)
          .submitVerification(_selectedDocumentPath!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Təsdiq üçün göndərildi')),
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
    final l10n = ref.watch(l10nProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Təsdiqləmə')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.spacing16),
          children: [
            if (_submitting)
              const LinearProgressIndicator(color: AppTheme.teal),
            const SizedBox(height: 12),
            if (_selectedDocumentPath != null)
              Container(
                height: 200,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  image: DecorationImage(
                    image: FileImage(File(_selectedDocumentPath!)),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.red),
                    onPressed: () =>
                        setState(() => _selectedDocumentPath = null),
                  ),
                ),
              )
            else
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 150,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(
                        color: AppTheme.tealDark, style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_upload_outlined,
                          size: 48, color: AppTheme.tealDark),
                      SizedBox(height: 12),
                      Text(
                        l10n.uploadDocument,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _submitting || _selectedDocumentPath == null
                    ? null
                    : _submit,
                child: const Text('Təsdiqlə'),
              ),
            ),
            const SizedBox(height: 20),
            if (kDebugMode && userStatus != 'approved') ...[
              ElevatedButton.icon(
                onPressed: _submitting ? null : _mockApprove,
                icon: const Icon(Icons.verified),
                label: Text(l10n.mockApprove),
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

class _Note extends ConsumerWidget {
  const _Note();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
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
              l10n.driverVerificationInfo,
              style: TextStyle(fontSize: 13, color: AppTheme.slate700),
            ),
          ),
        ],
      ),
    );
  }
}
