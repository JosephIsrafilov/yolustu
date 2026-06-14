import 'package:flutter/material.dart';
import '../../../core/theme.dart';

/// Driver vehicle (mock).
class Vehicle {
  final String id;
  final String brand;
  final String model;
  final int year;
  final String color;
  final String plate;
  final int seats;

  const Vehicle({
    required this.id,
    required this.brand,
    required this.model,
    required this.year,
    required this.color,
    required this.plate,
    required this.seats,
  });

  String get displayName => '$brand $model';

  Vehicle copyWith({
    String? brand,
    String? model,
    int? year,
    String? color,
    String? plate,
    int? seats,
  }) {
    return Vehicle(
      id: id,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      year: year ?? this.year,
      color: color ?? this.color,
      plate: plate ?? this.plate,
      seats: seats ?? this.seats,
    );
  }
}

/// Verification status for driver documents.
enum VerificationStatus { notSubmitted, pending, approved, rejected }

extension VerificationStatusX on VerificationStatus {
  String get label {
    switch (this) {
      case VerificationStatus.notSubmitted:
        return 'Göndərilməyib';
      case VerificationStatus.pending:
        return 'Yoxlanılır';
      case VerificationStatus.approved:
        return 'Təsdiqləndi';
      case VerificationStatus.rejected:
        return 'Rədd edildi';
    }
  }

  /// Badge colors (background, foreground).
  (Color, Color) get colors {
    switch (this) {
      case VerificationStatus.approved:
        return (AppTheme.teal.withValues(alpha: 0.1), AppTheme.tealDark);
      case VerificationStatus.pending:
        return (Colors.orange.shade50, Colors.orange.shade700);
      case VerificationStatus.rejected:
        return (Colors.red.shade50, Colors.red.shade700);
      case VerificationStatus.notSubmitted:
        return (AppTheme.slate100, AppTheme.slate700);
    }
  }
}
