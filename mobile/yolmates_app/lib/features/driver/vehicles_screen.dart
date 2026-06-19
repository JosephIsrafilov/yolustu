import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import 'data/driver_controller.dart';
import 'data/vehicle.dart';

class VehiclesScreen extends ConsumerWidget {
  const VehiclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(vehiclesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mənim Avtomobillərim'),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.navy,
        elevation: 0,
      ),
      backgroundColor: AppTheme.slate50,
      body: vehiclesAsync.when(
        data: (vehicles) {
          if (vehicles.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.directions_car_outlined,
                      size: 64, color: AppTheme.slate500),
                  const SizedBox(height: 16),
                  const Text('Avtomobil tapılmadı',
                      style: TextStyle(color: AppTheme.slate500, fontSize: 16)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.push(AppRoutes.addVehicle),
                    child: const Text('Yeni Avtomobil Əlavə Et'),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppConstants.spacing16),
            itemCount: vehicles.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final v = vehicles[index];
              return _VehicleCard(vehicle: v);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('Xəta: $e')),
      ),
      floatingActionButton: vehiclesAsync.valueOrNull?.isNotEmpty == true
          ? FloatingActionButton(
              onPressed: () => context.push(AppRoutes.addVehicle),
              backgroundColor: AppTheme.teal,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }
}

class _VehicleCard extends ConsumerWidget {
  final Vehicle vehicle;

  const _VehicleCard({required this.vehicle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.slate50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.directions_car, color: AppTheme.slate500),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  vehicle.displayName,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppTheme.navy),
                ),
                const SizedBox(height: 4),
                Text(
                  '${vehicle.plate} • ${vehicle.color} • ${vehicle.year}',
                  style:
                      const TextStyle(color: AppTheme.slate500, fontSize: 14),
                ),
                if (vehicle.variations != null &&
                    vehicle.variations!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    vehicle.variations!,
                    style:
                        const TextStyle(color: AppTheme.tealDark, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _Badge(
                      label: vehicle.isActive ? 'Aktiv' : 'Deaktiv',
                      color: vehicle.isActive
                          ? AppTheme.tealDark
                          : AppTheme.slate500,
                    ),
                    if (vehicle.isDefault)
                      const _Badge(
                        label: 'Əsas avtomobil',
                        color: AppTheme.navy,
                      ),
                    _Badge(
                      label: vehicle.verificationStatus.label,
                      color: vehicle.verificationStatus.colors.$2,
                      bgColor: vehicle.verificationStatus.colors.$1,
                    ),
                  ],
                ),
              ],
            ),
          ),
          PopupMenuButton<_VehicleAction>(
            tooltip: 'Avtomobil əməliyyatları',
            onSelected: (action) => _handleAction(context, ref, action),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: _VehicleAction.edit,
                child: Text('Redaktə et'),
              ),
              const PopupMenuItem(
                value: _VehicleAction.documents,
                child: Text('Sənədlər'),
              ),
              if (vehicle.isActive && !vehicle.isDefault)
                const PopupMenuItem(
                  value: _VehicleAction.setDefault,
                  child: Text('Əsas avtomobil et'),
                ),
              if (vehicle.isActive)
                const PopupMenuItem(
                  value: _VehicleAction.deactivate,
                  child: Text('Deaktiv et'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _handleAction(
    BuildContext context,
    WidgetRef ref,
    _VehicleAction action,
  ) async {
    if (action == _VehicleAction.edit) {
      context.push(AppRoutes.addVehicle, extra: vehicle);
      return;
    }
    if (action == _VehicleAction.documents) {
      context.push('/driver/vehicles/${vehicle.id}/documents', extra: vehicle);
      return;
    }

    try {
      final controller = ref.read(vehiclesProvider.notifier);
      if (action == _VehicleAction.setDefault) {
        await controller.setDefault(vehicle.id);
      } else {
        await controller.deactivate(vehicle.id);
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Əməliyyat uğursuz oldu: $error')),
        );
      }
    }
  }
}

enum _VehicleAction { edit, documents, setDefault, deactivate }

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? bgColor;

  const _Badge({required this.label, required this.color, this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor ?? color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
