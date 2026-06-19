import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme.dart';
import 'data/driver_controller.dart';
import 'data/vehicle.dart';

class VehicleDocumentsScreen extends ConsumerStatefulWidget {
  final String vehicleId;
  final Vehicle? vehicle;

  const VehicleDocumentsScreen({
    required this.vehicleId,
    this.vehicle,
    super.key,
  });

  @override
  ConsumerState<VehicleDocumentsScreen> createState() =>
      _VehicleDocumentsScreenState();
}

class _VehicleDocumentsScreenState
    extends ConsumerState<VehicleDocumentsScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  Future<void> _pickAndUpload(String docType) async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image == null) return;

      setState(() => _isUploading = true);

      final controller = ref.read(vehiclesProvider.notifier);
      await controller.uploadDocument(widget.vehicleId, docType, image.path);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sənəd uğurla yükləndi!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xəta baş verdi: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Attempt to get the latest vehicle status from the provider
    final vehiclesAsync = ref.watch(vehiclesProvider);
    final vehicle = vehiclesAsync.valueOrNull?.firstWhere(
          (v) => v.id == widget.vehicleId,
          orElse: () => widget.vehicle!,
        ) ??
        widget.vehicle;

    if (vehicle == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sənədlər')),
        body: const Center(child: Text('Avtomobil tapılmadı')),
      );
    }

    final (bgColor, fgColor) = vehicle.verificationStatus.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sənədlər'),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.navy,
        elevation: 0,
      ),
      backgroundColor: AppTheme.slate50,
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.slate200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      vehicle.displayName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.navy,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text(
                          'Yoxlanış statusu: ',
                          style: TextStyle(color: AppTheme.slate500),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            vehicle.verificationStatus.label,
                            style: TextStyle(
                              color: fgColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Tələb olunan sənədlər',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.navy,
                ),
              ),
              const SizedBox(height: 16),
              _DocumentTypeCard(
                title: 'Nəqliyyat vasitəsinin qeydiyyat şəhadətnaməsi (Texpasport)',
                description: 'Ön və arxa hissəsinin aydın şəkli',
                onUpload: () => _pickAndUpload('registration'),
              ),
              const SizedBox(height: 16),
              _DocumentTypeCard(
                title: 'Sığorta',
                description: 'Etibarlı sığorta şəhadətnaməsi',
                onUpload: () => _pickAndUpload('insurance'),
              ),
              const SizedBox(height: 16),
              _DocumentTypeCard(
                title: 'Texniki Baxış',
                description: 'Texniki baxış sənədi',
                onUpload: () => _pickAndUpload('inspection'),
              ),
            ],
          ),
          if (_isUploading)
            Container(
              color: Colors.black.withValues(alpha: 0.3),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }
}

class _DocumentTypeCard extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback onUpload;

  const _DocumentTypeCard({
    required this.title,
    required this.description,
    required this.onUpload,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.navy,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.slate500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          ElevatedButton.icon(
            onPressed: onUpload,
            icon: const Icon(Icons.upload_file, size: 18),
            label: const Text('Yüklə'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.teal,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
